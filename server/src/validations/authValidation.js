const Joi = require('joi');
const { ROLE_LIST } = require('../utils/constants');

const register = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
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
  newPassword: Joi.string().min(6).max(128).required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { register, login, changePassword, refreshToken };
