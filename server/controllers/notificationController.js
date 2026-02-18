import Notification from "../models/notificationModel.js";

// GET /notifications
export const getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/:id/read

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      throw new Error(
        "Notification not found or you are not authorized to update it."
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
  } catch (error) {
    next(error);
  }
};
