const Joi = require('joi');
const { ROLE_LIST } = require('../utils/constants');

const register = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(12).max(72).required(),
  role: Joi.string().valid(...ROLE_LIST).default('employee'),
  empCode: Joi.string().trim().allow(''),
  designation: Joi.string().trim().allow(''),
  department: Joi.string().trim().allow(''),
  phone: Joi.string().trim().allow(''),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(12).max(72).required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string(),
});

const profile = Joi.object({ name: Joi.string().trim().min(2).max(100), department: Joi.string().trim().max(100).allow(''), designation: Joi.string().trim().max(100).allow('') }).min(1);
const resetPassword = Joi.object({ password: Joi.string().min(12).max(72).required() });
module.exports = { profile, resetPassword, register, login, changePassword, refreshToken };
