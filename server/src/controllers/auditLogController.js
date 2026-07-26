const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

// @desc    Get all audit logs
// @route   GET /api/v1/audit-logs
// @access  Private
const getAllAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, skip = 0, sort = { createdAt: -1 } } = req.pagination || { skip: 0, limit: 50 };
  const { action, role, q } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (role) filter.role = role;
  
  if (q) {
    // Basic search on action or department in metadata
    filter.$or = [
      { action: { $regex: q, $options: 'i' } },
      { 'metadata.department': { $regex: q, $options: 'i' } },
      { 'metadata.wagonNo': { $regex: q, $options: 'i' } }
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('performedBy', 'name email empCode')
      .populate('targetUser', 'name email empCode')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Audit logs retrieved', logs, buildPaginationMeta(total, page, limit));
});

// @desc    Create a new audit log
// @route   POST /api/v1/audit-logs
// @access  Private
const createAuditLog = asyncHandler(async (req, res) => {
  const { action, metadata } = req.body;
  const performedBy = req.user ? req.user._id : null;
  const role = req.user ? req.user.role : 'System';

  const log = await AuditLog.create({
    action,
    performedBy,
    role,
    metadata
  });

  return ApiResponse.created(res, 'Audit log created', log);
});

module.exports = {
  getAllAuditLogs,
  createAuditLog
};
