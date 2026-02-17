import LoanBrochure from "../models/loanBrochureModel.js";
import LoanRequest from "../models/loanRequestModel.js";
import * as trustIndexService from "../services/trustIndexService.js";

export const createBrochure = async (req, res, next) => {
  try {
    const lender = req.user;
    if (lender.currentRole !== "LENDER") {
      throw new Error("You must be in the LENDER role to post a brochure.");
    }
    if (!lender.upiId) {
      throw new Error(
        "Please add your UPI ID in your profile before creating a brochure."
      );
    }
    if (lender.lenderCapital <= 0) {
      throw new Error(
        "Please set your investment capital in your profile before creating a brochure."
      );
    }
    const { amount, interestRate, tenorDays } = req.body;
    if (!amount || !interestRate || !tenorDays) {
      throw new Error("Please provide amount, interestRate, and tenorDays.");
    }
    const availableCapital = lender.lenderCapital - lender.lockedCapital;
    if (amount > availableCapital) {
      throw new Error(
        `Brochure amount (₹${amount}) exceeds your available capital (₹${availableCapital}). Please increase your capital in settings.`
      );
    }
    const newBrochure = await LoanBrochure.create({
      lender: lender.id,
      amount,
      interestRate,
      tenorDays,
    });
    res.status(201).json({
      status: "success",
      data: {
        brochure: newBrochure,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBrochures = async (req, res, next) => {
  try {
    const query = { active: true };
    if (req.user) {
      const maxLoan = trustIndexService.getMaxLoanLimit(req.user.trustIndex);
      query.amount = { $lte: maxLoan };
    }
    const brochures = await LoanBrochure.find(query)
      .populate("lender", "name avatarUrl trustIndex")
      .sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      results: brochures.length,
      data: {
        brochures,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleBrochureStatus = async (req, res, next) => {
  try {
    const lender = req.user;
    const { id } = req.params;

    const brochure = await LoanBrochure.findOne({ _id: id, lender: lender.id });

    if (!brochure) {
      throw new Error("Brochure not found or you are not the owner.");
    }

    brochure.active = !brochure.active;
    await brochure.save();

    const newStatus = brochure.active ? "activated" : "deactivated";

    res.status(200).json({
      status: "success",
      message: `Brochure has been successfully ${newStatus}.`,
      data: {
        brochure,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBrochureDetails = async (req, res, next) => {
  try {
    const lender = req.user;
    const { id } = req.params;

    const brochure = await LoanBrochure.findOne({ _id: id, lender: lender.id });

    if (!brochure) {
      throw new Error("Brochure not found or you are not the owner.");
    }

    // --- Business Rule: Prevent editing if brochure is active in a loan request ---
    const associatedRequest = await LoanRequest.findOne({
      brochureIds: id,
      status: { $in: ["PENDING", "CONTRACTING"] },
    });

    if (associatedRequest) {
      throw new Error(
        "Cannot update a brochure that is part of an active loan request."
      );
    }

    // Filter the request body to only allow updating specific fields
    const { amount, interestRate, tenorDays } = req.body;
    if (amount) brochure.amount = amount;
    if (interestRate) brochure.interestRate = interestRate;
    if (tenorDays) brochure.tenorDays = tenorDays;

    await brochure.save();

    res.status(200).json({
      status: "success",
      message: "Brochure details updated successfully.",
      data: {
        brochure,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBrochure = async (req, res, next) => {
  try {
    const lender = req.user;
    const { id } = req.params;

    const brochure = await LoanBrochure.findOne({ _id: id, lender: lender.id });

    if (!brochure) {
      throw new Error("Brochure not found or you are not the owner.");
    }

    const associatedRequest = await LoanRequest.findOne({
      brochureIds: id,
      status: { $in: ["PENDING", "CONTRACTING"] },
    });

    if (associatedRequest) {
      throw new Error(
        "Cannot delete a brochure that is part of an active loan request. Please deactivate it instead."
      );
    }

    await LoanBrochure.findByIdAndDelete(id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
