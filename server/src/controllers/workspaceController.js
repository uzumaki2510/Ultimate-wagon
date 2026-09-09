const User = require('../models/User');
const Wagon = require('../models/Wagon');
const Workflow = require('../models/Workflow');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const write = require('../services/operationalWrite');

exports.assignees = asyncHandler(async (req, res) => ApiResponse.success(res, 'Available staff', await User.find({ status: 'approved', isActive: true }).select('_id name department designation').sort({ name: 1 }).lean()));
exports.assign = asyncHandler(async (req, res) => {
  const wagon = await write(req, 'Work assignment or handoff updated', async session => {
    const record = await Wagon.findOne({ _id: req.params.id, deletedAt: null, archived: { $ne: true } }).session(session);
    if (!record) throw ApiError.notFound('Active wagon not found');
    if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(record.status)) throw ApiError.conflict('Certified or released work cannot be reassigned');
    if (new Date(req.body.expectedUpdatedAt).getTime() !== record.updatedAt.getTime()) throw ApiError.conflict('Wagon changed. Refresh first');
    const previous = record.assignment?.toObject() || {};
    const admin = ['admin', 'super_admin'].includes(req.user.role);
    const own = String(previous.assigneeId || '') === String(req.user._id);
    const claiming = !previous.assigneeId && req.body.assigneeId === String(req.user._id);
    if (!admin && !own && !claiming) throw ApiError.forbidden('Only the assigned staff member or an administrator can update this work');
    const next = { ...previous };
    if ('assigneeId' in req.body && String(req.body.assigneeId || '') !== String(previous.assigneeId || '')) {
      if (!admin && !claiming) throw ApiError.forbidden('Ask an administrator to assign the next staff member');
      if (previous.assigneeId && !req.body.handoffNote?.trim()) throw ApiError.badRequest('A handoff note is required when changing staff');
      const staff = req.body.assigneeId ? await User.findOne({ _id: req.body.assigneeId, status: 'approved', isActive: true }).session(session) : null;
      if (req.body.assigneeId && !staff) throw ApiError.badRequest('Choose an active approved staff member');
      Object.assign(next, { assigneeId: staff?._id || null, assigneeName: staff?.name || '', assignedAt: new Date(), assignedBy: req.user._id });
    }
    if ('dueAt' in req.body) { if (!admin) throw ApiError.forbidden('Only administrators set due dates'); next.dueAt = req.body.dueAt; }
    for (const key of ['blockedReason', 'handoffNote']) if (key in req.body) {
      if (typeof req.body[key] !== 'string' || req.body[key].length > 4000) throw ApiError.badRequest('Notes must be text up to 4000 characters');
      next[key] = req.body[key].trim();
    }
    record.assignment = next;
    record.assignmentHistory.push({ at: new Date(), actorId: req.user._id, actorName: req.user.name, before: previous, after: next });
    record.assignmentHistory = record.assignmentHistory.slice(-100);
    await record.save({ session });
    req.auditDetails = { before: previous, after: next };
    return record;
  });
  return ApiResponse.success(res, 'Assignment saved', wagon);
});
exports.reopen = asyncHandler(async (req, res) => {
  if (typeof req.body.reason !== 'string' || req.body.reason.trim().length < 5 || req.body.reason.length > 4000) throw ApiError.badRequest('Explain why this record needs reopening');
  const wagon = await write(req, 'Wagon reopened for correction', async session => {
    const record = await Wagon.findOne({ _id: req.params.id, deletedAt: null }).session(session);
    if (!record) throw ApiError.notFound('Wagon not found');
    if (new Date(req.body.expectedUpdatedAt).getTime() !== record.updatedAt.getTime()) throw ApiError.conflict('Wagon changed. Refresh first');
    if (record.status === 'IN_SERVICE') throw ApiError.conflict('An in-service wagon must be re-inducted through the operational process');
    if (!['FIT_READY', 'RELEASED'].includes(record.status)) throw ApiError.badRequest('Only a certified or released wagon needs reopening');
    const before = { status: record.status, fitConfirmation: record.fitConfirmation, certifiedAt: record.certifiedAt, releasedAt: record.releasedAt };
    record.certificationHistory.push({ ...before, reopenedAt: new Date(), actorId: req.user._id, actorName: req.user.name, reason: req.body.reason.trim() });
    record.status = 'SICK_LINE'; record.fitConfirmation = undefined; record.certifiedAt = null; record.releasedAt = null; record.archived = false;
    await record.save({ session });
    req.auditDetails = { before, reason: req.body.reason.trim(), afterStatus: record.status };
    return record;
  });
  return ApiResponse.success(res, 'Wagon reopened; earlier certification retained in history', wagon);
});
exports.readiness = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findOne({ _id: req.params.id, deletedAt: null });
  if (!wagon) throw ApiError.notFound('Wagon not found');
  const workflow = await Workflow.findOne({ wagonId: wagon._id });
  const { inspect } = require('../services/workflowIntegrity');
  const { definitionFor, completedPath } = require('../services/workflowRules');
  const documents = await require('../models/WagonDocument').find({ wagonId: wagon._id, deletedAt: null }).select('_id type name version uploadedAt scanStatus');
  const blockers = [];
  if (!workflow || !completedPath(workflow, definitionFor(wagon.type))) blockers.push('Complete the configured workflow');
  const open = wagon.repairTasks.filter(task => task.status !== 'repaired');
  if (open.length) blockers.push(`${open.length} repair task(s) remain open`);
  if (wagon.assignment?.blockedReason) blockers.push(`Work is blocked: ${wagon.assignment.blockedReason}`);
  return ApiResponse.success(res, 'Fitness readiness', { blockers, integrity: inspect(wagon, workflow), documents, certificate: wagon.fitConfirmation || null, certifiedAt: wagon.certifiedAt || null, releasedAt: wagon.releasedAt || null });
});
