const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const auditLogController = require('../controllers/auditLogController');

router.use(protect);

router.get('/', paginate, auditLogController.getAllAuditLogs);
router.post('/', auditLogController.createAuditLog);

module.exports = router;
