const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const notificationController = require('../controllers/notificationController');

router.use(protect);

router.get('/', paginate, notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
