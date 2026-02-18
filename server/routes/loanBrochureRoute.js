import express from "express";
import {
  createBrochure,
  getAllBrochures,
  toggleBrochureStatus,
  updateBrochureDetails,
  deleteBrochure,
} from "../controllers/loanBrochureController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  validateCreateBrochure,
  validateUpdateBrochure,
} from "../middlewares/validators.js";

const router = express.Router();

// --- Public Route ---
// This middleware will optionally add `req.user` if a valid token is provided,
// but it will not throw an error if there's no token. This allows the
// `getAllBrochures` controller to adapt its response.
const optionalProtect = (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    return protect(req, res, next);
  }
  next();
};

// GET /api/v1/brochures
router.get("/", optionalProtect, getAllBrochures);

// --- Protected Routes ---
router.use(protect);

// POST /api/v1/brochures
router.post("/", validateCreateBrochure, createBrochure);

// PATCH /api/v1/brochures/:id
// Updates the details (amount, rate, etc.) of a brochure.
router.patch("/:id", validateUpdateBrochure, updateBrochureDetails);

// PATCH /api/v1/brochures/:id/toggle-status
// Toggles a brochure between active and inactive.
router.patch("/:id/toggle-status", toggleBrochureStatus);

// DELETE /api/v1/brochures/:id
// Permanently deletes a brochure.
router.delete("/:id", deleteBrochure);

export default router;
