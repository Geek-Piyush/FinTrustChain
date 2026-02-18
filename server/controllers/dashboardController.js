import Contract from "../models/contractModel.js";
import GuarantorRequest from "../models/guarantorRequestModel.js";
import LoanRequest from "../models/loanRequestModel.js";
import LoanBrochure from "../models/loanBrochureModel.js";
import User from "../models/userModel.js";
import * as trustIndexService from "../services/trustIndexService.js";

// GET /dashboard/my-stats

export const getMyStats = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

//  GET /dashboard/my-active-contracts

export const getMyActiveContracts = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

//GET /dashboard/my-pending-actions

export const getMyPendingActions = async (req, res, next) => {
  try {
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
    const myBrochures = await LoanBrochure.find({ lender: userId }).select(
      "_id"
    );
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
  } catch (error) {
    next(error);
  }
};

// GET /dashboard/ti-history

export const getMyTiHistory = (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      tiHistory: req.user.tiHistory,
    },
  });
};

export const getMyEndorsers = async (req, res, next) => {
  try {
    // The 'protect' middleware gives us req.user, which already contains the IDs.
    // We just need to populate them to get the full user details.
    const user = await User.findById(req.user.id).populate(
      "endorsementsReceived",
      "name avatarUrl trustIndex"
    );
    if (!user) {
      throw new Error("User not found.");
    }

    res.status(200).json({
      status: "success",
      results: user.endorsementsReceived.length,
      data: {
        endorsers: user.endorsementsReceived,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEligibleGuarantors = async (req, res, next) => {
  try {
    // Find the logged-in user and populate the endorsementsReceived field
    const user = await User.findById(req.user.id).populate(
      "endorsementsReceived",
      "name"
    );

    if (!user) {
      throw new Error("User not found.");
    }

    res.status(200).json({
      status: "success",
      results: user.endorsementsReceived.length,
      data: {
        eligibleGuarantors: user.endorsementsReceived,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEligibleBrochures = async (req, res, next) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (user.currentRole !== "RECEIVER") {
      throw new Error("Only receivers can view eligible brochures");
    }

    // Get user's max loan limit based on TI
    const maxLoanLimit = trustIndexService.getMaxLoanLimit(user.trustIndex);

    // Find active brochures within the user's limit
    // Exclude brochures from the user themselves (if they're also a lender)
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
  } catch (error) {
    next(error);
  }
};
