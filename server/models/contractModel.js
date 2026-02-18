import mongoose from "mongoose";
import { dispatchContractNotifications } from "../services/notificationService.js";
import logger from "../utils/logger.js";

const contractSchema = new mongoose.Schema(
  {
    contractId: { type: String, unique: true, sparse: true },
    loanRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoanRequest",
      required: true,
      unique: true,
    },
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    guarantor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenorDays: { type: Number, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: [
        "PENDING_SIGNATURES",
        "AWAITING_DISBURSAL",
        "AWAITING_RECEIPT_CONFIRMATION",
        "ACTIVE",
        "REPAID",
        "DEFAULT",
      ],
      default: "PENDING_SIGNATURES",
    },
    signatures: {
      receiver: { type: Boolean, default: false },
      guarantor: { type: Boolean, default: false },
      lender: { type: Boolean, default: false },
    },
    pdfFilename: { type: String },
    guarantorLiabilityAmount: { type: Number, default: 0 },
    guarantorLiabilityPaid: { type: Boolean, default: false },
    consecutiveOverdueCount: { type: Number, default: 0 },
    repaymentSchedule: [
      {
        emiNumber: { type: Number, required: true },
        dueDate: Date,
        amountDue: Number,
        principal: Number,
        interest: Number,
        status: {
          type: String,
          enum: ["PENDING", "PAID", "OVERDUE"],
          default: "PENDING",
        },
        paidAt: Date,
        penaltyApplied: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
);

// --- Indexes for common query patterns ---
// Dashboard: find contracts where user is receiver/lender/guarantor
contractSchema.index({ receiver: 1, status: 1, createdAt: -1 });
contractSchema.index({ lender: 1, status: 1, createdAt: -1 });
contractSchema.index({ guarantor: 1, status: 1, createdAt: -1 });
// Scheduler: find by status + date fields
contractSchema.index({ status: 1, endDate: 1 });
contractSchema.index({ status: 1, updatedAt: 1 });

// --- Mongoose Middleware for Notifications ---
//
// DESIGN: Notification generation is intentionally NOT awaited inside these
// hooks. Awaiting populate() + multiple Notification.create() calls would add
// those DB writes to the latency of every contract.save() call, blocking the
// HTTP response until all notifications are persisted.
//
// Instead:
//   • The 'pre' hook records the transition type on the document instance.
//   • The 'post' hook hands off to dispatchContractNotifications via
//     setImmediate so the response is sent first and the writes happen in the
//     next event-loop tick, fully decoupled from the request path.

contractSchema.pre("save", function (next) {
  if (this.isNew) {
    this._notifyEvent = "CREATED";
  } else if (!this.isNew && this.isModified("status")) {
    // Map the new status directly to a notification event name.
    this._notifyEvent = this.status; // e.g. "ACTIVE", "REPAID", "DEFAULT" …
  }
  next();
});

contractSchema.post("save", function (doc) {
  if (!doc._notifyEvent) return;

  const event = doc._notifyEvent;
  setImmediate(() => {
    dispatchContractNotifications(doc, event).catch(err =>
      logger.error(
        `Async notification dispatch failed for contract ${doc._id} event "${event}":`,
        err,
      ),
    );
  });
});

const Contract = mongoose.model("Contract", contractSchema);
export default Contract;
