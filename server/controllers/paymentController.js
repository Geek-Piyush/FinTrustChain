import * as paymentService from "../services/paymentService.js";
import { settleSuccessfulRepayment } from "../services/loanSettlementServices.js";
import { phonepeClient } from "../services/paymentService.js";
import Contract from "../models/contractModel.js";
import Transaction from "../models/transactionModel.js";
import PlatformRevenue from "../models/platformRevenueModel.js";
import { sendPaymentReceivedEmail } from "../utils/email.js";

// POST /payments/pay
export const createPayment = async (req, res, next) => {
  try {
    const user = req.user;
    const { contractId } = req.body;
    if (!contractId) {
      throw new Error("Contract ID is required to initiate a payment.");
    }
    const contract = await Contract.findById(contractId);

    if (!contract) {
      throw new Error("Contract not found.");
    }
    // Ensure only the receiver can pay and only when the loan is active.
    if (!contract.receiver.equals(user._id)) {
      throw new Error(
        "You are not authorized to make payments for this contract."
      );
    }
    if (contract.status !== "ACTIVE") {
      throw new Error("Payments can only be made on active loans.");
    }

    // Find the next pending EMI
    const nextEMI = contract.repaymentSchedule.find(
      (emi) => emi.status === "PENDING"
    );

    if (!nextEMI) {
      throw new Error("All EMIs have already been paid for this contract.");
    }

    const redirectUrl = await paymentService.initiatePayment(
      contractId,
      user,
      nextEMI.amountDue,
      "EMI",
      nextEMI.emiNumber
    );
    res.status(200).json({
      status: "success",
      message: `EMI #${nextEMI.emiNumber} payment initiated successfully.`,
      data: {
        redirectUrl,
        emiNumber: nextEMI.emiNumber,
        amount: nextEMI.amountDue,
      },
    });
  } catch (error) {
    next(error);
  }
};

import crypto from "crypto";

/**
 * Server-to-server verification with PhonePe.
 * Calls PhonePe's Order Status API to confirm the payment actually succeeded.
 * This prevents forged callbacks from being accepted.
 */
async function verifyPaymentServerSide(merchantOrderId) {
  try {
    if (process.env.NODE_ENV === "development") {
      // In dev, we already validated the HMAC — skip the PhonePe API call
      // because sandbox may not have real order data.
      console.log(
        `[DEV] Skipping PhonePe status check for ${merchantOrderId} (HMAC already verified).`
      );
      return true;
    }

    const statusResponse = await phonepeClient.getOrderStatus(merchantOrderId);
    const state = statusResponse?.state;

    if (state === "COMPLETED") {
      console.log(`✅ PhonePe verified: ${merchantOrderId} is COMPLETED.`);
      return true;
    }

    console.error(
      `❌ PhonePe status for ${merchantOrderId}: ${state || "UNKNOWN"}`
    );
    return false;
  } catch (err) {
    console.error(
      `PhonePe status check failed for ${merchantOrderId}:`,
      err.message
    );
    return false;
  }
}

