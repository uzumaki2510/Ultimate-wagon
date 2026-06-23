const Joi = require('joi');
const { CERTIFICATION_TYPES, CERTIFICATION_STATUSES } = require('../utils/constants');

const create = Joi.object({
  wagon: Joi.string().required(),
  type: Joi.string().valid(...CERTIFICATION_TYPES).required(),
  issuedDate: Joi.date().default(() => new Date()),
  expiryDate: Joi.date().allow(null),
  issuedBy: Joi.string().trim().required(),
  inspections: Joi.array().items(Joi.string()),
  remarks: Joi.string().trim().allow(''),
});

const update = Joi.object({
  type: Joi.string().valid(...CERTIFICATION_TYPES),
  issuedDate: Joi.date(),
  expiryDate: Joi.date().allow(null),
  issuedBy: Joi.string().trim(),
  inspections: Joi.array().items(Joi.string()),
  status: Joi.string().valid(...CERTIFICATION_STATUSES),
  remarks: Joi.string().trim().allow(''),
}).min(1);

module.exports = { create, update };
