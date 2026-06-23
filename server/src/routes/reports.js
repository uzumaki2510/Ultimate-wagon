const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// All report routes require at least admin privileges
router.use(protect);
router.use(requireAdmin);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/wagons', reportController.getWagonsReport);
router.get('/repairs', reportController.getRepairsReport);
router.get('/inspections', reportController.getInspectionsReport);
router.get('/employees', reportController.getEmployeesReport);
router.get('/audit-logs', reportController.getAuditLogsReport);

router.post('/export/pdf', reportController.exportPDF);
router.post('/export/excel', reportController.exportExcel);

module.exports = router;
