import express from "express";
import * as authController from "../controllers/authController.js";
import { authLimiter, uploadLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// User registration route (with rate limiting)
router.post(
  "/register",
  authLimiter,
  uploadLimiter,
  authController.uploadEsign,
  authController.registerUser
);

// Email verification route
router.get("/verify-email/:token", authController.verifyEmail);

// Login route (with stricter rate limiting)
router.post("/login", authLimiter, authController.loginUser);

// Forgot password — rate-limited to prevent abuse
router.post("/forgot-password", authLimiter, authController.forgotPassword);

// Reset password with token
router.patch(
  "/reset-password/:token",
  authLimiter,
  authController.resetPassword
);

export default router;
