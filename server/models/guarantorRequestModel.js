import mongoose from "mongoose";
import { createNotification } from "../services/notificationService.js";

const guarantorRequestSchema = new mongoose.Schema(
  {
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
    loanRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoanRequest",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED"],
      default: "PENDING",
      index: true,
    },
  },
  { timestamps: true }
);

guarantorRequestSchema.index(
  { guarantor: 1, loanRequest: 1 },
  { unique: true }
);

// --- Mongoose Middleware for Notifications (Corrected) ---

// Step 1: Use a 'pre' hook to reliably detect the state BEFORE the save.
guarantorRequestSchema.pre("save", function (next) {
  if (this.isNew) {
    this._wasNew = true; // Set a temporary flag for new documents.
  }
  if (!this.isNew && this.isModified("status")) {
    this._statusWasModified = true; // Set a flag for status updates.
  }
  next();
});

// Step 2: Use a 'post' hook to act on the flags set in the 'pre' hook.
guarantorRequestSchema.post("save", async function (doc, next) {
  try {
    const wasNew = doc._wasNew;
    const statusWasModified = doc._statusWasModified;

    if (!wasNew && !statusWasModified) {
      return next();
    }

    await doc.populate("guarantor receiver");
    const { guarantor, receiver, loanRequest } = doc;

    let notifications = [];

    // Case 1: A new request is created.
    if (wasNew) {
      notifications = [
        createNotification(
          guarantor,
          `${receiver.name} has requested you to be a guarantor for a loan.`,
          `/guarantor-requests/${doc._id}`
        ),
      ];
    }
    // Case 2: An existing request's status is updated.
    else if (statusWasModified) {
      let message;

      const link = `/my-pending-actions`;
      if (doc.status === "ACCEPTED") {
        message = `Good news! ${guarantor.name} has accepted your guarantor request. Your loan application is now visible to lenders.`;
      } else if (doc.status === "DECLINED") {
        message = `Update: ${guarantor.name} has declined your guarantor request. Please find another guarantor.`;
      }
      if (message) {
        notifications = [createNotification(receiver, message, link)];
      }
    }

    if (notifications.length > 0) {
      const results = await Promise.allSettled(notifications);
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`GuarantorRequest notification ${i} failed:`, r.reason);
        }
      });
    }
  } catch (error) {
    console.error("Error in guarantor request post-save hook:", error);
  }
  next();
});

const GuarantorRequest = mongoose.model(
  "GuarantorRequest",
  guarantorRequestSchema
);
export default GuarantorRequest;