// POST /payments/callback
// Server-to-server webhook from PhonePe. Never exposed to frontend.
export const handleCallback = async (req, res, next) => {
  try {
    let callbackResponse;

    // ── Step 1: Validate the incoming callback ──
    // In ALL environments, we validate. No bypasses.
    const authorizationHeader = req.headers["authorization"];
    const responseBodyString = JSON.stringify(req.body);

    if (process.env.NODE_ENV === "development") {
      // Dev: validate using HMAC shared secret instead of PhonePe credentials
      const hmacSecret = process.env.CALLBACK_HMAC_SECRET;
      if (!hmacSecret) {
        console.warn(
          "⚠ CALLBACK_HMAC_SECRET not set. Rejecting callback in dev mode."
        );
        return res.status(401).send("HMAC secret not configured.");
      }

      // Expect header: "HMAC <hex-digest>"
      if (!authorizationHeader || !authorizationHeader.startsWith("HMAC ")) {
        return res.status(401).send("Missing or invalid HMAC authorization.");
      }

      const receivedHmac = authorizationHeader.slice(5);
      const expectedHmac = crypto
        .createHmac("sha256", hmacSecret)
        .update(responseBodyString)
        .digest("hex");

      if (
        !crypto.timingSafeEqual(
          Buffer.from(receivedHmac, "hex"),
          Buffer.from(expectedHmac, "hex")
        )
      ) {
        console.error("HMAC signature mismatch — rejecting callback.");
        return res.status(401).send("Invalid HMAC signature.");
      }

      callbackResponse = {
        type: req.body.type,
        payload: req.body.payload,
      };
    } else {
      // Production: validate with PhonePe SDK credentials
      const client = phonepeClient;
      const usernameConfigured = process.env.PHONEPE_WEBHOOK_USERNAME;
      const passwordConfigured = process.env.PHONEPE_WEBHOOK_PASSWORD;

      callbackResponse = client.validateCallback(
        usernameConfigured,
        passwordConfigured,
        authorizationHeader,
        responseBodyString
      );
    }

    // ── Step 2: Server-to-server payment status verification ──
    // Never trust the callback payload alone — confirm with PhonePe API.
    const eventType = callbackResponse.type;
    const payload = callbackResponse.payload;
    const merchantOrderId = payload.originalMerchantOrderId;

    console.log(`Received callback event: ${eventType}, order: ${merchantOrderId}`);

    if (eventType === "CHECKOUT_ORDER_COMPLETED") {
      // Verify with PhonePe server that payment actually succeeded
      const isVerified = await verifyPaymentServerSide(merchantOrderId);
      if (!isVerified) {
        console.error(
          `Server-side verification FAILED for order ${merchantOrderId}. Rejecting.`
        );
        return res.status(400).send("Payment verification failed.");
      }

      // ── Step 3: Idempotency check ──
      // Prevent duplicate processing from replayed callbacks
      const existingTxn = await Transaction.findOne({
        paymentTransactionId: merchantOrderId,
      });
      if (existingTxn) {
        console.log(
          `Order ${merchantOrderId} already processed. Skipping duplicate.`
        );
        return res.status(200).send();
      }

      const contractId = payload.metaInfo.contractId;
      const paymentType = payload.metaInfo.paymentType || "EMI";

      if (paymentType === "DISBURSAL") {
        // Handle disbursal payment completion
        console.log("Processing DISBURSAL payment for contract:", contractId);

        const contract = await Contract.findById(contractId)
          .populate("lender")
          .populate("receiver");

        if (!contract) {
          console.error("Contract not found:", contractId);
          return res.status(200).send();
        }

        console.log("Contract status:", contract.status);

        // Allow both AWAITING_DISBURSAL and AWAITING_RECEIPT_CONFIRMATION
        // (in case callback is called multiple times)
        if (
          contract.status === "AWAITING_DISBURSAL" ||
          contract.status === "AWAITING_RECEIPT_CONFIRMATION"
        ) {
          console.log("Creating new transaction for disbursal");
          // Create a transaction record for the disbursal
          await Transaction.create({
            contract: contract._id,
            fromUser: contract.lender._id,
            toUser: contract.receiver._id,
            amount: contract.principal,
            status: "DISBURSED",
            proofOfPaymentFilename: `phonepe_${merchantOrderId}`,
            paymentTransactionId: merchantOrderId,
          });
          console.log("Transaction created successfully");

          if (contract.status !== "AWAITING_RECEIPT_CONFIRMATION") {
            contract.status = "AWAITING_RECEIPT_CONFIRMATION";
            await contract.save();
            console.log(
              "Contract status updated to AWAITING_RECEIPT_CONFIRMATION"
            );
          }

          console.log(
            `Disbursal payment completed for Contract ${contractId}. Transaction created and status updated.`
          );
        } else {
          console.log(
            `Contract ${contractId} is in status ${contract.status}, skipping disbursal processing`
          );
        }
      } else if (paymentType === "GUARANTOR_PAY") {
        // Handle guarantor liability payment
        console.log(
          `Processing GUARANTOR_PAY for contract: ${contractId}`
        );

        const contract = await Contract.findById(contractId)
          .populate("lender")
          .populate("receiver")
          .populate("guarantor");

        if (!contract) {
          console.error("Contract not found:", contractId);
          return res.status(200).send();
        }

        if (contract.status !== "DEFAULT") {
          console.log(
            `Contract ${contractId} is not in DEFAULT status, skipping guarantor payment`
          );
          return res.status(200).send();
        }

        if (contract.guarantorLiabilityPaid) {
          console.log(
            `Guarantor liability already paid for contract ${contractId}`
          );
          return res.status(200).send();
        }

        // Mark liability as paid
        contract.guarantorLiabilityPaid = true;
        await contract.save();

        const liabilityAmount =
          contract.guarantorLiabilityAmount ||
          Math.round(contract.principal * 0.5);

        // Create a transaction record
        await Transaction.create({
          contract: contract._id,
          fromUser: contract.guarantor._id,
          toUser: contract.lender._id,
          amount: liabilityAmount,
          status: "GUARANTOR_SETTLEMENT",
          paymentTransactionId: payload.originalMerchantOrderId,
        });

        console.log(
          `Guarantor liability settled for contract ${contractId}. Amount: ${liabilityAmount}`
        );
      } else {
        // Handle EMI payment
        const emiNumber = payload.metaInfo.emiNumber
          ? parseInt(payload.metaInfo.emiNumber)
          : null;

        console.log(
          `Processing EMI payment for contract: ${contractId}, EMI #${emiNumber}`
        );

        const contract = await Contract.findById(contractId)
          .populate("lender")
          .populate("receiver");

        if (!contract) {
          console.error("Contract not found:", contractId);
          return res.status(200).send();
        }

        if (emiNumber && contract.repaymentSchedule.length > 0) {
          // Mark the specific EMI as PAID
          const emi = contract.repaymentSchedule.find(
            (e) => e.emiNumber === emiNumber
          );

          if (emi && (emi.status === "PENDING" || emi.status === "OVERDUE")) {
            emi.status = "PAID";
            emi.paidAt = new Date();

            // Reset consecutive overdue counter — the penalty cycle
            // restarts from 25% for the next overdue EMI
            contract.consecutiveOverdueCount = 0;

            // Create a transaction record for this EMI payment
            await Transaction.create({
              contract: contract._id,
              fromUser: contract.receiver._id,
              toUser: contract.lender._id,
              amount: emi.amountDue,
              status: "SUCCESS",
              emiNumber: emiNumber,
              paymentTransactionId: payload.originalMerchantOrderId,
            });

            await contract.save();

            console.log(
              `EMI #${emiNumber} marked as PAID for contract ${contractId}. Overdue counter reset.`
            );

            // --- Convenience fee: ₹5 for EMI ≤₹5000, ₹10 for >₹5000 ---
            const receiver = contract.receiver;
            const isPremiumReceiver =
              receiver?.premium?.active && receiver.premium.plan === "RECEIVER";
            if (!isPremiumReceiver) {
              const convenienceFee = emi.amountDue <= 5000 ? 5 : 10;
              await PlatformRevenue.create({
                type: "CONVENIENCE_FEE",
                contract: contract._id,
                user: receiver._id,
                amount: convenienceFee,
                description: `EMI #${emiNumber} convenience fee`,
              });
            }

            // Email lender about the received payment
            if (contract.lender?.email) {
              await sendPaymentReceivedEmail(
                contract.lender,
                contract.contractId || contractId,
                emiNumber,
                emi.amountDue
              );
            }

            // Check if ALL EMIs are now paid
            const allPaid = contract.repaymentSchedule.every(
              (e) => e.status === "PAID"
            );

            if (allPaid) {
              console.log(
                `All EMIs paid for contract ${contractId}. Settling loan.`
              );
              settleSuccessfulRepayment(contractId);
            } else {
              const remaining = contract.repaymentSchedule.filter(
                (e) => e.status === "PENDING" || e.status === "OVERDUE"
              ).length;
              console.log(
                `${remaining} EMI(s) remaining for contract ${contractId}`
              );
            }
          } else {
            console.log(
              `EMI #${emiNumber} not found or already paid for contract ${contractId}`
            );
          }
        } else {
          // Fallback: old-style full payment (for contracts without EMI schedule)
          console.log(
            `No EMI schedule found, settling full repayment for contract ${contractId}`
          );
          settleSuccessfulRepayment(contractId);
        }
      }
    } else if (eventType === "CHECKOUT_ORDER_FAILED") {
      console.error(
        `Payment failed for Order ID: ${payload.originalMerchantOrderId}.`
      );
    }

    res.status(200).send();
  } catch (error) {
    console.error("Callback validation failed:", error.message);
    res.status(400).send("Callback validation failed");
  }
};
