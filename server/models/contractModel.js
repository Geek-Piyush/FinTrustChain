import mongoose from "mongoose";
import { createNotification } from "../services/notificationService.js";

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
  { timestamps: true }
);

// --- Mongoose Middleware for Notifications (Corrected) ---

// Step 1: Use a 'pre' hook to reliably detect the state BEFORE the save.
contractSchema.pre("save", function (next) {
  if (this.isNew) {
    this._wasNew = true; // Set a temporary flag for new documents.
  }
  if (!this.isNew && this.isModified("status")) {
    this._statusWasModified = true; // Set a flag for status updates.
  }
  next();
});

// Step 2: Use a 'post' hook to act on the flags set in the 'pre' hook.
contractSchema.post("save", async function (doc, next) {
  try {
    const wasNew = doc._wasNew;
    const statusWasModified = doc._statusWasModified;

    // Exit early if no relevant changes were made.
    if (!wasNew && !statusWasModified) {
      return next();
    }

    await doc.populate("lender receiver guarantor");
    const { lender, receiver, guarantor } = doc;
    let link = `/contracts/${doc._id}`;

    // Case 1: A new contract is created.
    if (wasNew) {
      const message = `The loan contract for ${receiver.name} is ready for your signature.`;
      await createNotification(lender, message, link);
      await createNotification(receiver, message, link);
      await createNotification(
        guarantor,
        `The contract for ${receiver.name}, which you guaranteed, is ready for your signature.`,
        link
      );
    }
    // Case 2: An existing contract's status is updated.
    else if (statusWasModified) {
      if (doc.status === "AWAITING_DISBURSAL") {
        const message = `Contract with ${receiver.name} is fully signed. Please disburse the funds and confirm.`;
        await createNotification(lender, message, link);
      } else if (doc.status === "AWAITING_RECEIPT_CONFIRMATION") {
        link = `/contracts/${doc._id}/disbursal-proof`;
        const message = `Lender ${lender.name} has confirmed payment. Please confirm receipt within 24 hours.`;
        await createNotification(receiver, message, link);
      } else if (doc.status === "ACTIVE") {
        await createNotification(
          receiver,
          `Your loan with ${lender.name} is now active!`,
          link
        );
        await createNotification(
          lender,
          `The loan to ${receiver.name} is now active.`,
          link
        );
        await createNotification(
          guarantor,
          `The loan for ${receiver.name} that you guaranteed is now active.`,
          link
        );
      } else if (doc.status === "REPAID") {
        await createNotification(
          lender,
          `Congratulations! The loan to ${receiver.name} has been fully repaid.`,
          link
        );
        await createNotification(
          receiver,
          `You have successfully repaid your loan from ${lender.name}. Your TrustIndex has increased!`,
          link
        );
        await createNotification(
          guarantor,
          `Good news! The loan for ${receiver.name} has been repaid. Your TrustIndex has increased.`,
          link
        );
      } else if (doc.status === "DEFAULT") {
        const liabilityAmount = doc.guarantorLiabilityAmount || Math.round(doc.principal * 0.5);
        await createNotification(
          lender,
          `Urgent: The loan to ${receiver.name} has defaulted.`,
          link
        );
        await createNotification(
          receiver,
          `Your loan from ${lender.name} has defaulted. Your TrustIndex has been severely impacted.`,
          `/debts`
        );
        await createNotification(
          guarantor,
          `URGENT: The loan for ${receiver.name} has defaulted. You are liable for ₹${liabilityAmount.toLocaleString("en-IN")}. Pay now to settle your liability.`,
          `/debts`
        );
      }
    }
  } catch (error) {
    console.error("Error in contract post-save notification hook:", error);
  }
  next();
});

const Contract = mongoose.model("Contract", contractSchema);
export default Contract;
