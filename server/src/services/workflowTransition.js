const crypto = require('crypto');
const mongoose = require('mongoose');
const Workflow = require('../models/Workflow');
const Wagon = require('../models/Wagon');
const Receipt = require('../models/WorkflowOperation');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const { definitionFor, validateStages, completedPath } = require('./workflowRules');

module.exports = async (req) => {
  const { operationId, expectedUpdatedAt, action, stageName, nextStage, remarks = '' } = req.body;
  if (typeof operationId !== 'string' || !/^[\w-]{16,100}$/.test(operationId) || !['start', 'pause', 'resume', 'complete'].includes(action) || typeof stageName !== 'string' || typeof remarks !== 'string' || remarks.length > 4000) throw ApiError.badRequest('Invalid workflow action');
  const key = `${req.user._id}:${operationId}`;
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify([req.params.id, expectedUpdatedAt, action, stageName, nextStage || null, remarks])).digest('hex');
  const snapshot = async () => {
    const workflow = await Workflow.findById(req.params.id);
    const wagon = workflow && await Wagon.findOne({ _id: workflow.wagonId, deletedAt: null });
    if (!workflow || !wagon) throw ApiError.notFound('Workflow or wagon no longer available');
    return { workflow, wagon };
  };
  const replay = async () => {
    const receipt = await Receipt.findOne({ key });
    if (!receipt) return null;
    if (receipt.fingerprint !== fingerprint) throw ApiError.conflict('This operation ID was already used for a different action');
    return snapshot();
  };
  const existing = await replay();
  if (existing) return existing;
  try {
    await mongoose.connection.transaction(async session => {
      const receipt = await Receipt.findOne({ key }).session(session);
      if (receipt) { if (receipt.fingerprint !== fingerprint) throw ApiError.conflict('Operation ID already used'); return; }
      const workflow = await Workflow.findById(req.params.id).session(session);
      if (!workflow) throw ApiError.notFound('Workflow not found');
      const wagon = await Wagon.findOne({ _id: workflow.wagonId, deletedAt: null, archived: { $ne: true } }).session(session);
      if (!wagon) throw ApiError.notFound('Active wagon not found');
      if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status)) throw ApiError.conflict('Reopen the wagon before changing its workflow');
      if (action === 'complete' && wagon.assignment?.blockedReason) throw ApiError.conflict('Clear the work blocker before completing this stage');
      if (!expectedUpdatedAt || new Date(expectedUpdatedAt).getTime() !== workflow.updatedAt.getTime()) throw ApiError.conflict('Workflow changed. Refresh and review the latest stage');
      const def = definitionFor(wagon.type);
      if (!def.stages[stageName] || workflow.currentStage !== stageName) throw ApiError.conflict('This is not the current stage');
      if (workflow.stages.some(stage => !def.stages[stage.stageName])) throw ApiError.conflict('Review legacy stage names before continuing');
      const previous = workflow.toObject();
      let stages = previous.stages.map(stage => ({ ...stage }));
      const stage = stages.find(item => item.stageName === stageName);
      const now = new Date();
      if (!stage) throw ApiError.badRequest('Stage is missing from the saved workflow');
      if (action === 'start') {
        if (stage.status !== 'Pending') throw ApiError.conflict('Stage has already started');
        Object.assign(stage, { status: 'In Progress', startedAt: now, staffName: req.user.name });
      } else if (action === 'pause') {
        if (stage.status !== 'In Progress' || !remarks.trim()) throw ApiError.badRequest('An active stage and pause reason are required');
        Object.assign(stage, { status: 'Paused', remarks, pausedAt: now });
      } else if (action === 'resume') {
        if (!['Paused', 'Delayed'].includes(stage.status)) throw ApiError.conflict('Only a paused or delayed stage can resume');
        stage.status = 'In Progress';
        stage.pausedDurationMs = (stage.pausedDurationMs || 0) + (stage.pausedAt ? now - new Date(stage.pausedAt) : 0);
        stage.pausedAt = null;
      } else {
        if (!['In Progress', 'Done'].includes(stage.status)) throw ApiError.conflict('Start or resume this stage before completing it');
        if (def.stages[stageName].nextStages.length && !def.stages[stageName].nextStages.includes(nextStage)) throw ApiError.badRequest('Choose a valid next route');
        if (!def.stages[stageName].nextStages.length && nextStage) throw ApiError.badRequest('Final stage has no next route');
        if (stage.status !== 'Done') Object.assign(stage, { status: 'Done', completedAt: now, inspectorName: req.user.name, remarks, durationHours: Math.max(0, (now - new Date(stage.startedAt) - (stage.pausedDurationMs || 0)) / 3600000) });
        stage.selectedNextStage = nextStage;
      }
      validateStages(previous.stages, stages, def);
      if (action === 'complete' && nextStage) {
        const target = stages.find(item => item.stageName === nextStage);
        if (target?.status === 'Done') {
          // An explicitly configured back-edge starts a new work cycle, preserving the old evidence.
          const affected = new Set();
          const visit = key => { if (affected.has(key)) return; affected.add(key); def.stages[key].nextStages.forEach(visit); };
          visit(nextStage);
          if (!affected.has(stageName)) throw ApiError.conflict('This is not a configured return route');
          if (!remarks.trim()) throw ApiError.badRequest('Record a reason before returning to an earlier stage');
          workflow.cycleHistory.push({ fromStage: stageName, returnedTo: nextStage, reason: remarks, actorName: req.user.name, completedAt: now, stages: stages.filter(item => affected.has(item.stageName)) });
          stages = stages.map(item => affected.has(item.stageName) ? { stageName: item.stageName, status: 'Pending', targetDurationHours: item.targetDurationHours } : item);
        }
        const beforeAdvance = stages.map(item => ({ ...item }));
        const next = stages.find(item => item.stageName === nextStage);
        if (!next || next.status !== 'Pending') throw ApiError.conflict('The next stage has already started');
        Object.assign(next, { status: 'In Progress', startedAt: now, staffName: req.user.name });
        validateStages(beforeAdvance, stages, def);
        workflow.currentStage = nextStage;
      }
      workflow.stages = stages;
      workflow.actionHistory.push({ action: action === 'complete' ? 'ADVANCE_WORKFLOW' : action === 'start' ? 'START_STAGE' : action === 'pause' ? 'PAUSE_STAGE' : 'RESUME_STAGE', stageName, previousWorkflowSnapshot: JSON.stringify({ ...previous, actionHistory: undefined }), userName: req.user.name, reason: remarks, createdAt: now });
      workflow.actionHistory = workflow.actionHistory.slice(-100);
      await workflow.save({ session });
      wagon.status = completedPath(workflow, def) ? 'FIT_CERTIFICATE_PENDING' : 'REPAIR_IN_PROGRESS';
      await wagon.save({ session });
      await Receipt.create([{ key, fingerprint, workflowId: workflow._id, actorId: req.user._id }], { session });
      await AuditLog.create([{ action: `Workflow ${action}`, performedBy: req.user._id, role: req.user.role, metadata: { wagonId: wagon._id.toString(), workflowId: workflow.id, stageName, nextStage, reason: remarks, operationId, source: 'server' } }], { session });
    });
  } catch (error) {
    if (error.code === 11000 || error.statusCode === 409) { const recovered = await replay(); if (recovered) return recovered; }
    throw error;
  }
  return snapshot();
};
