import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(protect);
router.use(restrictTo("ADMIN"));

// Dashboard
router.get("/stats", adminController.getStats);
router.get("/revenue", adminController.getRevenue);
router.get("/revenue/chart", adminController.getRevenueChart);

// User management
router.get("/users", adminController.getUsers);
router.patch("/users/:id/block", adminController.blockUser);

// Contract management
router.get("/contracts", adminController.getContracts);
router.get("/contracts/:contractId", adminController.getContractById);
router.patch("/contracts/:id/status", adminController.updateContractStatus);

export default router;
