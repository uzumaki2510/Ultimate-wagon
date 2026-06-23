const Joi = require('joi');
const { MOVEMENT_STATUSES } = require('../utils/constants');

const create = Joi.object({
  wagon: Joi.string().required(),
  fromLocation: Joi.string().trim().required(),
  toLocation: Joi.string().trim().required(),
  movedAt: Joi.date().default(() => new Date()),
  purpose: Joi.string().trim().allow(''),
  rakeId: Joi.string().trim().allow(''),
  status: Joi.string().valid(...MOVEMENT_STATUSES).default('In Transit'),
});

const update = Joi.object({
  fromLocation: Joi.string().trim(),
  toLocation: Joi.string().trim(),
  movedAt: Joi.date(),
  purpose: Joi.string().trim().allow(''),
  rakeId: Joi.string().trim().allow(''),
  status: Joi.string().valid(...MOVEMENT_STATUSES),
}).min(1);

module.exports = { create, update };
