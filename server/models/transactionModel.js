import mongoose from "mongoose";
import { createNotification } from "../services/notificationService.js";
const transactionSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    emiNumber: { type: Number },
    status: {
      type: String,
      enum: ["DISBURSED", "CONFIRMED", "SUCCESS", "FAILED", "GUARANTOR_SETTLEMENT"],
      default: "DISBURSED",
    },

    proofOfPaymentFilename: { type: String },
    paymentTransactionId: { type: String },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
