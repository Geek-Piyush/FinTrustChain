import express from "express";
import {
  createEndorsement,
  removeEndorsement,
} from "../controllers/endorsementController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateCreateEndorsement } from "../middlewares/validators.js";

const router = express.Router();

// All endorsement routes require a user to be logged in,
// so we apply the 'protect' middleware to the entire router.
router.use(protect);

// POST /api/v1/endorsements
router.post("/", validateCreateEndorsement, createEndorsement);

// DELETE /api/v1/endorsements/:id
// The :id parameter is the ID of the user you want to un-endorse.
router.delete("/:id", removeEndorsement);

export default router;
