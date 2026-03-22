import mongoose from "mongoose";
import fs from "fs/promises";
import fsSync from "fs";
import Contract from "../models/contractModel.js";
import LoanRequest from "../models/loanRequestModel.js";
import Transaction from "../models/transactionModel.js";
import * as pdfService from "../services/pdfService.js";
import multer from "multer";
import path from "path";
import * as paymentService from "../services/paymentService.js";
import { generateEMISchedule } from "../services/emiService.js";
import { sendContractReadyEmail } from "../utils/email.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

// --- MULTER SETUP for Payment Proof ---
const ALLOWED_PROOF_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "application/pdf",
];

const proofStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/img/proofs");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `proof-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const proofFileFilter = (req, file, cb) => {
  if (ALLOWED_PROOF_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only images (JPEG, PNG, GIF, WebP, BMP, TIFF) and PDF files are allowed.",
        400,
      ),
      false,
    );
  }
};

export const uploadProof = multer({
  storage: proofStorage,
  fileFilter: proofFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("proof");

// Internal function — NOT a route handler. Keeps its own try/catch for the DB session.
export const createContract = async loanRequestId => {
  const session = await mongoose.startSession();
  session.startTransaction({ readPreference: "primary" });
  try {
    const loanRequest = await LoanRequest.findById(loanRequestId)
      .populate("receiver")
      .populate("guarantor")
      .populate({ path: "selectedBrochure", populate: { path: "lender" } })
      .session(session);

    if (!loanRequest || !loanRequest.selectedBrochure) {
      throw new AppError(
        "Valid loan request with a selected brochure not found.",
        404,
      );
    }

    const { receiver, guarantor, selectedBrochure } = loanRequest;
    const { lender } = selectedBrochure;
    const dateStr = new Date().toISOString().split("T")[0];
    const contractId = `C-${dateStr}-${receiver.id.slice(-4)}-${lender.id.slice(
      -4,
    )}`;
    const pdfFilename = `Contract-${contractId}-unsigned.pdf`;

    const contractData = {
      contractId,
      dateISO: dateStr,
      loanAmountDisplay: `₹${selectedBrochure.amount.toLocaleString("en-IN")}`,
      interestRateDisplay: `${selectedBrochure.interestRate}%.`,
      repaymentPeriodDisplay: `${selectedBrochure.tenorDays} days`,
      startDateDisplay: new Date().toLocaleDateString("en-GB"),
      endDateDisplay: new Date(
        Date.now() + selectedBrochure.tenorDays * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-GB"),
      receiver: { name: receiver.name, tiAtSigning: receiver.trustIndex },
      guarantor: { name: guarantor.name, tiAtSigning: guarantor.trustIndex },
      lender: { name: lender.name, tiAtSigning: lender.trustIndex },
    };

    await pdfService.createContractPDF(contractData, pdfFilename);

    const newContract = await Contract.create(
      [
        {
          contractId,
          loanRequest: loanRequestId,
          lender: lender.id,
          receiver: receiver.id,
          guarantor: guarantor.id,
          principal: selectedBrochure.amount,
          interestRate: selectedBrochure.interestRate,
          tenorDays: selectedBrochure.tenorDays,
          pdfFilename: pdfFilename,
          status: "PENDING_SIGNATURES",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    logger.info(`Contract ${newContract[0].id} created. Ready for signatures.`);

    // Email all parties that the contract is ready
    await sendContractReadyEmail(receiver, contractId);
    await sendContractReadyEmail(lender, contractId);
    await sendContractReadyEmail(guarantor, contractId);

    return newContract[0];
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error creating contract", { error: error.message });
    throw error;
  } finally {
    session.endSession();
  }
};

// POST /contracts/:id/sign
export const signContract = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id);
  if (!contract || contract.status !== "PENDING_SIGNATURES") {
    throw new AppError("This contract is not available for signing.", 400);
  }

  let userRole = null;
  if (contract.receiver.equals(user.id)) userRole = "receiver";
  else if (contract.guarantor.equals(user.id)) userRole = "guarantor";
  else if (contract.lender.equals(user.id)) userRole = "lender";

  if (!userRole)
    throw new AppError("You are not a party to this contract.", 403);
  if (contract.signatures[userRole])
    throw new AppError("You have already signed this contract.", 400);

  await pdfService.applySignatureToPDF(contract.pdfFilename, user, userRole);
  contract.signatures[userRole] = true;

  const { receiver, guarantor, lender } = contract.signatures;
  if (receiver && guarantor && lender) {
    contract.status = "AWAITING_DISBURSAL";

    const oldFilename = contract.pdfFilename;
    const newFilename = oldFilename.replace("-unsigned.pdf", "-signed.pdf");
    const oldPath = path.resolve(`./public/contracts/${oldFilename}`);
    const newPath = path.resolve(`./public/contracts/${newFilename}`);
    await fs.rename(oldPath, newPath);
    contract.pdfFilename = newFilename;
  }

  await contract.save();

  res.status(200).json({
    status: "success",
    message: "Contract signed successfully.",
    data: { contract },
  });
});

// POST /contracts/:id/initiate-disbursal - Initiate disbursal payment via PhonePe
export const initiateDisbursalPayment = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id);

  if (!contract || !contract.lender.equals(user.id)) {
    throw new AppError("Contract not found or you are not the lender.", 404);
  }
  if (contract.status !== "AWAITING_DISBURSAL") {
    throw new AppError("This contract is not awaiting disbursal.", 400);
  }

  // Initiate PhonePe payment for disbursal
  const redirectUrl = await paymentService.initiatePayment(
    id,
    user,
    contract.principal,
    "DISBURSAL",
  );

  res.status(200).json({
    status: "success",
    message: "Disbursal payment initiated via PhonePe.",
    data: { redirectUrl },
  });
});

