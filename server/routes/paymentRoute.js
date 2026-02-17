import express from "express";
import {
  createPayment,
  handleCallback,
  checkPaymentStatus,
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// This route is for the user to initiate a payment. It must be protected.
router.post("/pay", protect, createPayment);

// Frontend polls this after PhonePe redirect — verifies payment server-to-server
router.get("/status/:merchantOrderId", protect, checkPaymentStatus);

// This route is for PhonePe's server to call. It should not be protected by your JWT middleware,
// as PhonePe won't have a user token. It has its own validation mechanism.
router.post("/callback", handleCallback);

export default router;
