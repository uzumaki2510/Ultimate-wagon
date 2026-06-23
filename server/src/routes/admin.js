const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const userController = require('../controllers/userController');

router.use(protect);

// Only roles with 'C' permission for 'admin' (which is just SUPER_ADMIN)
router.post('/create-admin', authorize('admin', 'C'), userController.createAdmin);

module.exports = router;
