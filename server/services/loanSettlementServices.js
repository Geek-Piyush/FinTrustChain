import Contract from "../models/contractModel.js";
import User from "../models/userModel.js";
import LoanRequest from "../models/loanRequestModel.js";
import LoanBrochure from "../models/loanBrochureModel.js";
import PlatformRevenue from "../models/platformRevenueModel.js";
import * as trustIndexService from "./trustIndexService.js";
import * as userService from "./userService.js";
import { createClosurePDF, applySignatureToPDF } from "./pdfService.js";
import { sendLoanDefaultEmail } from "../utils/email.js";

// Helper: release locked capital and reactivate brochures
async function releaseCapital(lenderId, amount) {
  const lender = await User.findById(lenderId);
  if (!lender) return;
  lender.lockedCapital = Math.max(0, lender.lockedCapital - amount);
  await lender.save();

  // Reactivate brochures that can now be funded
  const available = lender.lenderCapital - lender.lockedCapital;
  if (available > 0) {
    await LoanBrochure.updateMany(
      { lender: lenderId, active: false, amount: { $lte: available } },
      { active: true }
    );
  }
}

export async function settleSuccessfulRepayment(contractId) {
  try {
    console.log(`Starting settlement process for Contract ID: ${contractId}`);

    // 1. Fetch the contract and all associated parties
    const contract = await Contract.findById(contractId)
      .populate("receiver")
      .populate("guarantor");

    if (!contract || contract.status === "REPAID") {
      console.log(
        `Contract ${contractId} not found or already repaid. Skipping settlement.`
      );
      return;
    }

    const receiver = contract.receiver;
    const guarantor = contract.guarantor;

    // Find all users who endorsed the receiver at the time of the contract
    const endorsers = await User.find({
      _id: { $in: receiver.endorsementsReceived },
    });

    // --- Calculate TI Gain for the Receiver ---
    const now = new Date();
    const endDate = new Date(contract.endDate);
    const daysEarly = Math.max(
      0,
      Math.floor((endDate - now) / (1000 * 60 * 60 * 24))
    );

    const receiverTIGain = trustIndexService.getLoanRepaymentGain(
      receiver.trustIndex,
      contract.principal,
      daysEarly,
      contract.tenorDays
    );

    // --- Apply TI Updates using the centralized userService ---
    // Update Receiver
    await userService.updateTrustIndex(
      receiver,
      receiverTIGain,
      `Loan Repayment: ${contractId}`
    );
    receiver.successfulRepayments += 1;
    await receiver.save();
    console.log(
      `Updated Receiver ${receiver.name}. TI Gain: ${receiverTIGain}`
    );

    // Update Guarantor
    if (guarantor) {
      const guarantorTIGain =
        trustIndexService.getGuarantorImpact(receiverTIGain);
      await userService.updateTrustIndex(
        guarantor,
        guarantorTIGain,
        `Guaranteed Loan Repaid: ${contractId}`
      );
      console.log(
        `Updated Guarantor ${guarantor.name}. TI Gain: ${guarantorTIGain}`
      );
    }

    // Update Endorsers
    if (endorsers.length > 0) {
      const endorserTIGain = trustIndexService.getEndorserImpact(
        receiverTIGain,
        endorsers.length
      );
      for (const endorser of endorsers) {
        await userService.updateTrustIndex(
          endorser,
          endorserTIGain,
          `Endorsed Loan Repaid: ${contractId}`
        );
        console.log(
          `Updated Endorser ${endorser.name}. TI Gain: ${endorserTIGain}`
        );
      }
    }

    // --- Finalize Contract and Loan Request Status ---
    contract.status = "REPAID";
    await contract.save();

    // --- Generate Closure Agreement PDF (overwrites the contract PDF) ---
    try {
      const lender = await User.findById(contract.lender);
      const closureData = {
        contractId: contract._id.toString().slice(-8).toUpperCase(),
        dateISO: new Date().toISOString().split("T")[0],
        loanAmountDisplay: `₹${contract.principal.toLocaleString("en-IN")}`,
        interestRateDisplay: `${contract.interestRate}%.`,
        repaymentPeriodDisplay: `${contract.tenorDays} days`,
        startDateDisplay: contract.startDate
          ? new Date(contract.startDate).toLocaleDateString("en-GB")
          : "N/A",
        endDateDisplay: contract.endDate
          ? new Date(contract.endDate).toLocaleDateString("en-GB")
          : "N/A",
        receiver: {
          name: receiver.name,
          tiAtSigning: receiver.trustIndex,
        },
        guarantor: {
          name: guarantor ? guarantor.name : "N/A",
          tiAtSigning: guarantor ? guarantor.trustIndex : 0,
        },
        lender: {
          name: lender ? lender.name : "N/A",
          tiAtSigning: lender ? lender.trustIndex : 0,
        },
      };

      await createClosurePDF(closureData, contract.pdfFilename);

      // Re-apply all signatures to the closure PDF
      if (receiver.eSign?.filename) {
        await applySignatureToPDF(contract.pdfFilename, receiver, "receiver");
      }
      if (guarantor?.eSign?.filename) {
        await applySignatureToPDF(contract.pdfFilename, guarantor, "guarantor");
      }
      if (lender?.eSign?.filename) {
        await applySignatureToPDF(contract.pdfFilename, lender, "lender");
      }

      console.log(
        `Closure Agreement PDF generated with signatures: ${contract.pdfFilename}`
      );
    } catch (pdfError) {
      // PDF generation failure should not break the settlement flow
      console.error(
        `Failed to generate Closure Agreement PDF for contract ${contractId}:`,
        pdfError
      );
    }

    await LoanRequest.findByIdAndUpdate(contract.loanRequest, {
      status: "FULFILLED",
    });

    // --- Release locked capital ---
    await releaseCapital(contract.lender, contract.principal);

    // --- Platform fee: 2% of total interest earned ---
    const lender = await User.findById(contract.lender);
    const totalInterest = contract.repaymentSchedule.reduce(
      (sum, emi) => sum + (emi.interest || 0),
      0
    );
    const platformFee = Math.round(totalInterest * 0.02);
    if (platformFee > 0 && (!lender?.premium?.active || lender.premium.plan !== "LENDER")) {
      await PlatformRevenue.create({
        type: "PLATFORM_FEE",
        contract: contract._id,
        user: contract.lender,
        amount: platformFee,
        description: `2% of ₹${totalInterest} interest on contract ${contract.contractId || contract._id}`,
      });
    }

    console.log(
      `Settlement process for Contract ID: ${contractId} completed successfully.`
    );
  } catch (error) {
    console.error(
      `Error during settlement for Contract ID ${contractId}:`,
      error
    );
  }
}

