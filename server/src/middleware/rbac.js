const ApiError = require('../utils/ApiError');
const { PERMISSIONS } = require('../utils/constants');

/**
 * Role-Based Access Control middleware.
 * @param {string} resource  - The resource key (e.g. 'wagons', 'sickLine')
 * @param {string} action    - The action letter: C, R, U, or D
 */
const authorize = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    const role = req.user.role;
    const rolePerms = PERMISSIONS[role];

    if (!rolePerms) {
      throw ApiError.forbidden('Invalid role');
    }

    const resourcePerms = rolePerms[resource];

    if (!resourcePerms || !resourcePerms.includes(action)) {
      throw ApiError.forbidden(
        `Role "${role}" does not have "${action}" permission on "${resource}"`
      );
    }

    next();
  };
};

/**
 * Restrict to specific roles (simpler variant).
 * @param  {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role "${req.user.role}" is not authorized for this action`
      );
    }

    next();
  };
};

module.exports = { authorize, restrictTo };
