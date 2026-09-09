const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const dashboardController = require('../controllers/dashboardController');

router.use(protect);

router.get('/team-activity', authorize('dashboard', 'R'), dashboardController.getTeamActivity);
router.get('/stats', authorize('dashboard', 'R'), dashboardController.getStats);
router.get('/recent-activity', authorize('dashboard', 'R'), dashboardController.getRecentActivity);

module.exports = router;
