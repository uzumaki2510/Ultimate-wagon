const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminMiddleware');
const { paginate } = require('../middleware/pagination');
const adminController = require('../controllers/adminController');

// All admin routes require at least authentication and admin role
router.use(protect);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardMetrics);

// Users / Employees
router.get('/users', paginate, adminController.getAllUsers);
router.get('/pending-users', adminController.getPendingUsers);
router.put('/user/:id/approve', adminController.approveUser);
router.put('/user/:id/reject', adminController.rejectUser);

// Super Admin Only routes
router.use(requireSuperAdmin);

// Admin Management
router.post('/create-admin', adminController.createAdmin);
router.put('/user/:id/deactivate', adminController.deactivateUser);
router.put('/user/:id/reactivate', adminController.reactivateUser);
router.put('/user/:id/reset-password', adminController.resetAdminPassword);

// Audit Logs
router.get('/audit-logs', paginate, adminController.getAuditLogs);

module.exports = router;
