import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  uploadAttachments,
  submitTicket,
} from "../controllers/supportController.js";
import { validateSubmitTicket } from "../middlewares/validators.js";

const router = express.Router();

// All support routes require authentication
router.use(protect);

router.post("/", uploadAttachments, validateSubmitTicket, submitTicket);

export default router;
