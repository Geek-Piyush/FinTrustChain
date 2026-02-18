import cron from "node-cron";
import Contract from "../models/contractModel.js";
import User from "../models/userModel.js";
import CronLock from "../models/cronLockModel.js";
import { settleDefaultedLoan } from "../services/loanSettlementServices.js";
import * as trustIndexService from "../services/trustIndexService.js";
import * as userService from "../services/userService.js";
import { createNotification } from "../services/notificationService.js";
import { sendOverdueEMIEmail } from "../utils/email.js";

const checkOverdueConfirmations = async () => {
  const lockAcquired = await CronLock.acquire("checkOverdueConfirmations", 5 * 60 * 1000);
  if (!lockAcquired) {
    console.log("checkOverdueConfirmations: skipped (another instance holds the lock)");
    return;
  }
  console.log(
    "Running scheduled job: Checking for overdue receipt confirmations..."
  );
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const overdueContracts = await Contract.find({
      status: "AWAITING_RECEIPT_CONFIRMATION",
      updatedAt: { $lte: twentyFourHoursAgo },
    }).populate("receiver");
    if (overdueContracts.length === 0) {
      console.log("No overdue contracts found. Job finished.");
      return;
    }
    console.log(
      `Found ${overdueContracts.length} overdue contract(s) to process.`
    );
    await Promise.all(
      overdueContracts.map(async (contract) => {
        const receiver = contract.receiver;
        if (receiver && receiver.status !== "BLOCKED") {
          receiver.status = "BLOCKED";
          await receiver.save();
          console.log(
            `User ${receiver.name} (ID: ${receiver._id}) has been BLOCKED for not confirming receipt on time for Contract ID: ${contract._id}.`
          );
        }
      })
    );
  } catch (error) {
    console.error("Error during scheduled job execution:", error);
  } finally {
    await CronLock.release("checkOverdueConfirmations");
  }
};

export const checkLoanDefaults = async () => {
  const lockAcquired = await CronLock.acquire("checkLoanDefaults", 10 * 60 * 1000);
  if (!lockAcquired) {
    console.log("checkLoanDefaults: skipped (another instance holds the lock)");
    return;
  }
  console.log("Running scheduled job: Checking for loan defaults...");
  try {
    const now = new Date();

    // Find all contracts that are still 'ACTIVE' but whose 'endDate' is in the past.
    const overdueContracts = await Contract.find({
      status: "ACTIVE",
      endDate: { $lt: now },
    });

    if (overdueContracts.length === 0) {
      console.log("No defaulted loans found. Job finished.");
      return;
    }

    console.log(
      `Found ${overdueContracts.length} defaulted loan(s) to process.`
    );

    // Process each defaulted loan using our settlement service
    await Promise.all(
      overdueContracts.map((contract) => settleDefaultedLoan(contract))
    );
  } catch (error) {
    console.error("Error during loan default check:", error);
  } finally {
    await CronLock.release("checkLoanDefaults");
  }
};

/**
 * Checks for individual EMIs whose dueDate has passed but are still PENDING.
 * Marks them as OVERDUE and applies a ONE-TIME progressive TI penalty:
 *   - 1st consecutive overdue: 25% of full-default TI loss
 *   - 2nd consecutive overdue: 30%
 *   - 3rd consecutive overdue: 35%  ...and so on (+5% each)
 *
 * The penalty is applied EXACTLY ONCE per EMI (tracked by penaltyApplied flag).
 * When the receiver pays an EMI, consecutiveOverdueCount resets to 0 and
 * the penalty cycle restarts at 25%.
 *
 * This does NOT default the loan — default only happens when endDate passes.
 */
