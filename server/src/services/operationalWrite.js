const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

// The business change and its audit record either both commit or neither commits.
// MongoDB must run as a replica set (Atlas and production replica sets support this).
module.exports = async (req, action, operation) => {
  let result;
  await mongoose.connection.transaction(async session => {
    result = await operation(session);
    await AuditLog.create([{
      action, performedBy: req.user._id, role: req.user.role,
      metadata: { wagonId: result?.wagonId?.toString() || (req.baseUrl.endsWith('/wagons') ? result?._id?.toString() : undefined), recordId: result?._id?.toString() || req.params.id, resource: req.baseUrl, source: 'server', ...(req.auditDetails || {}) },
    }], { session });
  });
  return result;
};
