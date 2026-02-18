import mongoose from "mongoose";
import { createNotification } from "../services/notificationService.js";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },      // URL to user's avatar image
    passwordChangedAt: Date,
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    currentRole: {
      type: String,
      enum: ["LENDER", "RECEIVER"],
      default: "RECEIVER",
    },
    trustIndex: { type: Number, default: 400, min: 0, max: 950 }, 
    trustBreakdown: {
      base: Number,
      timeliness: Number,
      amount: Number,
    },
    verification: {
      emailVerified: { type: Boolean, default: false },
      // panVerified: { type: Boolean, default: false }, <- Future scope
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    eSign: {
      fileId: mongoose.Schema.Types.ObjectId,
      filename: String,
    },
    milestones: {
      eligibleLoan: { type: Number, default: 1000 },
    },
    endorsementsGiven: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    endorsementsReceived: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    tiHistory: [
      {
        value: Number,
        date: { type: Date, default: Date.now },
      },
    ],
    bio: { type: String, maxlength: 500 },  // User bio with max length
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
    upiId: {                        // UPI ID for payments
      type: String,
      trim: true,
      unique: true,
      // Use sparse index to allow multiple documents to have a null/undefined value
      sparse: true,
      validate: {
        validator: function (v) {
          return /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/.test(v);
        },
        message: (props) => `${props.value} is not a valid UPI ID!`,
      },
      select: false,
    },

    successfulRepayments: { type: Number, default: 0 },
    defaults: { type: Number, default: 0 },

    // ── Lender Capital Tracking ──
    lenderCapital: { type: Number, default: 0 },   // total declared investment budget
    lockedCapital: { type: Number, default: 0 },   // locked in active contracts

    // ── Premium Subscription ──
    premium: {
      active: { type: Boolean, default: false },
      plan: { type: String, enum: ["LENDER", "RECEIVER", null], default: null },
      duration: { type: String, enum: ["BIMONTHLY", "ANNUAL", null], default: null },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
