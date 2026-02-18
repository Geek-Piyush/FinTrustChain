import LoanRequest from "../models/loanRequestModel.js";
import LoanBrochure from "../models/loanBrochureModel.js";
import User from "../models/userModel.js";
import { createContract } from "./contractController.js";

// GET /lender/brochures - Get all brochures for logged-in lender
export const getMyBrochures = async (req, res, next) => {
  try {
    const lender = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { lender: lender.id };

    const [brochures, total] = await Promise.all([
      LoanBrochure.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LoanBrochure.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      results: brochures.length,
      totalPages: Math.ceil(total / limit),
      page,
      data: {
        brochures,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /lender/requests

export const getMyLoanRequests = async (req, res, next) => {
  try {
    const lender = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find all of the lender's active brochures
    const myBrochures = await LoanBrochure.find({
      lender: lender.id,
      active: true,
    }).select("_id");
    const myBrochureIds = myBrochures.map(b => b.id);

    // Find all loan requests that have a guarantor accepted and are ready for a lender
    const requestQuery = {
      brochureIds: { $in: myBrochureIds },
      status: "GUARANTOR_ACCEPTED",
    };

    const [requests, total] = await Promise.all([
      LoanRequest.find(requestQuery)
        .populate("receiver", "name avatarUrl trustIndex")
        .skip(skip)
        .limit(limit),
      LoanRequest.countDocuments(requestQuery),
    ]);

    res.status(200).json({
      status: "success",
      results: requests.length,
      totalPages: Math.ceil(total / limit),
      page,
      data: {
        requests,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /lender/requests/:id/accept

export const acceptLoanRequest = async (req, res, next) => {
  try {
    const lender = req.user;
    const loanRequestId = req.params.id;

    const request = await LoanRequest.findById(loanRequestId);

    // Check if the request is in the correct state to be accepted
    if (!request || request.status !== "GUARANTOR_ACCEPTED") {
      throw new Error(
        "This loan request is not valid or has already been actioned."
      );
    }

    // Find which of the lender's brochures is in this request
    const myBrochureInRequest = await LoanBrochure.findOne({
      lender: lender.id,
      _id: { $in: request.brochureIds },
    });

    if (!myBrochureInRequest) {
      throw new Error(
        "You are not authorized to accept this request as it does not correspond to one of your brochures."
      );
    }

    // --- Capital Check ---
    const freshLender = await User.findById(lender.id).select("+upiId");
    const available = freshLender.lenderCapital - freshLender.lockedCapital;
    if (myBrochureInRequest.amount > available) {
      throw new Error(
        `Insufficient capital. Need ₹${myBrochureInRequest.amount} but only ₹${available} available.`
      );
    }

    // --- Lock Capital ---
    freshLender.lockedCapital += myBrochureInRequest.amount;
    await freshLender.save();

    // --- Update Loan Request Status ---
    request.status = "CONTRACTING";
    request.selectedBrochure = myBrochureInRequest.id;
    await request.save();

    // --- 2. CRITICAL STEP: Trigger Contract Creation ---
    const newContract = await createContract(loanRequestId);

    // --- Auto-deactivate brochures exceeding available capital ---
    const updatedAvailable = freshLender.lenderCapital - freshLender.lockedCapital;
    await LoanBrochure.updateMany(
      { lender: lender.id, active: true, amount: { $gt: updatedAvailable } },
      { active: false }
    );

    res.status(200).json({
      status: "success",
      message:
        "Request accepted. A contract has been generated and is ready for signatures.",
      data: {
        loanRequest: request,
        contract: newContract,
      },
    });
  } catch (error) {
    next(error);
  }
};
