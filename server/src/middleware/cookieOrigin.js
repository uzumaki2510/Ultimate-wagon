const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Cookie-authenticated session endpoints must come from our own frontend.
module.exports = (req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.cookie?.includes('wagon_refresh=')) {
    if (req.headers.origin !== env.FRONTEND_URL) return next(ApiError.forbidden('Invalid request origin'));
  }
  next();
};
