const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const brakeTestValidation = require('../validations/brakeTestValidation');
const brakeTestController = require('../controllers/brakeTestController');

router.use(protect);

router.post('/', authorize('brakeTests', 'C'), validate(brakeTestValidation.create), brakeTestController.createBrakeTest);
router.get('/', authorize('brakeTests', 'R'), paginate, brakeTestController.getBrakeTests);
router.get('/:id', authorize('brakeTests', 'R'), brakeTestController.getBrakeTest);
router.put('/:id', authorize('brakeTests', 'U'), validate(brakeTestValidation.update), brakeTestController.updateBrakeTest);
router.delete('/:id', authorize('brakeTests', 'D'), brakeTestController.deleteBrakeTest);

module.exports = router;
