const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated'));
  }
  if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.ADMIN) {
    return next(ApiError.forbidden('Requires administrator privileges'));
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated'));
  }
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return next(ApiError.forbidden('Requires super administrator privileges'));
  }
  next();
};

module.exports = { requireAdmin, requireSuperAdmin };
