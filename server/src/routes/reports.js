const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const reportController = require('../controllers/reportController');

router.use(protect);

router.get('/daily', authorize('reports', 'R'), reportController.getDailyReport);
router.get('/monthly', authorize('reports', 'R'), reportController.getMonthlyReport);
router.get('/wagon/:wagonId', authorize('reports', 'R'), reportController.getWagonReport);
router.get('/roh', authorize('reports', 'R'), reportController.getROHReport);
router.get('/sick-line', authorize('reports', 'R'), reportController.getSickLineReport);

module.exports = router;
