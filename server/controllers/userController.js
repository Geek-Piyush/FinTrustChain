import User from "../models/userModel.js";
import LoanBrochure from "../models/loanBrochureModel.js";
import Contract from "../models/contractModel.js";
import PlatformRevenue from "../models/platformRevenueModel.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import multer from "multer";
import sharp from "sharp";
import path from "path";

// --- MULTER & SHARP CONFIGURATION ---
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadUserAvatar = upload.single("avatar");

export const resizeUserAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filename = `avatar-${req.user.id}-${Date.now()}.jpeg`;
    const fullPath = path.join("public/img/users", filename);

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(fullPath);

    req.body.avatarUrl = filename;
    next();
  } catch (error) {
    next(error);
  }
};

// --- CONTROLLER FUNCTIONS ---

// Synchronous — no async needed
export const getMe = (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};

export const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select(
      "name avatarUrl trustIndex trustBreakdown milestones endorsementsReceived createdAt",
    )
    .populate("endorsementsReceived", "name avatarUrl trustIndex");

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

export const getPrivateProfile = asyncHandler(async (req, res) => {
  if (req.params.id !== req.user.id) {
    throw new AppError("You do not have permission to view this profile.", 403);
  }
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  // 1. Filter out unwanted field names that are not allowed to be updated
  const filteredBody = {};
  if (req.body.bio) filteredBody.bio = req.body.bio;
  if (req.body.avatarUrl) filteredBody.avatarUrl = req.body.avatarUrl;
  if (req.body.upiId) filteredBody.upiId = req.body.upiId;

  // Lender-only: allow setting investment capital
  if (req.body.lenderCapital !== undefined) {
    const cap = Number(req.body.lenderCapital);
    if (isNaN(cap) || cap < 0) {
      throw new AppError("Capital must be a non-negative number.", 400);
    }
    // Cannot set capital below what's already locked
    if (cap < (req.user.lockedCapital || 0)) {
      throw new AppError(
        `Cannot reduce capital below your locked amount (₹${req.user.lockedCapital}).`,
        400,
      );
    }
    filteredBody.lenderCapital = cap;
  }

  // 2. Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }).select("+upiId");

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// Toggle the current user's role between LENDER and RECEIVER
export const toggleCurrentUserRole = asyncHandler(async (req, res) => {
  const user = req.user;
  const newRole = user.currentRole === "LENDER" ? "RECEIVER" : "LENDER";

  // --- Business Logic Checks ---

  // If user is a LENDER and wants to become a RECEIVER
  if (user.currentRole === "LENDER" && newRole === "RECEIVER") {
    const activeBrochures = await LoanBrochure.findOne({
      lender: user.id,
      active: true,
    });
    if (activeBrochures) {
      throw new AppError(
        "You cannot switch to RECEIVER while you have active loan brochures. Please close your offers first.",
        409,
      );
    }
  }

  // If user is a RECEIVER and wants to become a LENDER
  if (user.currentRole === "RECEIVER" && newRole === "LENDER") {
    // Check for any active/pending contracts where this user is the receiver
    const activeContract = await Contract.findOne({
      receiver: user.id,
      status: {
        $in: [
          "AWAITING_SIGNATURES",
          "AWAITING_DISBURSAL",
          "AWAITING_RECEIPT_CONFIRMATION",
          "ACTIVE",
          "DEFAULT",
        ],
      },
    });
    if (activeContract) {
      throw new AppError(
        "You cannot switch to LENDER while you have an active or defaulted loan as a borrower. Please settle all outstanding loans first.",
        409,
      );
    }
  }

  // --- End Business Logic Checks ---

  // Update the user's currentRole
  user.currentRole = newRole;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: `Role successfully changed to ${newRole}`,
    data: {
      user,
    },
  });
});

// ── Premium Subscription ──
const PREMIUM_PRICING = {
  RECEIVER: {
    BIMONTHLY: { amount: 99, days: 60 },
    ANNUAL: { amount: 499, days: 365 },
  },
  LENDER: {
    BIMONTHLY: { amount: 199, days: 60 },
    ANNUAL: { amount: 999, days: 365 },
  },
};

export const subscribe = asyncHandler(async (req, res) => {
  const { plan, duration } = req.body;

  if (!plan || !["LENDER", "RECEIVER"].includes(plan)) {
    throw new AppError("Plan must be 'LENDER' or 'RECEIVER'.", 400);
  }
  if (!duration || !["BIMONTHLY", "ANNUAL"].includes(duration)) {
    throw new AppError("Duration must be 'BIMONTHLY' or 'ANNUAL'.", 400);
  }

  const pricing = PREMIUM_PRICING[plan][duration];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pricing.days);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      "premium.active": true,
      "premium.plan": plan,
      "premium.duration": duration,
      "premium.expiresAt": expiresAt,
    },
    { new: true },
  ).select("+upiId");

  // Record subscription revenue
  await PlatformRevenue.create({
    type: "SUBSCRIPTION",
    user: req.user.id,
    amount: pricing.amount,
    description: `${plan} ${duration} subscription (₹${pricing.amount})`,
  });

  res.status(200).json({
    status: "success",
    message: `${plan} ${duration} premium activated until ${expiresAt.toLocaleDateString()}.`,
    data: { user },
  });
});

// ── Check if user can toggle role ──
export const canToggleRole = asyncHandler(async (req, res) => {
  const user = req.user;
  let canToggle = true;
  let reason = "";

  if (user.currentRole === "LENDER") {
    const activeBrochures = await LoanBrochure.findOne({
      lender: user.id,
      active: true,
    });
    if (activeBrochures) {
      canToggle = false;
      reason = "You have active loan brochures. Close them first.";
    }
  } else {
    const activeContract = await Contract.findOne({
      receiver: user.id,
      status: {
        $in: [
          "AWAITING_SIGNATURES",
          "AWAITING_DISBURSAL",
          "AWAITING_RECEIPT_CONFIRMATION",
          "ACTIVE",
          "DEFAULT",
        ],
      },
    });
    if (activeContract) {
      canToggle = false;
      reason = "You have an active or defaulted loan. Settle it first.";
    }
  }

  res.status(200).json({
    status: "success",
    data: { canToggle, reason },
  });
});
