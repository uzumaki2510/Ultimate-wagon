const Workflow = require('../models/Workflow');
const Wagon = require('../models/Wagon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const write = require('../services/operationalWrite');
const { definitionFor, completedPath, validateStages } = require('../services/workflowRules');

exports.createWorkflow = asyncHandler(async (req, res) => {
  const workflow = await write(req, 'Workflow created', async session => {
    const wagon = await Wagon.findOne({ _id: req.body.wagonId, deletedAt: null }).session(session);
    if (!wagon) throw ApiError.notFound('Wagon not found');
    await Wagon.updateOne({ _id: wagon._id }, { $set: { updatedAt: new Date() } }, { session });
    const existing = await Workflow.findOne({ wagonId: wagon._id }).session(session);
    if (existing) return existing;
    if (wagon.archived || ['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status)) throw ApiError.conflict('Reopen an active wagon before creating its workflow');
    const def = definitionFor(wagon.type);
    const [record] = await Workflow.create([{
      wagonId: wagon._id, memoId: req.body.memoId || undefined, wagonNo: wagon.wagonNo, wagonType: wagon.type,
      currentStage: def.initialStage,
      stages: Object.values(def.stages).map(s => ({ stageName: s.key, status: 'Pending', targetDurationHours: s.targetDurationHours || 0 })),
    }], { session });
    return record;
  });
  return ApiResponse.created(res, 'Workflow created', workflow);
});
exports.getWorkflows = asyncHandler(async (req, res) => {
  const ids = await Wagon.find({ deletedAt: null, ...(req.query.includeArchived === 'true' ? {} : { archived: { $ne: true } }) }).distinct('_id');
  return ApiResponse.success(res, 'Workflows retrieved', await Workflow.find({ wagonId: { $in: ids } }).lean());
});
exports.getWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id).lean();
  if (!workflow) throw ApiError.notFound('Workflow not found');
  if (!await Wagon.exists({ _id: workflow.wagonId, deletedAt: null })) throw ApiError.notFound('Wagon not found');
  return ApiResponse.success(res, 'Workflow retrieved', workflow);
});
exports.updateWorkflow = asyncHandler(async (req, res) => {
  const workflow = await write(req, 'Workflow updated', async session => {
    const record = await Workflow.findById(req.params.id).session(session);
    if (!record) throw ApiError.notFound('Workflow not found');
    if (!req.body.expectedUpdatedAt || new Date(req.body.expectedUpdatedAt).getTime() !== record.updatedAt.getTime()) throw ApiError.conflict('Workflow changed. Refresh and try again');
    const wagon = await Wagon.findOne({ _id: record.wagonId, deletedAt: null }).session(session);
    if (!wagon) throw ApiError.notFound('Wagon not found');
    if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status)) throw ApiError.conflict('Reopen the wagon before changing its workflow');
    const def = definitionFor(wagon.type);
    const stages = req.body.stages || record.stages;
    validateStages(record.stages, stages, def);
    if (wagon.archived) throw ApiError.conflict('Archived workflow is read-only');
    if (wagon.assignment?.blockedReason && stages.some(stage => stage.status === 'Done' && record.stages.find(old => old.stageName === stage.stageName)?.status !== 'Done')) throw ApiError.conflict('Clear the work blocker before completing this stage');
    const previous = record.toObject();
    const currentStage = req.body.currentStage || record.currentStage;
    if (!def.stages[currentStage] || !stages.some(s => s.stageName === currentStage && s.status !== 'Skipped')) throw ApiError.badRequest('Invalid current stage');
    const activeStage = stages.find(s => ['In Progress', 'Paused', 'Delayed'].includes(s.status));
    if (activeStage && activeStage.stageName !== currentStage) throw ApiError.badRequest('Current stage must match active work');
    if (currentStage !== record.currentStage && stages.find(s => s.stageName === currentStage)?.status === 'Pending') throw ApiError.badRequest('Start the next stage through a workflow action');
    record.stages = stages.map(stage => {
      const old = record.stages.find(s => s.stageName === stage.stageName).toObject();
      if (old.status === 'Done' && ['remarks', 'staffName', 'inspectorName'].some(key => (stage[key] || '') !== (old[key] || '')) && (req.user.role === 'employee' || !req.body.reason?.trim())) throw ApiError.forbidden('Completed stage corrections require an administrator and a reason');
      const result = { ...old, status: stage.status, remarks: stage.remarks };
      if (old.status === 'Pending' && stage.status === 'In Progress') Object.assign(result, { startedAt: new Date(), staffName: req.user.name });
      if (old.status !== 'Done' && stage.status === 'Done') Object.assign(result, { completedAt: new Date(), inspectorName: req.user.name, durationHours: old.startedAt ? (Date.now() - new Date(old.startedAt).getTime()) / 3600000 : 0 });
      if (old.status === 'Done' && req.body.reason?.trim()) Object.assign(result, { staffName: stage.staffName, inspectorName: stage.inspectorName });
      return result;
    });
    record.currentStage = currentStage;
    record.actionHistory.push({ action: 'ADVANCE_WORKFLOW', stageName: currentStage, previousWorkflowSnapshot: JSON.stringify({ ...previous, actionHistory: undefined }), createdAt: new Date(), userName: req.user.name, reason: req.body.reason || '' });
    record.actionHistory = record.actionHistory.slice(-100);
    await record.save({ session });
    wagon.status = completedPath(record, def) ? 'FIT_CERTIFICATE_PENDING' : (stages.some(s => s.status !== 'Pending') ? 'REPAIR_IN_PROGRESS' : wagon.status);
    await wagon.save({ session });
    return record;
  });
  return ApiResponse.success(res, 'Workflow updated', workflow);
});
exports.deleteWorkflow = asyncHandler(async (req, res) => {
  await write(req, 'Workflow deleted', async session => {
    const record = await Workflow.findById(req.params.id).session(session);
    if (!record) throw ApiError.notFound('Workflow not found');
    const wagon = await Wagon.findById(record.wagonId).session(session);
    if (wagon && ['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status)) throw ApiError.conflict('Reopen the wagon first');
    await record.deleteOne({ session });
    return record;
  });
  return ApiResponse.success(res, 'Workflow deleted');
});

exports.correctWorkflow = asyncHandler(async (req, res) => {
  if (typeof req.body.reason !== 'string' || !req.body.reason.trim()) throw ApiError.badRequest('Correction reason required');
  const workflow = await write(req, 'Workflow corrected', async session => {
    const record = await Workflow.findById(req.params.id).session(session);
    if (!record) throw ApiError.notFound('Workflow not found');
    if (!req.body.expectedUpdatedAt || new Date(req.body.expectedUpdatedAt).getTime() !== record.updatedAt.getTime()) throw ApiError.conflict('Workflow changed. Refresh and try again');
    const wagon = await Wagon.findOne({ _id: record.wagonId, deletedAt: null }).session(session);
    if (!wagon) throw ApiError.notFound('Wagon not found');
    if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status)) throw ApiError.conflict('Reopen the wagon before correcting its workflow');
    const snapshot = JSON.stringify({ ...record.toObject(), actionHistory: undefined });
    if (req.body.action === 'undo') {
      const event = [...record.actionHistory].reverse().find(e => e.action !== 'CORRECTION' && !e.undoneAt);
      if (!event) throw ApiError.badRequest('No action to undo');
      const previous = JSON.parse(event.previousWorkflowSnapshot);
      record.stages = previous.stages; record.currentStage = previous.currentStage; record.cycleHistory = previous.cycleHistory || [];
      event.undoneAt = new Date();
    } else if (req.body.action === 'branch') {
      const def = definitionFor(wagon.type);
      const parent = def.stages[req.body.branchingStage];
      const old = record.stages.find(s => s.stageName === req.body.oldBranch);
      const next = record.stages.find(s => s.stageName === req.body.newBranch);
      if (!parent?.nextStages.includes(req.body.oldBranch) || !parent.nextStages.includes(req.body.newBranch) || !old || !next) throw ApiError.badRequest('Invalid branch correction');
      if (record.stages.find(s => s.stageName === parent.key)?.status !== 'Done') throw ApiError.badRequest('Complete the branching stage first');
      if (old.status !== 'Pending' || next.status !== 'Pending' || old.startedAt || next.startedAt) throw ApiError.conflict('Branch work has started. Undo the last action first');
      next.status = 'In Progress'; next.startedAt = new Date(); next.staffName = req.user.name;
      record.currentStage = next.stageName;
    } else throw ApiError.badRequest('Invalid correction action');
    record.actionHistory.push({ action: 'CORRECTION', stageName: record.currentStage, previousWorkflowSnapshot: snapshot, createdAt: new Date(), userName: req.user.name, reason: req.body.reason });
    await record.save({ session });
    wagon.status = completedPath(record, definitionFor(wagon.type)) ? 'FIT_CERTIFICATE_PENDING' : 'REPAIR_IN_PROGRESS';
    wagon.fitConfirmation = undefined;
    await wagon.save({ session });
    return record;
  });
  return ApiResponse.success(res, 'Workflow corrected', workflow);
});

