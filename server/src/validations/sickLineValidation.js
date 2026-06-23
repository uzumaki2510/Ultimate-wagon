const Joi = require('joi');
const { SICK_REASONS, BOOKED_TO, SICK_LINES, SICK_LINE_STATUSES, PRIORITY_LEVELS } = require('../utils/constants');

const defectSchema = Joi.object({
  name: Joi.string().required(),
  severity: Joi.string().valid(...PRIORITY_LEVELS).default('Normal'),
  description: Joi.string().allow(''),
});

const create = Joi.object({
  wagon: Joi.string().required(),
  entryDate: Joi.date().default(() => new Date()),
  reason: Joi.string().valid(...SICK_REASONS).required(),
  bookedTo: Joi.string().valid(...BOOKED_TO).allow(''),
  sickLine: Joi.string().valid(...SICK_LINES).allow(''),
  defects: Joi.array().items(defectSchema),
  assignedTo: Joi.string().allow('', null),
  remarks: Joi.string().trim().allow(''),
});

const update = Joi.object({
  reason: Joi.string().valid(...SICK_REASONS),
  bookedTo: Joi.string().valid(...BOOKED_TO).allow(''),
  sickLine: Joi.string().valid(...SICK_LINES).allow(''),
  defects: Joi.array().items(defectSchema),
  assignedTo: Joi.string().allow('', null),
  status: Joi.string().valid(...SICK_LINE_STATUSES),
  remarks: Joi.string().trim().allow(''),
}).min(1);

module.exports = { create, update };