export const confirmDisbursal = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { transactionId } = req.body;

  if (!req.file) {
    throw new AppError("A screenshot of the payment proof is required.", 400);
  }
  if (!transactionId) {
    throw new AppError("The payment transaction ID is required.", 400);
  }

  const contract = await Contract.findById(id);

  if (!contract || !contract.lender.equals(user.id)) {
    throw new AppError("Contract not found or you are not the lender.", 404);
  }
  if (contract.status !== "AWAITING_DISBURSAL") {
    throw new AppError("This contract is not awaiting disbursal.", 400);
  }

  // Create a transaction log with the new proof fields
  await Transaction.create({
    contract: contract.id,
    fromUser: contract.lender,
    toUser: contract.receiver,
    amount: contract.principal,
    status: "DISBURSED",
    proofOfPaymentFilename: req.file.filename,
    paymentTransactionId: transactionId,
  });

  contract.status = "AWAITING_RECEIPT_CONFIRMATION";
  await contract.save();

  res.status(200).json({
    status: "success",
    message: "Disbursal confirmed. Awaiting receiver to confirm receipt.",
    data: { contract },
  });
});

// POST /contracts/:id/confirm-receipt
export const confirmReceipt = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id);

  // Validation
  if (!contract || !contract.receiver.equals(user.id)) {
    throw new AppError(
      "Contract not found or you are not the receiver for this contract.",
      404,
    );
  }
  if (contract.status !== "AWAITING_RECEIPT_CONFIRMATION") {
    throw new AppError(
      "This contract is not awaiting receipt confirmation.",
      400,
    );
  }

  // Find and update the transaction log
  const transaction = await Transaction.findOne({
    contract: contract.id,
    status: "DISBURSED",
  });

  if (!transaction) {
    throw new AppError(
      "No pending disbursal transaction found for this contract.",
      404,
    );
  }
  transaction.status = "CONFIRMED";
  await transaction.save();

  // --- FINAL TRIGGER: Activate the loan ---
  contract.status = "ACTIVE";
  contract.startDate = new Date();
  contract.endDate = new Date(
    Date.now() + contract.tenorDays * 24 * 60 * 60 * 1000,
  );

  // Generate EMI repayment schedule
  contract.repaymentSchedule = generateEMISchedule(contract);
  logger.info(
    `Generated ${contract.repaymentSchedule.length} EMI installments for contract ${contract.id}`,
  );

  await contract.save();

  res.status(200).json({
    status: "success",
    message:
      "Receipt confirmed. The loan is now active and repayment has begun.",
    data: { contract },
  });
});

// POST /contracts/:id/guarantor-pay
export const initiateGuarantorPayment = asyncHandler(async (req, res) => {
  const guarantor = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id);

  // Validation
  if (!contract || !contract.guarantor.equals(guarantor.id)) {
    throw new AppError(
      "Contract not found or you are not the guarantor for this contract.",
      404,
    );
  }
  if (contract.status !== "DEFAULT") {
    throw new AppError("This contract is not in a defaulted state.", 400);
  }

  // The guarantor is liable for 50% of the remaining unpaid amount
  let guarantorLiability = contract.guarantorLiabilityAmount;
  if (!guarantorLiability) {
    // Fallback: calculate from unpaid EMIs
    const remaining = contract.repaymentSchedule
      .filter(emi => emi.status !== "PAID")
      .reduce((sum, emi) => sum + emi.amountDue, 0);
    guarantorLiability = Math.round(remaining * 0.5);
  }

  // We reuse our existing payment service, passing the guarantor as the user and the specific liability amount.
  const redirectUrl = await paymentService.initiatePayment(
    id,
    guarantor,
    guarantorLiability,
    "GUARANTOR_PAY",
  );

  res.status(200).json({
    status: "success",
    message: "Guarantor payment initiated successfully.",
    data: {
      redirectUrl,
    },
  });
});

