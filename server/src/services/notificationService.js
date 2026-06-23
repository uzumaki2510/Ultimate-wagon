const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 */
const createNotification = async ({ userId, type, title, message, refModel, refId }) => {
  return Notification.create({
    user: userId,
    type,
    title,
    message,
    refModel,
    refId,
  });
};

/**
 * Create notifications for multiple users
 */
const notifyMultipleUsers = async (userIds, { type, title, message, refModel, refId }) => {
  const docs = userIds.map((userId) => ({
    user: userId,
    type,
    title,
    message,
    refModel,
    refId,
  }));
  return Notification.insertMany(docs);
};

/**
 * Get unread notifications for a user
 */
const getUnreadNotifications = async (userId, limit = 20) => {
  return Notification.find({ user: userId, isRead: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
};

module.exports = {
  createNotification,
  notifyMultipleUsers,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
};
