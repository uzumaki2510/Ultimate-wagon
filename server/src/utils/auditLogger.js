const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Creates an audit log entry
 * @param {Object} params
 * @param {String} params.action - The action performed (e.g., 'Admin Created', 'Employee Approved')
 * @param {ObjectId} params.performedBy - ID of the user performing the action
 * @param {ObjectId} [params.targetUser] - ID of the user being acted upon (if any)
 * @param {String} [params.role] - Role of the user performing the action
 * @param {Object} [params.metadata] - Any additional metadata
 */
const createAuditLog = async ({ action, performedBy, targetUser, role, metadata }) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetUser,
      role,
      metadata
    });
  } catch (error) {
    logger.error(`Failed to create audit log: ${error.message}`, { action, performedBy });
  }
};

module.exports = { createAuditLog };
