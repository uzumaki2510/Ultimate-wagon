const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { restrictTo } = require('../middleware/rbac');
const { protect } = require('../middleware/auth');

router.get('/', protect, masterDataController.getAllMasterData);
router.post('/', protect, restrictTo('super_admin'), masterDataController.createMasterData);
router.put('/:id', protect, restrictTo('super_admin'), masterDataController.updateMasterData);
router.delete('/:id', protect, restrictTo('super_admin'), masterDataController.deleteMasterData);

module.exports = router;