/**
 *  Handles all database and TrustIndex updates after a loan defaults.
 * @param {object} contract - The contract document that has defaulted.
 */
export async function settleDefaultedLoan(contract) {
  try {
    console.log(`Starting default settlement for Contract ID: ${contract._id}`);

    // 1. Fetch all associated parties
    const receiver = await User.findById(contract.receiver);
    const guarantor = await User.findById(contract.guarantor);
    const endorsers = await User.find({
      _id: { $in: receiver.endorsementsReceived },
    });

    // --- Calculate TI Loss for the Receiver ---
    const now = new Date();
    const endDate = new Date(contract.endDate);
    const daysLate = Math.max(
      0,
      Math.floor((now - endDate) / (1000 * 60 * 60 * 24))
    );

    const receiverTILoss = trustIndexService.getLoanDefaultLoss(
      receiver.trustIndex,
      contract.principal,
      daysLate
    );

    // --- Apply TI Updates using the centralized userService ---
    // Update Receiver
    await userService.updateTrustIndex(
      receiver,
      -receiverTILoss,
      `Loan Default: ${contract._id}`
    );
    receiver.defaults += 1;
    await receiver.save();
    console.log(
      `Updated Receiver ${receiver.name}. TI Loss: ${receiverTILoss}`
    );

    // Update Guarantor
    if (guarantor) {
      const guarantorTILoss =
        trustIndexService.getGuarantorImpact(receiverTILoss);
      await userService.updateTrustIndex(
        guarantor,
        -guarantorTILoss,
        `Guaranteed Loan Defaulted: ${contract._id}`
      );
      console.log(
        `Updated Guarantor ${guarantor.name}. TI Loss: ${guarantorTILoss}`
      );
    }

    // Update Endorsers
    if (endorsers.length > 0) {
      const endorserTILoss = trustIndexService.getEndorserImpact(
        receiverTILoss,
        endorsers.length
      );
      for (const endorser of endorsers) {
        await userService.updateTrustIndex(
          endorser,
          -endorserTILoss,
          `Endorsed Loan Defaulted: ${contract._id}`
        );
        console.log(
          `Updated Endorser ${endorser.name}. TI Loss: ${endorserTILoss}`
        );
      }
    }

    // --- Finalize Contract Status ---
    contract.status = "DEFAULT";

    // Calculate guarantor liability as 50% of REMAINING unpaid EMIs,
    // not 50% of the total principal (receiver may have paid some installments)
    const remainingAmount = contract.repaymentSchedule
      .filter((emi) => emi.status !== "PAID")
      .reduce((sum, emi) => sum + emi.amountDue, 0);
    contract.guarantorLiabilityAmount = Math.round(remainingAmount * 0.5);
    contract.guarantorLiabilityPaid = false;
    await contract.save();

    console.log(
      `Default settlement for Contract ID: ${contract._id} completed successfully.`
    );

    // --- Release locked capital ---
    await releaseCapital(contract.lender, contract.principal);

    // Email all affected parties
    const cid = contract.contractId || contract._id;
    await sendLoanDefaultEmail(receiver, cid, receiverTILoss);
    if (guarantor) {
      await sendLoanDefaultEmail(
        guarantor,
        cid,
        trustIndexService.getGuarantorImpact(receiverTILoss)
      );
    }
  } catch (error) {
    console.error(
      `Error during default settlement for Contract ID ${contract._id}:`,
      error
    );
  }
}
