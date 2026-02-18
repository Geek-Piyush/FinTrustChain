import express from "express";
import {
  createLoanRequest,
  getMy,
  cancelLoanRequest,
} from "../controllers/loanRequestController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { validateCreateLoanRequest } from "../middlewares/validators.js";

const router = express.Router();

// All routes require a user to be logged in.
router.use(protect);

// GET /api/v1/loan-requests/my - Get my loan requests (RECEIVER only)
router.get("/my", restrictTo("RECEIVER"), getMy);

// PATCH /api/v1/loan-requests/:id/cancel - Cancel a loan request (RECEIVER only)
router.patch("/:id/cancel", restrictTo("RECEIVER"), cancelLoanRequest);

// POST /api/v1/loan-requests - Create loan request (RECEIVER only)
router.post("/", restrictTo("RECEIVER"), validateCreateLoanRequest, createLoanRequest);

export default router;
