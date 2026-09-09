const { definitionFor, completedPath } = require('./workflowRules');
const compact = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function canonicalStage(def, value) {
  const keys = Object.keys(def.stages).filter(key => [key, def.stages[key].label, def.stages[key].shortLabel].filter(Boolean).some(name => compact(name) === compact(value)));
  return keys.length === 1 ? keys[0] : null;
}
function inspect(wagon, workflow) {
  const def = definitionFor(wagon.type);
  const problems = [];
  const mapped = (workflow?.stages || []).map(stage => ({ from: stage.stageName, to: canonicalStage(def, stage.stageName) }));
  if (!workflow) problems.push('No saved workflow');
  const current = workflow && canonicalStage(def, workflow.currentStage);
  if (workflow && !current) problems.push('Current stage is unrecognized');
  if (mapped.some(item => !item.to)) problems.push('Unrecognized stage names need manual review');
  if (mapped.some(item => item.to && item.to !== item.from)) problems.push('Legacy stage names can be normalized');
  if (new Set(mapped.map(item => item.to)).size !== mapped.length) problems.push('Duplicate or ambiguous stages');
  if (workflow && Object.keys(def.stages).some(key => !mapped.some(item => item.to === key))) problems.push('Configured stages are missing');
  if (workflow?.stages.filter(stage => ['In Progress', 'Paused', 'Delayed'].includes(stage.status)).length > 1) problems.push('Multiple stages are active');
  if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status) && (!workflow || !completedPath(workflow, def) || (wagon.repairTasks || []).some(task => task.status !== 'repaired'))) problems.push('Certified/released status lacks completed evidence');
  return { wagonId: wagon._id || wagon.id, wagonNo: wagon.wagonNo, workflowId: workflow?._id || workflow?.id, problems, mapping: mapped, canNormalize: !!workflow && !!current && mapped.every(item => item.to) && new Set(mapped.map(item => item.to)).size === mapped.length };
}
module.exports = { inspect, canonicalStage };
