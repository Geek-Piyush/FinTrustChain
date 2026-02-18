import express from "express";
import * as authController from "../controllers/authController.js";
import { authLimiter, uploadLimiter } from "../middlewares/rateLimiter.js";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middlewares/validators.js";

const router = express.Router();

// User registration route (with rate limiting)
router.post(
  "/register",
  authLimiter,
  uploadLimiter,
  authController.uploadEsign,
  validateRegister,
  authController.registerUser
);

// Email verification route
router.get("/verify-email/:token", authController.verifyEmail);

// Login route (with stricter rate limiting)
router.post("/login", authLimiter, validateLogin, authController.loginUser);

// Forgot password — rate-limited to prevent abuse
router.post(
  "/forgot-password",
  authLimiter,
  validateForgotPassword,
  authController.forgotPassword
);

// Reset password with token
router.patch(
  "/reset-password/:token",
  authLimiter,
  validateResetPassword,
  authController.resetPassword
);

export default router;
