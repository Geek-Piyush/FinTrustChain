import Contract from "../models/contractModel.js";
import GuarantorRequest from "../models/guarantorRequestModel.js";
import LoanRequest from "../models/loanRequestModel.js";
import LoanBrochure from "../models/loanBrochureModel.js";
import User from "../models/userModel.js";
import * as trustIndexService from "../services/trustIndexService.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

// GET /dashboard/my-stats
export const getMyStats = asyncHandler(async (req, res) => {
  const user = req.user;

  // Count active contracts where the user is the receiver or lender
  const activeContractsAsReceiver = await Contract.countDocuments({
    receiver: user._id,
    status: "ACTIVE",
  });
  const activeContractsAsLender = await Contract.countDocuments({
    lender: user._id,
    status: "ACTIVE",
  });

  res.status(200).json({
    status: "success",
    data: {
      stats: {
        trustIndex: user.trustIndex,
        eligibleLoan: user.milestones.eligibleLoan,
        endorsementsGiven: user.endorsementsGiven.length,
        endorsementsReceived: user.endorsementsReceived.length,
        successfulRepayments: user.successfulRepayments,
        defaults: user.defaults,
        activeLoansAsReceiver: activeContractsAsReceiver,
        activeLoansAsLender: activeContractsAsLender,
      },
    },
  });
});

// GET /dashboard/my-active-contracts
export const getMyActiveContracts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {
    $or: [{ receiver: userId }, { lender: userId }, { guarantor: userId }],
  };

  const [contracts, total] = await Promise.all([
    Contract.find(query)
      .populate("lender receiver guarantor", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Contract.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: contracts.length,
    totalPages: Math.ceil(total / limit),
    page,
    data: {
      contracts,
    },
  });
});

// GET /dashboard/my-pending-actions
export const getMyPendingActions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Find contracts awaiting this user's signature
  const sigQuery = {
    $or: [
      { receiver: userId, "signatures.receiver": false },
      { guarantor: userId, "signatures.guarantor": false },
      { lender: userId, "signatures.lender": false },
    ],
    status: "PENDING_SIGNATURES",
  };

  const [contractsToSign, totalContracts] = await Promise.all([
    Contract.find(sigQuery).skip(skip).limit(limit),
    Contract.countDocuments(sigQuery),
  ]);

  // Find guarantor requests sent to this user
  const grQuery = { guarantor: userId, status: "PENDING" };
  const [guarantorRequests, totalGR] = await Promise.all([
    GuarantorRequest.find(grQuery)
      .populate("receiver", "name avatarUrl")
      .skip(skip)
      .limit(limit),
    GuarantorRequest.countDocuments(grQuery),
  ]);

  // Find loan requests for this lender's brochures
  const myBrochures = await LoanBrochure.find({ lender: userId }).select("_id");
  const myBrochureIds = myBrochures.map(b => b.id);
  const lrQuery = {
    brochureIds: { $in: myBrochureIds },
    status: "GUARANTOR_ACCEPTED",
  };
  const [loanRequests, totalLR] = await Promise.all([
    LoanRequest.find(lrQuery)
      .populate("receiver", "name avatarUrl")
      .skip(skip)
      .limit(limit),
    LoanRequest.countDocuments(lrQuery),
  ]);

  res.status(200).json({
    status: "success",
    page,
    data: {
      pendingActions: {
        contractsToSign,
        contractsToSignTotal: totalContracts,
        guarantorRequests,
        guarantorRequestsTotal: totalGR,
        loanRequests,
        loanRequestsTotal: totalLR,
      },
    },
  });
});

// GET /dashboard/ti-history
export const getMyTiHistory = asyncHandler(async (req, res) => {
  // Re-fetch from DB so the response always reflects the capped, stored
  // tiHistory rather than whatever the auth-middleware cached in req.user.
  const user = await User.findById(req.user._id).select("tiHistory").lean();

  res.status(200).json({
    status: "success",
    data: {
      tiHistory: user?.tiHistory ?? [],
    },
  });
});

export const getMyEndorsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate(
    "endorsementsReceived",
    "name avatarUrl trustIndex",
  );
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  res.status(200).json({
    status: "success",
    results: user.endorsementsReceived.length,
    data: {
      endorsers: user.endorsementsReceived,
    },
  });
});

export const getEligibleGuarantors = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate(
    "endorsementsReceived",
    "name",
  );

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  res.status(200).json({
    status: "success",
    results: user.endorsementsReceived.length,
    data: {
      eligibleGuarantors: user.endorsementsReceived,
    },
  });
});

export const getEligibleBrochures = asyncHandler(async (req, res) => {
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  if (user.currentRole !== "RECEIVER") {
    throw new AppError("Only receivers can view eligible brochures", 403);
  }

  // Get user's max loan limit based on TI
  const maxLoanLimit = trustIndexService.getMaxLoanLimit(user.trustIndex);

  // Find active brochures within the user's limit
  const query = {
    active: true,
    amount: { $lte: maxLoanLimit },
    lender: { $ne: user._id },
  };

  const [brochures, total] = await Promise.all([
    LoanBrochure.find(query)
      .populate("lender", "name email trustIndex")
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
      maxEligibleAmount: maxLoanLimit,
    },
  });
});
