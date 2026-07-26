const Notification = require('../models/Notification');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');
const User = require('../models/User');
const { ROLES } = require('../utils/constants');

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, skip = 0 } = req.pagination || { skip: 0, limit: 50 };
  const { isRead } = req.query;

  const filter = { user: req.user._id };
  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return ApiResponse.paginated(res, 'Notifications retrieved', { notifications, unreadCount }, buildPaginationMeta(total, page, limit));
});

// @desc    Mark a notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return ApiResponse.error(res, 'Notification not found', 404);
  }

  return ApiResponse.success(res, 'Notification marked as read', notification);
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  return ApiResponse.success(res, 'All notifications marked as read');
});

// @desc    Create a notification (Internal or Admin API)
// @route   POST /api/v1/notifications
// @access  Private (Admin only or system triggered)
const createNotification = asyncHandler(async (req, res) => {
  const { type, title, message, refModel, refId, targetRoles } = req.body;
  
  // If targetRoles is provided, notify all users with those roles
  // Otherwise default to the current user (for testing/mocking)
  let targetUsers = [req.user._id];
  
  if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
    const users = await User.find({ role: { $in: targetRoles }, isActive: true }).select('_id');
    targetUsers = users.map(u => u._id);
  }

  const notificationsToCreate = targetUsers.map(userId => ({
    user: userId,
    type,
    title,
    message,
    refModel,
    refId
  }));

  const created = await Notification.insertMany(notificationsToCreate);

  return ApiResponse.created(res, 'Notifications created', created);
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};
