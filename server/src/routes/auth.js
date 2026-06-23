const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const authValidation = require('../validations/authValidation');
const authController = require('../controllers/authController');

router.post('/register', protect, authorize('users', 'C'), validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/change-password', protect, validate(authValidation.changePassword), authController.changePassword);
router.post('/refresh-token', authLimiter, validate(authValidation.refreshToken), authController.refreshToken);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.put('/reset-password/:token', authLimiter, authController.resetPassword);

module.exports = router;
