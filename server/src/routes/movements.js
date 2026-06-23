const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const movementValidation = require('../validations/movementValidation');
const movementController = require('../controllers/movementController');

router.use(protect);

router.post('/', authorize('movements', 'C'), validate(movementValidation.create), movementController.createMovement);
router.get('/', authorize('movements', 'R'), paginate, movementController.getMovements);
router.get('/:id', authorize('movements', 'R'), movementController.getMovement);
router.get('/wagon/:wagonId', authorize('movements', 'R'), movementController.getWagonMovements);
router.put('/:id', authorize('movements', 'U'), validate(movementValidation.update), movementController.updateMovement);
router.delete('/:id', authorize('movements', 'D'), movementController.deleteMovement);

module.exports = router;
