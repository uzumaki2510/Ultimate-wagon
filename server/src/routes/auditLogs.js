const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');
const auditLogController = require('../controllers/auditLogController');

router.use(protect);

router.get('/', require('../middleware/rbac').restrictTo('admin', 'super_admin'), paginate, auditLogController.getAllAuditLogs);
// Audit records are created by server-side operations only.

module.exports = router;
