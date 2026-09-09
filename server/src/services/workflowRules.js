const definitions = require('../../../shared/workflowDefinitions.json');
const ApiError = require('../utils/ApiError');
function definitionFor(type = '') {
  const t = type.toUpperCase();
  if (['BTPN', 'BTPNHS', 'BTPFLN', 'BTFLN'].includes(t)) return definitions.BTPN_LOCAL_TANK_WORKFLOW;
  if (['BTPGLN', 'BTPGN'].includes(t)) return definitions.BTPGLN_LOCAL_LPG_WORKFLOW;
  if (['BCN', 'BCNA', 'BCNAHS', 'BCNHL', 'BCN-HL', 'BCCNR', 'BCNMI'].includes(t)) return definitions.COVERED_WAGON_WORKFLOW;
  if (['BVCM', 'BVZI', 'BVZC'].includes(t)) return definitions.BRAKE_VAN_WORKFLOW;
  return definitions.GENERAL_FREIGHT_WORKFLOW;
}
function completedPath(workflow, def) {
  let key = def.initialStage;
  const visited = new Set();
  while (key && !visited.has(key)) {
    visited.add(key);
    if (workflow.stages.find(s => s.stageName === key)?.status !== 'Done') return false;
    const next = def.stages[key]?.nextStages;
    if (!next) return false;
    if (!next.length) return true;
    const selected = workflow.stages.find(s => s.stageName === key)?.selectedNextStage;
    key = selected && next.includes(selected) ? selected : next.find(k => !visited.has(k) && workflow.stages.find(s => s.stageName === k)?.status === 'Done');
  }
  return false;
}
function reaches(def, start, target, visited = new Set()) {
  if (start === target) return true;
  if (visited.has(start)) return false;
  visited.add(start);
  return (def.stages[start]?.nextStages || []).some(key => reaches(def, key, target, visited));
}
function validateStages(previous, next, def) {
  if (!Array.isArray(next) || next.length !== previous.length || new Set(next.map(s => s.stageName)).size !== next.length) throw ApiError.badRequest('Workflow stages cannot be added or removed');
  const transitions = { Pending: ['Pending', 'In Progress'], 'In Progress': ['In Progress', 'Paused', 'Done', 'Delayed'], Paused: ['Paused', 'In Progress'], Delayed: ['Delayed', 'In Progress', 'Done'], Done: ['Done'], Skipped: ['Skipped'] };
  for (const stage of next) {
    const old = previous.find(s => s.stageName === stage.stageName);
    if (!old || !def.stages[stage.stageName] || !transitions[old.status]?.includes(stage.status)) throw ApiError.badRequest('Invalid workflow stage transition');
    if (stage.status !== old.status && ['In Progress', 'Done'].includes(stage.status)) {
      const parents = Object.values(def.stages).filter(s => s.nextStages.includes(stage.stageName));
      if (stage.stageName !== def.initialStage && !parents.some(p => previous.find(s => s.stageName === p.key)?.status === 'Done')) throw ApiError.badRequest('Complete the preceding stage first');
      if (old.status === 'Pending' && parents.some(p => p.nextStages.length > 1 && p.nextStages.some(key => key !== stage.stageName && !reaches(def, key, p.key) && previous.some(s => s.stageName === key && !['Pending', 'Skipped'].includes(s.status))))) throw ApiError.badRequest('Another branch has already started; request an administrator correction');
      if (stage.status === 'Done' && !stage.inspectorName?.trim()) throw ApiError.badRequest('Inspector is required to complete a stage');
    }
  }
  if (next.filter(s => ['In Progress', 'Paused', 'Delayed'].includes(s.status)).length > 1) throw ApiError.badRequest('Only one workflow stage can be active');
}
module.exports = { definitionFor, completedPath, validateStages };
