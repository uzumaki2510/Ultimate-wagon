const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const repairValidation = require('../validations/repairValidation');
const repairController = require('../controllers/repairController');

router.use(protect);

router.post('/', authorize('repairs', 'C'), validate(repairValidation.create), repairController.createRepair);
router.get('/', authorize('repairs', 'R'), paginate, repairController.getRepairs);
router.get('/:id', authorize('repairs', 'R'), repairController.getRepair);
router.put('/:id', authorize('repairs', 'U'), validate(repairValidation.update), repairController.updateRepair);
router.put('/:id/complete', authorize('repairs', 'U'), repairController.completeRepair);
router.put('/:id/verify', authorize('repairs', 'U'), repairController.verifyRepair);
router.delete('/:id', authorize('repairs', 'D'), repairController.deleteRepair);

module.exports = router;
