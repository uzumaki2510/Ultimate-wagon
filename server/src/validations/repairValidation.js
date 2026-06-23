const Joi = require('joi');
const { REPAIR_CATEGORIES, REPAIR_STATUSES, PRIORITY_LEVELS } = require('../utils/constants');

const sparePartSchema = Joi.object({
  name: Joi.string().required(),
  partNo: Joi.string().allow(''),
  quantity: Joi.number().integer().min(1).required(),
  unit: Joi.string().default('pcs'),
});

const create = Joi.object({
  wagon: Joi.string().required(),
  sickLine: Joi.string().allow('', null),
  category: Joi.string().valid(...REPAIR_CATEGORIES).required(),
  description: Joi.string().trim().required(),
  severity: Joi.string().valid(...PRIORITY_LEVELS).default('Normal'),
  spareParts: Joi.array().items(sparePartSchema),
  labourHours: Joi.number().min(0),
  assignedTo: Joi.string().allow('', null),
  startDate: Joi.date().allow(null),
  remarks: Joi.string().trim().allow(''),
});

const update = Joi.object({
  category: Joi.string().valid(...REPAIR_CATEGORIES),
  description: Joi.string().trim(),
  severity: Joi.string().valid(...PRIORITY_LEVELS),
  spareParts: Joi.array().items(sparePartSchema),
  labourHours: Joi.number().min(0),
  assignedTo: Joi.string().allow('', null),
  startDate: Joi.date().allow(null),
  completionDate: Joi.date().allow(null),
  status: Joi.string().valid(...REPAIR_STATUSES),
  remarks: Joi.string().trim().allow(''),
}).min(1);

module.exports = { create, update };
