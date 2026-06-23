/**
 * Pagination middleware — extracts page, limit, sort from query params
 * and attaches pagination helpers to req.pagination
 */
const paginate = (req, res, next) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  // Sort: ?sort=-createdAt,name → { createdAt: -1, name: 1 }
  let sort = { createdAt: -1 }; // default: newest first
  if (req.query.sort) {
    sort = {};
    req.query.sort.split(',').forEach((field) => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });
  }

  req.pagination = { page, limit, skip, sort };
  next();
};

/**
 * Build pagination metadata for response
 */
const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { paginate, buildPaginationMeta };
