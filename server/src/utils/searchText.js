const ApiError = require('./ApiError');
module.exports = value => {
  if (typeof value !== 'string' || value.length > 200) throw ApiError.badRequest('Search text must be at most 200 characters');
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
