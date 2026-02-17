import mongoose from "mongoose";

const platformRevenueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["PLATFORM_FEE", "CONVENIENCE_FEE", "SUBSCRIPTION"],
      required: true,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "COLLECTED", "WAIVED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

// Indexes for admin queries
platformRevenueSchema.index({ type: 1 });
platformRevenueSchema.index({ createdAt: -1 });
platformRevenueSchema.index({ user: 1 });

const PlatformRevenue = mongoose.model(
  "PlatformRevenue",
  platformRevenueSchema
);

export default PlatformRevenue;
