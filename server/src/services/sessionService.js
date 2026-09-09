const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const { generateTokenPair, verifyRefreshToken } = require('./authService');
const env = require('../config/env');

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth' };
const readRefreshToken = req => {
  const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('wagon_refresh='));
  try { return cookie ? decodeURIComponent(cookie.slice('wagon_refresh='.length)) : req.body?.refreshToken; }
  catch { return null; }
};
const issueSession = async (user, res) => {
  const tokens = generateTokenPair(user._id, user.tokenVersion || 0);
  const decoded = verifyRefreshToken(tokens.refreshToken);
  await RefreshToken.create({ token: hashToken(tokens.refreshToken), user: user._id, expiresAt: new Date(decoded.exp * 1000) });
  res.cookie('wagon_refresh', tokens.refreshToken, { ...cookieOptions, expires: new Date(decoded.exp * 1000) });
  return { accessToken: tokens.accessToken };
};
const clearSessionCookie = res => res.clearCookie('wagon_refresh', cookieOptions);
module.exports = { hashToken, readRefreshToken, issueSession, clearSessionCookie };
