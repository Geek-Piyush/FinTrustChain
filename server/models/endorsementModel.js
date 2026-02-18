import mongoose from "mongoose";
import { createNotification } from "../services/notificationService.js";
import logger from "../utils/logger.js";

const endorsementSchema = new mongoose.Schema(
  {
    endorser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REMOVED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

endorsementSchema.index({ endorser: 1, receiver: 1 }, { unique: true });

// --- Mongoose Middleware for Notifications (Corrected) ---

// Step 1: Use a 'pre' hook to reliably detect the state BEFORE the save.
endorsementSchema.pre("save", function (next) {
  // `this` refers to the document about to be saved.
  if (this.isNew) {
    this._wasNew = true; // Set a temporary flag for new documents.
  }
  // Check if status is modified AND it's not a new document.
  if (!this.isNew && this.isModified("status")) {
    this._statusWasModified = true; // Set a flag for status updates.
  }
  next();
});

// Step 2: Use a 'post' hook to act on the flags set in the 'pre' hook.
endorsementSchema.post("save", async function (doc, next) {
  try {
    // Check for the temporary flags we set before the save.
    const wasNew = doc._wasNew;
    const statusWasModified = doc._statusWasModified;

    // Exit early if no relevant changes were made.
    if (!wasNew && !statusWasModified) {
      return next();
    }

    await doc.populate("endorser receiver");
    const { endorser, receiver } = doc;

    let notifications = [];

    // Case 1: A new endorsement was created.
    if (wasNew) {
      notifications = [
        createNotification(
          receiver,
          `You have received a new endorsement from ${endorser.name}! Your TrustIndex has increased.`,
          `/profile/${endorser._id}`
        ),
        createNotification(
          endorser,
          `You have successfully endorsed ${receiver.name}.`,
          `/profile/${receiver._id}`
        ),
      ];
    }
    // Case 2: An endorsement's status was changed to REMOVED.
    else if (statusWasModified && doc.status === "REMOVED") {
      notifications = [
        createNotification(
          receiver,
          `${endorser.name} has removed their endorsement. Your TrustIndex has been impacted.`,
          `/profile/${endorser._id}`
        ),
        createNotification(
          endorser,
          `You have removed your endorsement for ${receiver.name}.`,
          `/profile/${receiver._id}`
        ),
      ];
    }

    if (notifications.length > 0) {
      const results = await Promise.allSettled(notifications);
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          logger.error(`Endorsement notification ${i} failed:`, r.reason);
        }
      });
    }
  } catch (error) {
    logger.error("Error in endorsement post-save hook:", error);
  }
  next();
});

const Endorsement = mongoose.model("Endorsement", endorsementSchema);
export default Endorsement;
