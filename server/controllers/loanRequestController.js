import LoanRequest from "../models/loanRequestModel.js";
import LoanBrochure from "../models/loanBrochureModel.js";
import GuarantorRequest from "../models/guarantorRequestModel.js";
import * as trustIndexService from "../services/trustIndexService.js";

export const getMy = async (req, res, next) => {
  try {
    const loanRequests = await LoanRequest.find({ receiver: req.user._id })
      .populate("receiver", "name email trustIndex")
      .populate("guarantor", "name email trustIndex")
      .populate("brochureIds")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: loanRequests.length,
      data: {
        loanRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelLoanRequest = async (req, res, next) => {
  try {
    const loanRequest = await LoanRequest.findById(req.params.id);

    if (!loanRequest) {
      throw new Error("Loan request not found");
    }

    if (loanRequest.receiver.toString() !== req.user._id.toString()) {
      throw new Error("You can only cancel your own loan requests");
    }

    if (
      loanRequest.status !== "PENDING" &&
      loanRequest.status !== "GUARANTOR_ACCEPTED"
    ) {
      throw new Error("Only pending loan requests can be cancelled");
    }

    loanRequest.status = "CANCELLED";
    await loanRequest.save();

    res.status(200).json({
      status: "success",
      message: "Loan request cancelled successfully",
      data: {
        loanRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createLoanRequest = async (req, res, next) => {
  try {
    const receiver = req.user;
    const { brochureIds, guarantorId } = req.body;

    // --- 1. Validation ---
    if (receiver.currentRole !== "RECEIVER") {
      throw new Error("You must be in the RECEIVER role to request a loan.");
    }
    if (!receiver.upiId) {
      throw new Error(
        "Please add your UPI ID in your profile before applying for a loan."
      );
    }
    if (!brochureIds || brochureIds.length === 0 || brochureIds.length > 3) {
      throw new Error(
        "You must select between 1 and 3 brochures to apply for."
      );
    }
    if (!guarantorId) {
      throw new Error("You must select a guarantor for this loan request.");
    }

    // Validate guarantor
    if (receiver.id === guarantorId) {
      throw new Error("You cannot request yourself to be a guarantor.");
    }

    // Check if the potential guarantor has endorsed the receiver
    if (!receiver.endorsementsReceived.includes(guarantorId)) {
      throw new Error(
        "You can only request a user to be your guarantor if they have already endorsed you."
      );
    }

    // Check for existing active loan requests
    const existingActiveRequest = await LoanRequest.findOne({
      receiver: receiver.id,
      status: { $in: ["PENDING", "GUARANTOR_ACCEPTED", "CONTRACTING"] },
    });
    if (existingActiveRequest) {
      throw new Error("You already have an active loan request.");
    }

    // --- 2. Brochure and Eligibility Validation ---
    const brochures = await LoanBrochure.find({
      _id: { $in: brochureIds },
      active: true,
    });
    if (brochures.length !== brochureIds.length) {
      throw new Error(
        "One or more of the selected brochures are invalid or no longer active."
      );
    }

    const maxLoan = trustIndexService.getMaxLoanLimit(receiver.trustIndex);
    for (const brochure of brochures) {
      if (brochure.amount > maxLoan) {
        throw new Error(
          `Your TrustIndex of ${receiver.trustIndex} makes you ineligible for a loan of amount ${brochure.amount}. Your maximum eligible amount is ${maxLoan}.`
        );
      }
    }

    // --- 3. Create the Loan Request ---
    const newLoanRequest = await LoanRequest.create({
      receiver: receiver.id,
      brochureIds,
    });

    // --- 4. Create the Guarantor Request automatically ---
    const guarantorRequest = await GuarantorRequest.create({
      receiver: receiver.id,
      guarantor: guarantorId,
      loanRequest: newLoanRequest._id,
    });

    res.status(201).json({
      status: "success",
      message:
        "Loan request created successfully. Guarantor request has been sent.",
      data: {
        loanRequest: newLoanRequest,
        guarantorRequest: guarantorRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};
