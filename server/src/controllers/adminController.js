const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { createAuditLog } = require('../utils/auditLogger');
const { ROLES, USER_STATUSES } = require('../utils/constants');
const { buildPaginationMeta } = require('../middleware/pagination');

// @desc    Get dashboard metrics
// @route   GET /api/v1/admin/dashboard
// @access  Admin, Super Admin
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const [
    totalEmployees,
    totalAdmins,
    pendingApprovals,
    activeUsers,
    rejectedUsers,
    recentRegistrations
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.EMPLOYEE }),
    User.countDocuments({ role: ROLES.ADMIN }),
    User.countDocuments({ status: 'pending' }),
    User.countDocuments({ isActive: true, status: 'approved' }),
    User.countDocuments({ status: 'rejected' }),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role status createdAt')
  ]);

  return ApiResponse.success(res, 'Dashboard metrics retrieved', {
    totalEmployees,
    totalAdmins,
    pendingApprovals,
    activeUsers,
    rejectedUsers,
    recentRegistrations
  });
});

// @desc    Get all users with filtering
// @route   GET /api/v1/admin/users
// @access  Admin, Super Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { q, role, status } = req.query;

  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { empCode: { $regex: q, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;
  if (status) filter.status = status;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort || { createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Users retrieved', users, buildPaginationMeta(total, page, limit));
});

// @desc    Get pending users
// @route   GET /api/v1/admin/pending-users
// @access  Admin, Super Admin
const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ status: 'pending' }).sort('-createdAt').lean();
  return ApiResponse.success(res, 'Pending users retrieved', users);
});

// @desc    Create an Admin user
// @route   POST /api/v1/admin/create-admin
// @access  Super Admin
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, empCode, designation, department, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  const user = await User.create({
    name, email, password, empCode, designation, department, phone,
    role: ROLES.ADMIN,
    status: 'approved',
    isActive: true
  });

  await createAuditLog({
    action: 'Admin Created',
    performedBy: req.user._id,
    targetUser: user._id,
    role: req.user.role,
    metadata: { adminEmail: user.email }
  });

  return ApiResponse.created(res, 'Admin created successfully', user);
});

// @desc    Approve user
// @route   PUT /api/v1/admin/user/:id/approve
// @access  Admin, Super Admin
const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  user.status = 'approved';
  user.isActive = true;
  await user.save();

  await createAuditLog({
    action: 'Employee Approved',
    performedBy: req.user._id,
    targetUser: user._id,
    role: req.user.role,
  });

  return ApiResponse.success(res, 'User approved successfully', user);
});

// @desc    Reject user
// @route   PUT /api/v1/admin/user/:id/reject
// @access  Admin, Super Admin
const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  user.status = 'rejected';
  user.isActive = false;
  await user.save();

  await createAuditLog({
    action: 'Employee Rejected',
    performedBy: req.user._id,
    targetUser: user._id,
    role: req.user.role,
  });

  return ApiResponse.success(res, 'User rejected successfully', user);
});

// @desc    Deactivate user
// @route   PUT /api/v1/admin/user/:id/deactivate
// @access  Super Admin
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (user.role === ROLES.SUPER_ADMIN) {
    throw ApiError.forbidden('Super Admins cannot be deactivated');
  }

  user.isActive = false;
  await user.save();

  await createAuditLog({
    action: 'User Deactivated',
    performedBy: req.user._id,
    targetUser: user._id,
    role: req.user.role,
  });

  return ApiResponse.success(res, 'User deactivated', user);
});

// @desc    Reactivate user
// @route   PUT /api/v1/admin/user/:id/reactivate
// @access  Super Admin
const reactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  user.isActive = true;
  await user.save();

  await createAuditLog({
    action: 'User Reactivated',
    performedBy: req.user._id,
    targetUser: user._id,
    role: req.user.role,
  });

  return ApiResponse.success(res, 'User reactivated', user);
});

// @desc    Reset admin password
// @route   PUT /api/v1/admin/user/:id/reset-password
// @access  Super Admin
const resetAdminPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) throw ApiError.badRequest('New password is required');

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (user.role === ROLES.SUPER_ADMIN && req.user._id.toString() !== user._id.toString()) {
    throw ApiError.forbidden('Super Admins can only reset their own passwords here');
  }

  user.password = newPassword;
  await user.save(); // triggers pre-save hash

  await createAuditLog({
    action: 'Password Reset',
    performedBy: req.user._id,
    targetUser: user._id,
    role: req.user.role,
  });

  return ApiResponse.success(res, 'Password reset successfully');
});

// @desc    Get audit logs
// @route   GET /api/v1/admin/audit-logs
// @access  Super Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { action, role } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (role) filter.role = role;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('performedBy', 'name email empCode')
      .populate('targetUser', 'name email empCode')
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Audit logs retrieved', logs, buildPaginationMeta(total, page, limit));
});

module.exports = {
  getDashboardMetrics,
  getAllUsers,
  getPendingUsers,
  createAdmin,
  approveUser,
  rejectUser,
  deactivateUser,
  reactivateUser,
  resetAdminPassword,
  getAuditLogs
};
