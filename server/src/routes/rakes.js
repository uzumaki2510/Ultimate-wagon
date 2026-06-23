const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const rakeController = require('../controllers/rakeController');

router.use(protect);

router.post('/', rakeController.createRake);
router.get('/', rakeController.getRakes);
router.get('/:id', rakeController.getRake);
router.put('/:id', rakeController.updateRake);
router.delete('/:id', rakeController.deleteRake);

module.exports = router;
