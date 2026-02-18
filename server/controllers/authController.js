import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import User from "../models/userModel.js";
import crypto from "crypto";
import Email from "../utils/email.js";
import AppError from "../utils/AppError.js";

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, next) => {
  if (file.mimetype.startsWith("image")) {
    next(null, true);
  } else {
    next(
      new Error(
        "Not an image! Please upload only an image for your e-signature."
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadEsign = upload.single("eSign");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.passwordHash = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    // A) VALIDATE INPUT
    if (!name || !email || !password || !passwordConfirm) {
      return next(new AppError("Please provide all required fields.", 400));
    }
    if (password !== passwordConfirm) {
      return next(new AppError("Passwords do not match.", 400));
    }

    // Password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\#^()_\-+=])[A-Za-z\d@$!%*?&\#^()_\-+=]{8,}$/;
    if (!passwordRegex.test(password)) {
      return next(
        new Error(
          "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&#^()_-+=)."
        )
      );
    }

    if (!req.file) {
      return next(new AppError("E-signature image is required.", 400));
    }

    // B) HASH THE PASSWORD
    const passwordHash = await bcryptjs.hash(password, 12);

    // C) CREATE THE USER (initially without the final filename)
    const newUser = await User.create({
      name,
      email,
      passwordHash,
    });

    // --- START: VERIFICATION TOKEN LOGIC ---

    // 1. Generate a random verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash the token and save it to the user record
    newUser.emailVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    newUser.emailVerificationExpires = Date.now() + 10 * 60 * 1000;

    // 3. Save the user with the new token fields
    await newUser.save({ validateBeforeSave: false });

    // --- END: VERIFICATION TOKEN LOGIC ---

    // --- START: SEND VERIFICATION EMAIL ---
    try {
      const verificationURL = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/auth/verify-email/${verificationToken}`;
      await new Email(newUser, verificationURL).sendVerificationEmail();
      console.log("✅ Verification email sent successfully");
    } catch (err) {
      // Clear verification token if email fails
      newUser.emailVerificationToken = undefined;
      newUser.emailVerificationExpires = undefined;
      await newUser.save({ validateBeforeSave: false });
      console.error("EMAIL ERROR 📧:", err);

      // Log warning but allow registration to continue
      console.warn(
        "⚠️  User registered but verification email could not be sent. Please configure SENDGRID_API_KEY."
      );
      // Don't return error - let registration succeed
    }
    // --- END: SEND VERIFICATION EMAIL ---

    // --- START: NEW FILE SAVING LOGIC ---

    // D) DEFINE A UNIQUE FILENAME
    // Using the new user's ID makes the filename truly unique.
    const filename = `esign-${newUser._id}-${Date.now()}.jpeg`;

    // E) PROCESS IMAGE AND SAVE TO DISK
    // This takes the image from memory, resizes it, and saves it to the public folder.
    await sharp(req.file.buffer)
      .resize(400, 200)
      .toFormat("png")
      .png({ quality: 90 })
      .toFile(path.join("public/img/esigns", filename));

    // F) UPDATE USER WITH THE FILENAME

    newUser.eSign = { filename: filename };
    await newUser.save();

    // --- END: NEW FILE SAVING LOGIC ---

    // G) SEND JWT TOKEN TO THE CLIENT WITH VERIFICATION MESSAGE
    const token = signToken(newUser._id);
    newUser.passwordHash = undefined;

    res.status(201).json({
      status: "success",
      message:
        "User registered successfully. A verification email has been sent to your inbox.",
      token,
      data: {
        user: newUser,
      },
    });
    console.log("✅ User registered successfully");
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("An account with this email already exists.", 409));
    }
    next(error);
  }
};

// LOGIN LOGIC
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please provide email and password.", 400));
    }

    // 2. Find the user by email
    const user = await User.findOne({ email });

    // 3. If user doesn't exist or password doesn't match, send error
    // We use a generic error for security to not reveal which field was incorrect.
    if (!user || !(await bcryptjs.compare(password, user.passwordHash))) {
      return next(new AppError("Incorrect email or password.", 401));
    }

    // 4. Check if the user's email is verified
    if (!user.verification.emailVerified) {
      return next(new AppError("Please verify your email before logging in.", 403));
    }

    // 5. If everything is correct, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// EMAIL VERIFICATION LOGIC

export const verifyEmail = async (req, res, next) => {
  try {
    // 1. Get the token from the URL parameter
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // 2. Find the user with the matching token that hasn't expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    // 3. If no user is found, the token is invalid or has expired
    if (!user) {
      return next(new AppError("Token is invalid or has expired.", 400));
    }

    // 4. If found, update the user to be verified
    user.verification.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // 5. Log the user in by sending a JWT token
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// FORGOT PASSWORD — sends a reset token via email
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("Please provide your email address.", 400));
    }

    const user = await User.findOne({ email });

    // Always respond with success to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        status: "success",
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash and store it
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Build reset URL pointing to the frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
    const resetURL = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await new Email(user, resetURL).sendPasswordResetEmail();
    } catch (err) {
      // If email fails, clear the token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("Email send failed:", err);
      return next(
        new Error("Failed to send reset email. Please try again later.")
      );
    }

    res.status(200).json({
      status: "success",
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// RESET PASSWORD — validates token, enforces password strength
export const resetPassword = async (req, res, next) => {
  try {
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
      return next(new AppError("Please provide a new password and confirmation.", 400));
    }

    if (password !== passwordConfirm) {
      return next(new AppError("Passwords do not match.", 400));
    }

    // Password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\#^()_\-+=])[A-Za-z\d@$!%*?&\#^()_\-+=]{8,}$/;
    if (!passwordRegex.test(password)) {
      return next(
        new Error(
          "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character."
        )
      );
    }

    // Hash the token from the URL and find the user
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Reset token is invalid or has expired.", 400));
    }

    // Set new password
    user.passwordHash = await bcryptjs.hash(password, 12);
    user.passwordChangedAt = Date.now() - 1000; // minus 1s so JWT issued after this is valid
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Log the user in
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
