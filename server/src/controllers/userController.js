const searchText = require('../utils/searchText');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Admin, Super Admin
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { q, role, isActive, status } = req.query;

  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: searchText(q), $options: 'i' } },
      { email: { $regex: searchText(q), $options: 'i' } },
      { empCode: { $regex: searchText(q), $options: 'i' } },
    ];
  }
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (status) filter.status = status;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Users retrieved', users, buildPaginationMeta(total, page, limit));
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Admin, Super Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw ApiError.notFound('User not found');
  return ApiResponse.success(res, 'User retrieved', user);
});

// @desc    Get pending users
// @route   GET /api/v1/users/pending
// @access  Admin, Super Admin
const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ status: 'pending' }).sort('-createdAt').lean();
  return ApiResponse.success(res, 'Pending users retrieved', users);
});

// @desc    Approve user
// @route   PUT /api/v1/users/:id/approve
// @access  Admin, Super Admin
const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (req.user.role !== 'super_admin' && user.role !== 'employee') throw ApiError.forbidden('Admins can only manage employees');
  user.status = 'approved';
  user.isActive = true;
  await user.save();

  return ApiResponse.success(res, 'User approved successfully', user);
});

// @desc    Reject user
// @route   PUT /api/v1/users/:id/reject
// @access  Admin, Super Admin
const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (user.role === 'super_admin' || (req.user.role !== 'super_admin' && user.role !== 'employee')) throw ApiError.forbidden('Cannot reject this account');
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.status = 'rejected';
  user.isActive = false;
  await user.save();

  return ApiResponse.success(res, 'User rejected successfully', user);
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Admin, Super Admin
const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name', 'department', 'designation', 'phone', 'empCode'];
  if (req.user.role === 'super_admin') allowed.push('role');
  req.body = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));

  const userToUpdate = await User.findById(req.params.id);
  if (!userToUpdate) throw ApiError.notFound('User not found');

  if (userToUpdate.role === 'super_admin' && req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Admins cannot modify Super Admins');
  }

  // Prevent admin from making someone a super_admin
  if (req.body.role === 'super_admin' && req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Only Super Admins can assign super_admin role');
  }

  if (req.user.role !== 'super_admin' && userToUpdate.role !== 'employee') throw ApiError.forbidden('Admins can only manage employees');
  const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, {
    new: true,
    runValidators: true,
  });

  return ApiResponse.success(res, 'User updated', user);
});

// @desc    Delete (deactivate) user
// @route   DELETE /api/v1/users/:id
// @access  Admin, Super Admin
const deleteUser = asyncHandler(async (req, res) => {
  const userToUpdate = await User.findById(req.params.id);
  if (!userToUpdate) throw ApiError.notFound('User not found');

  if (userToUpdate.role === 'super_admin') {
    throw ApiError.forbidden('Super Admins cannot be deactivated');
  }

  userToUpdate.tokenVersion = (userToUpdate.tokenVersion || 0) + 1;
  userToUpdate.isActive = false;
  await userToUpdate.save();

  return ApiResponse.success(res, 'User deactivated', userToUpdate);
});

// @desc    Create an Admin user
// @route   POST /api/v1/admin/create-admin
// @access  Super Admin
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, empCode, designation, department, phone } = req.body;

  if (req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Only Super Admins can create new Admins');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  const user = await User.create({
    name, email, password, empCode, designation, department, phone,
    role: 'admin',
    status: 'approved',
    isActive: true
  });

  return ApiResponse.created(res, 'Admin created successfully', user);
});

module.exports = { 
  getUsers, getUser, getPendingUsers, updateUser, deleteUser, 
  approveUser, rejectUser, createAdmin 
};
