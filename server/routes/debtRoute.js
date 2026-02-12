import express from "express";
import { getMyDebts, getDebtSummary } from "../controllers/debtController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/my", getMyDebts);
router.get("/summary", getDebtSummary);

export default router;
