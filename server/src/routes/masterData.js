const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { protect } = require('../middleware/auth');

router.get('/', protect, masterDataController.getAllMasterData);
router.post('/', protect, masterDataController.createMasterData);
router.put('/:id', protect, masterDataController.updateMasterData);
router.delete('/:id', protect, masterDataController.deleteMasterData);

module.exports = router;