// GET /contracts/:id/disbursal-proof
export const getDisbursalProof = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id);

  // Validation
  if (!contract || !contract.receiver.equals(user.id)) {
    throw new AppError(
      "Contract not found or you are not the receiver for this contract.",
      404,
    );
  }
  if (contract.status !== "AWAITING_RECEIPT_CONFIRMATION") {
    throw new AppError(
      "Proof of payment is only available when the contract is awaiting your confirmation.",
      400,
    );
  }

  // Find the transaction log associated with this contract
  const transaction = await Transaction.findOne({
    contract: contract.id,
    status: "DISBURSED",
  });

  if (!transaction) {
    throw new AppError(
      "No disbursal proof has been uploaded for this contract yet.",
      404,
    );
  }

  // Construct the full URL for the image
  const imageUrl = `${req.protocol}://${req.get("host")}/img/proofs/${
    transaction.proofOfPaymentFilename
  }`;

  res.status(200).json({
    status: "success",
    data: {
      transactionId: transaction.paymentTransactionId,
      proofImageUrl: imageUrl,
      uploadedAt: transaction.createdAt,
    },
  });
});

export const getContractDetails = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id)
    .populate("lender", "name avatarUrl")
    .populate("receiver", "name avatarUrl")
    .populate("guarantor", "name avatarUrl");

  if (!contract) {
    throw new AppError("Contract not found.", 404);
  }

  // --- Security Check ---
  const isParty =
    contract.lender._id.equals(user.id) ||
    contract.receiver._id.equals(user.id) ||
    contract.guarantor._id.equals(user.id);

  if (!isParty) {
    throw new AppError("You are not authorized to view this contract.", 403);
  }

  // Calculate total payable amount (principal + interest)
  const totalPayable =
    contract.principal + (contract.principal * contract.interestRate) / 100;

  res.status(200).json({
    status: "success",
    data: {
      contract: {
        ...contract.toObject(),
        totalPayable,
      },
    },
  });
});

// GET /contracts/:id/receiver-upi
// Securely fetches the receiver's UPI ID for the lender of a specific contract.
export const getReceiverUpi = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id).populate({
    path: "receiver",
    select: "name upiId",
  });

  if (!contract) {
    throw new AppError("Contract not found.", 404);
  }

  // Ensure the logged-in user is the lender for this specific contract.
  if (!contract.lender.equals(user.id)) {
    throw new AppError(
      "You are not authorized to view the receiver's UPI ID for this contract.",
      403,
    );
  }

  // Check if the receiver has added a UPI ID
  if (!contract.receiver.upiId) {
    throw new AppError("The receiver has not provided a UPI ID yet.", 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      receiverName: contract.receiver.name,
      upiId: contract.receiver.upiId,
    },
  });
});

// Fetch and download contract PDF
// NOTE: Keeps manual try/catch because of the streaming pattern with fileStream.on("error")
export const getContractPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const contract = await Contract.findById(id).populate(
      "receiver lender guarantor",
    );

    if (!contract) {
      return next(new AppError("Contract not found.", 404));
    }

    const isAuthorized =
      userId === contract.receiver.id.toString() ||
      userId === contract.lender.id.toString() ||
      userId === contract.guarantor.id.toString();

    if (!isAuthorized) {
      return next(
        new AppError(
          "You are not authorized to access this contract. Only involved parties can view the contract PDF.",
          403,
        ),
      );
    }

    if (!contract.pdfFilename) {
      return next(new AppError("Contract PDF not found.", 404));
    }

    const filePath = path.join(
      process.cwd(),
      "public/contracts",
      contract.pdfFilename,
    );

    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      return next(
        new AppError("Contract PDF file does not exist on the server.", 404),
      );
    }

    // Set response headers for PDF download
    const downloadName = contract.contractId
      ? `${contract.contractId}.pdf`
      : contract.pdfFilename;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName}"`,
    );

    // Stream the file to the client
    const fileStream = fsSync.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on("error", error => {
      logger.error("Error reading PDF file", { error: error.message });
      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          message: "Error reading PDF file.",
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /contracts/:id/emi-schedule
export const getEMISchedule = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id);
  if (!contract) {
    throw new AppError("Contract not found.", 404);
  }

  // Security: only contract parties can view the schedule
  const isParty =
    contract.lender.equals(user.id) ||
    contract.receiver.equals(user.id) ||
    contract.guarantor.equals(user.id);
  if (!isParty) {
    throw new AppError(
      "You are not authorized to view this contract's EMI schedule.",
      403,
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      schedule: contract.repaymentSchedule || [],
    },
  });
});

// GET /contracts/:id/payment-history
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const contract = await Contract.findById(id);
  if (!contract) {
    throw new AppError("Contract not found.", 404);
  }

  // Security: only contract parties can view payment history
  const isParty =
    contract.lender.equals(user.id) ||
    contract.receiver.equals(user.id) ||
    contract.guarantor.equals(user.id);
  if (!isParty) {
    throw new AppError(
      "You are not authorized to view this contract's payment history.",
      403,
    );
  }

  const transactions = await Transaction.find({ contract: id })
    .sort({ createdAt: -1 })
    .populate("fromUser", "name")
    .populate("toUser", "name");

  res.status(200).json({
    status: "success",
    data: {
      payments: transactions,
    },
  });
});
