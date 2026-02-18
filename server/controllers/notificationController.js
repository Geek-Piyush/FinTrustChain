import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

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
