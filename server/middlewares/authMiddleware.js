import { promisify } from "util";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  try {
    let token;
    // 1. Get token from the request header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new Error("You are not logged in. Please log in to get access.")
      );
    }

    // 2. Verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists (include upiId which has select: false)
    const currentUser = await User.findById(decoded.id).select("+upiId");
    if (!currentUser) {
      return next(
        new Error("The user belonging to this token no longer exists.")
      );
    }

    // 4. Check if user changed password after the token was issued
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      );

      // If the token was issued *before* the password was changed, it's invalid.
      if (decoded.iat < changedTimestamp) {
        return next(
          new Error("User recently changed password. Please log in again.")
        );
      }
    }

    // 5. Grant access and attach user to the request
    req.user = currentUser;
    next();
  } catch (error) {
    return next(new Error("Invalid token. Please log in again."));
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check both `role` (ADMIN/USER) and `currentRole` (LENDER/RECEIVER)
    if (!roles.includes(req.user.role) && !roles.includes(req.user.currentRole)) {
      return next(
        new Error("You do not have permission to perform this action.")
      );
    }
    next();
  };
};
