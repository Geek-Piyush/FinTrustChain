import Notification from "../models/notificationModel.js";
import logger from "../utils/logger.js";

/**
 * Creates and saves a new notification for a specific user.
 * This service acts as the single point of entry for all notification creation,
 * ensuring consistency and making it easy to add more complex logic later
 *
 * @param {object} user - The user document or user ID of the recipient.
 * @param {string} message - The notification message to be displayed.
 * @param {string} [link] - An optional relative URL for the frontend to use for redirection.
 */
export async function createNotification(user, message, link) {
  try {
    // Ensure we handle both full user objects and plain IDs.
    const userId = user._id || user;
    await Notification.create({
      user: userId,
      message,
      link,
    });
  } catch (error) {
    logger.error(`Failed to create notification for user ${user._id}:`, error);
  }
}
