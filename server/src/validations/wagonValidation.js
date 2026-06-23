const Joi = require('joi');
const { WAGON_TYPES, WAGON_CATEGORIES, WAGON_STATUSES, PRIORITY_LEVELS } = require('../utils/constants');

const repairTaskSchema = Joi.object({
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
  status: Joi.string().valid(...WAGON_STATUSES).default('In Service'),
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
  repairTasks: Joi.array().items(repairTaskSchema),
  isSteamed: Joi.boolean(),
  isDegassed: Joi.boolean(),
});

const update = Joi.object({
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
  repairTasks: Joi.array().items(repairTaskSchema),
  isSteamed: Joi.boolean(),
  isDegassed: Joi.boolean(),
}).min(1);

const search = Joi.object({
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
