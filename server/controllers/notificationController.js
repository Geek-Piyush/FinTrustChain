import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

// GET /notifications/unread-count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    isRead: false,
  });

  res.status(200).json({
    status: "success",
    data: { count },
  });
});

// PATCH /notifications/mark-all-read
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true },
  );

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read.",
  });
});

// DELETE /notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!notification) {
    throw new AppError(
      "Notification not found or you are not authorized to delete it.",
      404,
    );
  }

  res.status(204).json({ status: "success", data: null });
});

// GET /notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  const query = { user: req.user.id };

  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: notifications.length,
    totalPages: Math.ceil(total / limit),
    page,
    data: {
      notifications,
    },
  });
});

// PATCH /notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!notification) {
    throw new AppError(
      "Notification not found or you are not authorized to update it.",
      404,
    );
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    status: "success",
    data: {
      notification,
    },
  });
});
