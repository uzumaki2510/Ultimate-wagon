const Joi = require('joi');
const { INSPECTION_TYPES, INSPECTION_RESULTS } = require('../utils/constants');

const checklistItem = Joi.object({
  checked: Joi.boolean(),
  checkedBy: Joi.string().allow(''),
  checkedAt: Joi.date().allow(null),
  remarks: Joi.string().allow(''),
});

const create = Joi.object({
  wagon: Joi.string().required(),
  type: Joi.string().valid(...INSPECTION_TYPES).required(),
  date: Joi.date().default(() => new Date()),
  inspectorName: Joi.string().trim().required(),
  checklist: Joi.object().pattern(Joi.string(), checklistItem),
  safetyValidation: Joi.object({
    result: Joi.string().valid('Pass', 'Fail'),
    notes: Joi.string().allow(''),
  }),
  result: Joi.string().valid(...INSPECTION_RESULTS),
  remarks: Joi.string().trim().allow(''),
  roh: Joi.string().allow('', null),
});

const update = Joi.object({
  type: Joi.string().valid(...INSPECTION_TYPES),
  date: Joi.date(),
  inspectorName: Joi.string().trim(),
  checklist: Joi.object().pattern(Joi.string(), checklistItem),
  safetyValidation: Joi.object({
    result: Joi.string().valid('Pass', 'Fail'),
    notes: Joi.string().allow(''),
  }),
  result: Joi.string().valid(...INSPECTION_RESULTS),
  remarks: Joi.string().trim().allow(''),
  roh: Joi.string().allow('', null),
}).min(1);

module.exports = { create, update };
