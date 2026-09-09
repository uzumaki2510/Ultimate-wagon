const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate access token
 */
const generateAccessToken = (userId, version = 0) => {
  return jwt.sign({ id: userId, version, purpose: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId, version = 0) => {
  return jwt.sign({ id: userId, version, purpose: 'refresh' }, env.JWT_REFRESH_SECRET, {
    jwtid: require('crypto').randomUUID(),
    expiresIn: env.JWT_REFRESH_EXPIRE,
  });
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
};

/**
 * Generate both tokens
 */
const generateTokenPair = (userId, version = 0) => {
  return {
    accessToken: generateAccessToken(userId, version),
    refreshToken: generateRefreshToken(userId, version),
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenPair,
};
