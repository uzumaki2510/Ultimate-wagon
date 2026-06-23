const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Admin
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { q, role, isActive } = req.query;

  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { empCode: { $regex: q, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Users retrieved', users, buildPaginationMeta(total, page, limit));
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw ApiError.notFound('User not found');
  return ApiResponse.success(res, 'User retrieved', user);
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Admin
const updateUser = asyncHandler(async (req, res) => {
  // Prevent password updates through this endpoint
  delete req.body.password;
  delete req.body.refreshToken;

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) throw ApiError.notFound('User not found');
  return ApiResponse.success(res, 'User updated', user);
});

// @desc    Delete (deactivate) user
// @route   DELETE /api/v1/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!user) throw ApiError.notFound('User not found');
  return ApiResponse.success(res, 'User deactivated', user);
});

module.exports = { getUsers, getUser, updateUser, deleteUser };
