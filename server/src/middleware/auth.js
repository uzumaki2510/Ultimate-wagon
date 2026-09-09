const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

/**
 * Protect routes — verify JWT and attach user to req.user
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authorized — no token provided');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      throw ApiError.unauthorized('User belonging to this token no longer exists');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('User account has been deactivated');
    }

    if (user.status !== 'approved') throw ApiError.forbidden('Account approval required');
    if (decoded.purpose !== 'access' || decoded.version !== (user.tokenVersion || 0)) {
      throw ApiError.unauthorized('Session expired');
    }
    const passwordRoutes = ['/change-password', '/logout', '/me'];
    if (user.forcePasswordChange && !(req.baseUrl.endsWith('/auth') && passwordRoutes.includes(req.path))) {
      throw ApiError.forbidden('Password change required');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized('Not authorized — invalid token');
  }
});

/**
 * Optional auth — attach user if token present, but don't block
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (user && user.isActive && user.status === 'approved' && !user.forcePasswordChange && decoded.purpose === 'access' && decoded.version === (user.tokenVersion || 0)) {
        req.user = user;
      }
    } catch {
      // Token invalid — proceed without user
    }
  }

  next();
});

module.exports = { protect, optionalAuth };
