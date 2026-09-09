const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const rakeController = require('../controllers/rakeController');

router.use(protect);
const { authorize } = require('../middleware/rbac');

router.post('/', authorize('rakes', 'C'), rakeController.createRake);
router.get('/', rakeController.getRakes);
router.get('/:id', rakeController.getRake);
router.put('/:id', authorize('rakes', 'U'), rakeController.updateRake);
router.delete('/:id', authorize('rakes', 'D'), rakeController.deleteRake);

module.exports = router;
