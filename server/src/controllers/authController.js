const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateTokenPair, verifyRefreshToken } = require('../services/authService');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Admin
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, empCode, designation, department, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  const user = await User.create({
    name, email, password, role, empCode, designation, department, phone,
  });

  const tokens = generateTokenPair(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return ApiResponse.created(res, 'User registered successfully', {
    user: user.toJSON(),
    ...tokens,
  });
});

// @desc    Login
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Account has been deactivated. Contact admin.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokens = generateTokenPair(user._id);

  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  return ApiResponse.success(res, 'Login successful', {
    user: user.toJSON(),
    ...tokens,
  });
});

// @desc    Logout
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  return ApiResponse.success(res, 'Logged out successfully');
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, 'User profile', user);
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  const tokens = generateTokenPair(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return ApiResponse.success(res, 'Password changed successfully', { ...tokens });
});

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw ApiError.badRequest('Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const tokens = generateTokenPair(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return ApiResponse.success(res, 'Token refreshed', { ...tokens });
});

module.exports = { register, login, logout, getMe, changePassword, refreshToken };
