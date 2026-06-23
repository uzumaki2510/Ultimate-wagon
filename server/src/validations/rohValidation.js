const Joi = require('joi');
const { ROH_STATUSES } = require('../utils/constants');

const create = Joi.object({
  wagon: Joi.string().required(),
  scheduledDate: Joi.date().required(),
  station: Joi.string().trim().required(),
  startDate: Joi.date().allow(null),
  remarks: Joi.string().trim().allow(''),
});

const update = Joi.object({
  scheduledDate: Joi.date(),
  startDate: Joi.date().allow(null),
  completionDate: Joi.date().allow(null),
  station: Joi.string().trim(),
  status: Joi.string().valid(...ROH_STATUSES),
  remarks: Joi.string().trim().allow(''),
}).min(1);

module.exports = { create, update };
