const Joi = require('joi');
const { WAGON_TYPES, WAGON_CATEGORIES, WAGON_STATUSES, PRIORITY_LEVELS } = require('../utils/constants');

const repairTaskSchema = Joi.object({
  id: Joi.string(),
  status: Joi.string().valid('pending', 'in_progress', 'repaired', 'blocked'),
  location: Joi.string().allow(''), inspector: Joi.string().allow(''), reportedAt: Joi.date(), remarks: Joi.string().allow(''),
  category: Joi.string().required(),
  subRepair: Joi.string().required(),
  severity: Joi.string().valid(...PRIORITY_LEVELS).default('Normal'),
});

const create = Joi.object({
  wagonNo: Joi.string().trim().required(),
  type: Joi.string().valid(...WAGON_TYPES).required(),
  owner: Joi.string().trim().required(),
  category: Joi.string().valid(...WAGON_CATEGORIES),
  builtYear: Joi.number().integer().min(1950).max(new Date().getFullYear() + 1),
  status: Joi.string().valid(...WAGON_STATUSES).default('ARRIVED'),
  currentLocation: Joi.string().trim().allow(''),
  priority: Joi.string().valid(...PRIORITY_LEVELS).default('Normal'),
  defect: Joi.string().trim().allow(''),
  comments: Joi.string().trim().allow(''),
  rakeId: Joi.string().trim().allow(''),
  bookedTo: Joi.string().trim().allow(''),
  lastROHDate: Joi.date().allow(null),
  lastPOHDate: Joi.date().allow(null),
  rohStation: Joi.string().trim().allow(''),
  pohStation: Joi.string().trim().allow(''),
  repairTypes: Joi.array().items(Joi.string().max(200)).max(100),
  inspectionChecklist: Joi.object(Object.fromEntries(require('../../../shared/checklistKeys.json').map(key => [key, Joi.object({ checked: Joi.boolean().required(), checkedBy: Joi.string().allow(''), checkedAt: Joi.date(), remarks: Joi.string().allow('') })]))),
  fitConfirmation: Joi.object({ allStagesCompleted: Joi.boolean(), defectRectified: Joi.boolean(), repairChecklistCompleted: Joi.boolean(), finalInspectionCompleted: Joi.boolean(), noSafetyCriticalDefectOpen: Joi.boolean(), inspectorVerified: Joi.boolean(), noLeakageFound: Joi.boolean(), masterValveChecked: Joi.boolean(), bottomDischargeValveChecked: Joi.boolean(), deliveryPipeChecked: Joi.boolean(), blankFlangeChecked: Joi.boolean(), tankBarrelChecked: Joi.boolean(), safetyFittingsChecked: Joi.boolean(), steamingPurgingDegassingCompleted: Joi.boolean(), hydroTestingCompleted: Joi.boolean(), inspectorName: Joi.string().max(100), remarks: Joi.string().max(4000).allow(''), confirmedAt: Joi.date(), confirmedBy: Joi.string() }).allow(null),
  pohDate: Joi.string().allow(''), rohDate: Joi.string().allow(''), returnDate: Joi.string().allow(''),
  repairTasks: Joi.array().items(repairTaskSchema).max(200),
  isSteamed: Joi.boolean(),
  isDegassed: Joi.boolean(),
});

const update = Joi.object({
  expectedUpdatedAt: Joi.date().required(),
  archived: Joi.boolean(),
  wagonNo: Joi.string().trim(),
  type: Joi.string().valid(...WAGON_TYPES),
  owner: Joi.string().trim(),
  category: Joi.string().valid(...WAGON_CATEGORIES),
  builtYear: Joi.number().integer().min(1950).max(new Date().getFullYear() + 1),
  status: Joi.string().valid(...WAGON_STATUSES),
  currentLocation: Joi.string().trim().allow(''),
  priority: Joi.string().valid(...PRIORITY_LEVELS),
  defect: Joi.string().trim().allow(''),
  comments: Joi.string().trim().allow(''),
  rakeId: Joi.string().trim().allow(''),
  bookedTo: Joi.string().trim().allow(''),
  lastROHDate: Joi.date().allow(null),
  lastPOHDate: Joi.date().allow(null),
  rohStation: Joi.string().trim().allow(''),
  pohStation: Joi.string().trim().allow(''),
  repairTypes: Joi.array().items(Joi.string().max(200)).max(100),
  inspectionChecklist: Joi.object(Object.fromEntries(require('../../../shared/checklistKeys.json').map(key => [key, Joi.object({ checked: Joi.boolean().required(), checkedBy: Joi.string().allow(''), checkedAt: Joi.date(), remarks: Joi.string().allow('') })]))),
  fitConfirmation: Joi.object({ allStagesCompleted: Joi.boolean(), defectRectified: Joi.boolean(), repairChecklistCompleted: Joi.boolean(), finalInspectionCompleted: Joi.boolean(), noSafetyCriticalDefectOpen: Joi.boolean(), inspectorVerified: Joi.boolean(), noLeakageFound: Joi.boolean(), masterValveChecked: Joi.boolean(), bottomDischargeValveChecked: Joi.boolean(), deliveryPipeChecked: Joi.boolean(), blankFlangeChecked: Joi.boolean(), tankBarrelChecked: Joi.boolean(), safetyFittingsChecked: Joi.boolean(), steamingPurgingDegassingCompleted: Joi.boolean(), hydroTestingCompleted: Joi.boolean(), inspectorName: Joi.string().max(100), remarks: Joi.string().max(4000).allow(''), confirmedAt: Joi.date(), confirmedBy: Joi.string() }).allow(null),
  pohDate: Joi.string().allow(''), rohDate: Joi.string().allow(''), returnDate: Joi.string().allow(''),
  repairTasks: Joi.array().items(repairTaskSchema).max(200),
  isSteamed: Joi.boolean(),
  isDegassed: Joi.boolean(),
}).min(1);

const search = Joi.object({
  archived: Joi.boolean(),
  q: Joi.string().trim().allow(''),
  status: Joi.string().valid(...WAGON_STATUSES, ''),
  type: Joi.string().valid(...WAGON_TYPES, ''),
  category: Joi.string().valid(...WAGON_CATEGORIES, ''),
  priority: Joi.string().valid(...PRIORITY_LEVELS, ''),
  owner: Joi.string().trim().allow(''),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().trim(),
});

module.exports = { create, update, search };
