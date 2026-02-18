import express from "express";
import {
  createGuarantorRequest,
  respondToGuarantorRequest,
  getPendingGuarantorRequests,
  getGuarantorRequestById,
} from "../controllers/guarantorRequestController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  validateCreateGuarantorRequest,
  validateRespondGuarantorRequest,
} from "../middlewares/validators.js";

const router = express.Router();

router.use(protect);

// Get all pending guarantor requests for the logged-in user
router.get("/pending", getPendingGuarantorRequests);

// Get a specific guarantor request by ID
router.get("/:id", getGuarantorRequestById);

// Send a new guarantor request
router.post("/", validateCreateGuarantorRequest, createGuarantorRequest);

// Respond to a guarantor request
// The :id is the ID of the GuarantorRequest document
router.patch("/:id", validateRespondGuarantorRequest, respondToGuarantorRequest);

export default router;
