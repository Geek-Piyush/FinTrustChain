import express from "express";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All notification routes require a user to be logged in.
router.use(protect);

// Get all notifications for the logged-in user
router.get("/", getMyNotifications);

// Get unread notification count — static route must come before /:id
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read — static route must come before /:id
router.patch("/mark-all-read", markAllAsRead);

// Mark a specific notification as read
router.patch("/:id/read", markAsRead);

// Delete a specific notification
router.delete("/:id", deleteNotification);

export default router;
