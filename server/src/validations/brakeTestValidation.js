const Joi = require('joi');
const { BRAKE_TEST_TYPES, BRAKE_TEST_RESULTS } = require('../utils/constants');

const create = Joi.object({
  wagon: Joi.string().required(),
  testType: Joi.string().valid(...BRAKE_TEST_TYPES).required(),
  testDate: Joi.date().default(() => new Date()),
  brakePower: Joi.number().min(0).max(100),
  airPressure: Joi.number().min(0),
  cylinderPressure: Joi.number().min(0),
  pipeLeakage: Joi.boolean(),
  distributorValveOk: Joi.boolean(),
  brakeBlockCondition: Joi.string().trim().allow(''),
  result: Joi.string().valid(...BRAKE_TEST_RESULTS).required(),
  testedBy: Joi.string().trim().required(),
  remarks: Joi.string().trim().allow(''),
});

const update = Joi.object({
  testType: Joi.string().valid(...BRAKE_TEST_TYPES),
  testDate: Joi.date(),
  brakePower: Joi.number().min(0).max(100),
  airPressure: Joi.number().min(0),
  cylinderPressure: Joi.number().min(0),
  pipeLeakage: Joi.boolean(),
  distributorValveOk: Joi.boolean(),
  brakeBlockCondition: Joi.string().trim().allow(''),
  result: Joi.string().valid(...BRAKE_TEST_RESULTS),
  testedBy: Joi.string().trim(),
  remarks: Joi.string().trim().allow(''),
}).min(1);

module.exports = { create, update };
