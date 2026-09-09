const ApiError = require('../utils/ApiError');
const Workflow = require('../models/Workflow');
const { definitionFor, completedPath } = require('./workflowRules');

const assertFit = async (wagon, session) => {
  if (wagon.assignment?.blockedReason) throw ApiError.badRequest('Clear the work blocker before certification');
  const confirmation = wagon.fitConfirmation;
  const required = ['allStagesCompleted', 'defectRectified', 'finalInspectionCompleted', 'noSafetyCriticalDefectOpen', 'inspectorVerified'];
  if (!confirmation || required.some(key => confirmation[key] !== true) || !confirmation.inspectorName?.trim()) {
    throw ApiError.badRequest('Complete and sign the fitness confirmation before marking this wagon fit');
  }
  if ((wagon.repairTasks || []).some(task => task.status !== 'repaired')) throw ApiError.badRequest('All repair tasks must be completed');
  const workflow = await Workflow.findOne({ wagonId: wagon._id }).session(session);
  if (!workflow || !completedPath(workflow, definitionFor(wagon.type))) {
    throw ApiError.badRequest('Complete the workflow before marking this wagon fit');
  }
  if (['BTPN', 'BTPGLN', 'BTPFLN', 'BTPNHS', 'BTFLN'].includes(wagon.type)) {
    const tankChecks = ['noLeakageFound', 'masterValveChecked', 'bottomDischargeValveChecked', 'deliveryPipeChecked', 'blankFlangeChecked', 'tankBarrelChecked', 'safetyFittingsChecked', 'steamingPurgingDegassingCompleted', 'hydroTestingCompleted'];
    if (tankChecks.some(key => confirmation[key] !== true)) throw ApiError.badRequest('Complete every tank-wagon safety check');
  }
};
module.exports = { assertFit };
