import GuarantorRequest from "../models/guarantorRequestModel.js";
import LoanRequest from "../models/loanRequestModel.js";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

// GET /guarantor-requests/pending
// Get all pending guarantor requests for the logged-in user
export const getPendingGuarantorRequests = asyncHandler(async (req, res) => {
  const user = req.user;

  const requests = await GuarantorRequest.find({
    guarantor: user.id,
    status: "PENDING",
  })
    .populate("receiver", "name avatarUrl trustIndex")
    .populate("loanRequest")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: requests.length,
    data: { requests },
  });
});

// GET /guarantor-requests/:id
// Get details of a specific guarantor request
export const getGuarantorRequestById = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const request = await GuarantorRequest.findById(id)
    .populate("receiver", "name avatarUrl trustIndex")
    .populate("guarantor", "name avatarUrl trustIndex")
    .populate("loanRequest");

  if (!request) {
    throw new AppError("Guarantor request not found.", 404);
  }

  // Check if user is authorized to view this request
  const isAuthorized =
    request.guarantor._id.equals(user.id) ||
    request.receiver._id.equals(user.id);

  if (!isAuthorized) {
    throw new AppError("You are not authorized to view this request.", 403);
  }

  res.status(200).json({
    status: "success",
    data: { request },
  });
});

// POST /guarantor-requests
// NOTE: Keeps manual try/catch because of special duplicate key error handling (11000)
export const createGuarantorRequest = async (req, res, next) => {
  try {
    const receiver = req.user;
    const { guarantorId, loanRequestId } = req.body;

    // --- Validation ---
    if (receiver.id === guarantorId) {
      throw new AppError("You cannot request yourself to be a guarantor.", 400);
    }

    // Check if the potential guarantor is already an endorser of the receiver.
    if (!receiver.endorsementsReceived.includes(guarantorId)) {
      throw new AppError(
        "You can only request a user to be your guarantor if they have already endorsed you.",
        403,
      );
    }

    const loanRequest = await LoanRequest.findOne({
      _id: loanRequestId,
      receiver: receiver.id,
    });
    if (!loanRequest) {
      throw new AppError(
        "The specified loan request does not exist or does not belong to you.",
        404,
      );
    }
    if (loanRequest.status !== "PENDING") {
      throw new AppError(
        "You can only send guarantor requests for a pending loan application.",
        400,
      );
    }

    // --- Create Request ---
    const guarantorRequest = await GuarantorRequest.create({
      receiver: receiver.id,
      guarantor: guarantorId,
      loanRequest: loanRequestId,
    });

    res.status(201).json({
      status: "success",
      message: "Guarantor request sent successfully.",
      data: { request: guarantorRequest },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError(
          "A guarantor request has already been sent to this user for this loan.",
          409,
        ),
      );
    }
    next(error);
  }
};

/**
 * PATCH /guarantor-requests/:id
 * Allows a user to accept or decline a guarantor request sent to them.
 */
export const respondToGuarantorRequest = asyncHandler(async (req, res) => {
  const guarantor = req.user;
  const { id } = req.params;
  const { status } = req.body;

  if (!["ACCEPTED", "DECLINED"].includes(status)) {
    throw new AppError(
      "Invalid status. Must be 'ACCEPTED' or 'DECLINED'.",
      400,
    );
  }
  const request = await GuarantorRequest.findById(id);
  if (
    !request ||
    request.guarantor.toString() !== guarantor.id ||
    request.status !== "PENDING"
  ) {
    throw new AppError(
      "This request is not valid or you are not authorized to respond to it.",
      404,
    );
  }

  request.status = status;
  await request.save();

  if (status === "ACCEPTED") {
    const loanRequest = await LoanRequest.findById(request.loanRequest);
    if (loanRequest) {
      loanRequest.guarantor = guarantor.id;
      loanRequest.guarantorStatus = "ACCEPTED";
      loanRequest.status = "GUARANTOR_ACCEPTED";
      await loanRequest.save();
    }
  } else if (status === "DECLINED") {
    const loanRequest = await LoanRequest.findById(request.loanRequest);
    if (loanRequest) {
      loanRequest.guarantorStatus = "DECLINED";
      loanRequest.guarantor = undefined;
      await loanRequest.save();
    }
  }

  res.status(200).json({
    status: "success",
    message: `Request has been ${status.toLowerCase()}.`,
    data: { request },
  });
});
