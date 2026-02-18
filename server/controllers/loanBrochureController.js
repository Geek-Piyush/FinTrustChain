import LoanBrochure from "../models/loanBrochureModel.js";
import LoanRequest from "../models/loanRequestModel.js";
import * as trustIndexService from "../services/trustIndexService.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

export const createBrochure = asyncHandler(async (req, res) => {
  const lender = req.user;
  if (lender.currentRole !== "LENDER") {
    throw new AppError(
      "You must be in the LENDER role to post a brochure.",
      403,
    );
  }
  if (!lender.upiId) {
    throw new AppError(
      "Please add your UPI ID in your profile before creating a brochure.",
      400,
    );
  }
  if (lender.lenderCapital <= 0) {
    throw new AppError(
      "Please set your investment capital in your profile before creating a brochure.",
      400,
    );
  }
  const { amount, interestRate, tenorDays } = req.body;
  if (!amount || !interestRate || !tenorDays) {
    throw new AppError(
      "Please provide amount, interestRate, and tenorDays.",
      400,
    );
  }
  const availableCapital = lender.lenderCapital - lender.lockedCapital;
  if (amount > availableCapital) {
    throw new AppError(
      `Brochure amount (₹${amount}) exceeds your available capital (₹${availableCapital}). Please increase your capital in settings.`,
      400,
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
});

export const getAllBrochures = asyncHandler(async (req, res) => {
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
});

export const toggleBrochureStatus = asyncHandler(async (req, res) => {
  const lender = req.user;
  const { id } = req.params;

  const brochure = await LoanBrochure.findOne({ _id: id, lender: lender.id });

  if (!brochure) {
    throw new AppError("Brochure not found or you are not the owner.", 404);
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
});

export const updateBrochureDetails = asyncHandler(async (req, res) => {
  const lender = req.user;
  const { id } = req.params;

  const brochure = await LoanBrochure.findOne({ _id: id, lender: lender.id });

  if (!brochure) {
    throw new AppError("Brochure not found or you are not the owner.", 404);
  }

  // --- Business Rule: Prevent editing if brochure is active in a loan request ---
  const associatedRequest = await LoanRequest.findOne({
    brochureIds: id,
    status: { $in: ["PENDING", "CONTRACTING"] },
  });

  if (associatedRequest) {
    throw new AppError(
      "Cannot update a brochure that is part of an active loan request.",
      409,
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
});

export const deleteBrochure = asyncHandler(async (req, res) => {
  const lender = req.user;
  const { id } = req.params;

  const brochure = await LoanBrochure.findOne({ _id: id, lender: lender.id });

  if (!brochure) {
    throw new AppError("Brochure not found or you are not the owner.", 404);
  }

  const associatedRequest = await LoanRequest.findOne({
    brochureIds: id,
    status: { $in: ["PENDING", "CONTRACTING"] },
  });

  if (associatedRequest) {
    throw new AppError(
      "Cannot delete a brochure that is part of an active loan request. Please deactivate it instead.",
      409,
    );
  }

  await LoanBrochure.findByIdAndDelete(id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