exports.transitionWorkflow = asyncHandler(async (req, res) => ApiResponse.success(res, 'Workflow action saved', await require('../services/workflowTransition')(req)));
exports.getIntegrity = asyncHandler(async (req, res) => {
  const wagons = await Wagon.find({ deletedAt: null, archived: { $ne: true } }).lean();
  const workflows = await Workflow.find({ wagonId: { $in: wagons.map(w => w._id) } }).lean();
  return ApiResponse.success(res, 'Read-only integrity review', wagons.map(wagon => require('../services/workflowIntegrity').inspect(wagon, workflows.find(item => String(item.wagonId) === String(wagon._id)))).filter(item => item.problems.length));
});
exports.normalizeWorkflow = asyncHandler(async (req, res) => {
  if (typeof req.body.reason !== 'string' || !req.body.reason.trim()) throw ApiError.badRequest('Review reason required');
  const workflow = await write(req, 'Workflow names reconciled', async session => {
    const record = await Workflow.findById(req.params.id).session(session);
    if (!record) throw ApiError.notFound('Workflow not found');
    if (new Date(req.body.expectedUpdatedAt).getTime() !== record.updatedAt.getTime()) throw ApiError.conflict('Workflow changed. Refresh first');
    const wagon = await Wagon.findOne({ _id: record.wagonId, deletedAt: null }).session(session);
    if (!wagon) throw ApiError.notFound('Wagon not found');
    if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status)) throw ApiError.conflict('Reopen this wagon before reconciling history');
    const { inspect, canonicalStage } = require('../services/workflowIntegrity');
    const review = inspect(wagon, record);
    if (!review.canNormalize) throw ApiError.conflict('Ambiguous stage history requires manual review');
    const def = definitionFor(wagon.type);
    const snapshot = JSON.stringify({ ...record.toObject(), actionHistory: undefined });
    record.stages = Object.keys(def.stages).map(key => { const old = record.stages.find(stage => canonicalStage(def, stage.stageName) === key); return old ? { ...old.toObject(), stageName: key } : { stageName: key, status: 'Pending' }; });
    record.currentStage = canonicalStage(def, record.currentStage) || def.initialStage;
    record.actionHistory.push({ action: 'CORRECTION', stageName: record.currentStage, previousWorkflowSnapshot: snapshot, userName: req.user.name, reason: req.body.reason, createdAt: new Date() });
    await record.save({ session });
    await wagon.save({ session });
    return record;
  });
  return ApiResponse.success(res, 'Stage names reconciled without changing completion evidence', workflow);
});