export const checkOverdueEMIs = async () => {
  const lockAcquired = await CronLock.acquire("checkOverdueEMIs", 15 * 60 * 1000);
  if (!lockAcquired) {
    console.log("checkOverdueEMIs: skipped (another instance holds the lock)");
    return;
  }
  console.log("Running scheduled job: Checking for overdue EMIs...");
  try {
    const now = new Date();

    // Find ACTIVE contracts that have at least one EMI past due and still PENDING
    const contracts = await Contract.find({
      status: "ACTIVE",
      "repaymentSchedule.dueDate": { $lt: now },
      "repaymentSchedule.status": "PENDING",
    });

    if (contracts.length === 0) {
      console.log("No overdue EMIs found. Job finished.");
      return;
    }

    // Process each contract in parallel (inner EMI loop stays sequential
    // because the progressive penalty counter is order-dependent)
    const results = await Promise.all(
      contracts.map(async (contract) => {
        const newlyOverdueEMIs = contract.repaymentSchedule.filter(
          (emi) =>
            emi.status === "PENDING" &&
            new Date(emi.dueDate) < now &&
            !emi.penaltyApplied
        );

        if (newlyOverdueEMIs.length === 0) return 0;

        const receiver = await User.findById(contract.receiver);
        if (!receiver) return 0;

        // Sort by EMI number to process in order (important for progressive penalty)
        newlyOverdueEMIs.sort((a, b) => a.emiNumber - b.emiNumber);

        let marked = 0;
        for (const emi of newlyOverdueEMIs) {
          // Increment consecutive overdue counter
          contract.consecutiveOverdueCount =
            (contract.consecutiveOverdueCount || 0) + 1;

          // Progressive penalty: 25% for 1st, 30% for 2nd, 35% for 3rd, etc.
          const penaltyPercent =
            0.25 + (contract.consecutiveOverdueCount - 1) * 0.05;

          // Calculate the base default loss (what they'd lose on full default)
          const fullDefaultLoss = trustIndexService.getLoanDefaultLoss(
            receiver.trustIndex,
            contract.principal,
            0
          );

          const deduction = Math.max(
            1,
            Math.min(
              Math.floor(fullDefaultLoss * penaltyPercent),
              receiver.trustIndex
            )
          );

          // Mark overdue + flag as penalized (won't fire again)
          emi.status = "OVERDUE";
          emi.penaltyApplied = true;
          marked++;

          // Apply TI deduction
          await userService.updateTrustIndex(
            receiver,
            -deduction,
            `Overdue EMI #${emi.emiNumber} on Contract ${contract._id}`
          );

          const percentLabel = Math.round(penaltyPercent * 100);

          // Notify with exact numbers
          await createNotification(
            receiver,
            `⚠️ EMI #${emi.emiNumber} is overdue! ${deduction} points (${percentLabel}% penalty) have been deducted from your TrustIndex (now ${receiver.trustIndex}). Pay your dues to stop further penalties on upcoming EMIs.`,
            `/debts`
          );

          // Send email notification
          await sendOverdueEMIEmail(
            receiver,
            contract.contractId || contract._id,
            emi.emiNumber,
            deduction,
            receiver.trustIndex,
            percentLabel
          );

          console.log(
            `EMI #${emi.emiNumber} on Contract ${contract._id} → OVERDUE. ` +
              `Penalty: -${deduction} TI (${percentLabel}%, consecutive #${contract.consecutiveOverdueCount}). ` +
              `Receiver: ${receiver.name}, TI: ${receiver.trustIndex}`
          );
        }

        await contract.save();
        return marked;
      })
    );

    const totalMarked = results.reduce((sum, n) => sum + n, 0);

    console.log(
      `Overdue EMI check complete. ${totalMarked} EMI(s) newly marked OVERDUE.`
    );
  } catch (error) {
    console.error("Error during overdue EMI check:", error);
  } finally {
    await CronLock.release("checkOverdueEMIs");
  }
};

export const startScheduler = () => {
  // Runs at minute 0 of every hour
  cron.schedule("0 * * * *", checkOverdueConfirmations);

  // Runs once a day at midnight — checks entire tenure expiry → DEFAULT
  cron.schedule("0 0 * * *", checkLoanDefaults);

  // Runs once a day at 6 AM — checks individual EMI due dates → OVERDUE
  // Idempotent: penaltyApplied flag ensures each EMI is penalized only once
  cron.schedule("0 6 * * *", checkOverdueEMIs);

  console.log(
    "Scheduler started. Jobs for overdue confirmations, loan defaults, and overdue EMIs are running."
  );
};
