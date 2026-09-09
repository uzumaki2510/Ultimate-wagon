const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateTokenPair, verifyRefreshToken } = require('../services/authService');
const RefreshToken = require('../models/RefreshToken');
const { hashToken, readRefreshToken, issueSession, clearSessionCookie } = require('../services/sessionService');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, empCode, designation, department, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  const user = await User.create({
    name, email, password, empCode, designation, department, phone,
    role: 'employee',
    status: 'pending'
  });

  return ApiResponse.created(res, 'User registered successfully. Pending admin approval.', {
    user: user.toJSON(),
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

  // Check lockout
  if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
    throw ApiError.unauthorized('Account locked due to too many failed attempts. Try again later.');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Account has been deactivated. Contact admin.');
  }

  if (user.status === 'pending') {
    throw ApiError.forbidden('Your account is pending approval by an admin.');
  }
  if (user.status === 'rejected') {
    throw ApiError.forbidden('Your account registration was rejected.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins
    }
    await user.save();
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Reset attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  
  const tokens = await issueSession(user, res);

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
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  await RefreshToken.deleteMany({ user: req.user._id });
  clearSessionCookie(res);
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
  user.forcePasswordChange = false;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  await RefreshToken.deleteMany({ user: user._id }); // Invalidate all old sessions

  const tokens = await issueSession(user, res);

  return ApiResponse.success(res, 'Password changed successfully', { ...tokens });
});

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const token = readRefreshToken(req);

  if (!token) {
    throw ApiError.badRequest('Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenDoc = await RefreshToken.findOneAndDelete({ token: hashToken(token), user: decoded.id, expiresAt: { $gt: new Date() } });
  if (!tokenDoc) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive || user.status !== 'approved' || decoded.purpose !== 'refresh' || decoded.version !== (user.tokenVersion || 0)) {
    clearSessionCookie(res);
    throw ApiError.unauthorized('Session expired');
  }

  const tokens = await issueSession(user, res);

  return ApiResponse.success(res, 'Token refreshed', { ...tokens });
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  // Password recovery requires a configured delivery channel. Never log reset credentials.
  return ApiResponse.success(res, 'Contact your administrator to reset your password.');
});

// @desc    Reset Password
// @route   PUT /api/v1/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const crypto = require('crypto');
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired password reset token');
  }

  user.password = req.body.password;
  user.forcePasswordChange = false;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.failedLoginAttempts = 0;
  user.lockoutUntil = undefined;
  await user.save();

  await RefreshToken.deleteMany({ user: user._id });
  clearSessionCookie(res);
  return ApiResponse.success(res, 'Password successfully reset. You can now login.');
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { new: true, runValidators: true });
  return ApiResponse.success(res, 'Profile updated', user);
});

module.exports = { updateProfile, register, login, logout, getMe, changePassword, refreshToken, forgotPassword, resetPassword };
