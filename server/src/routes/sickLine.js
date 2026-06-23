const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const sickLineValidation = require('../validations/sickLineValidation');
const sickLineController = require('../controllers/sickLineController');

router.use(protect);

router.post('/', authorize('sickLine', 'C'), validate(sickLineValidation.create), sickLineController.createSickLine);
router.get('/', authorize('sickLine', 'R'), paginate, sickLineController.getSickLines);
router.get('/:id', authorize('sickLine', 'R'), sickLineController.getSickLineEntry);
router.put('/:id', authorize('sickLine', 'U'), validate(sickLineValidation.update), sickLineController.updateSickLine);
router.put('/:id/assign', authorize('sickLine', 'U'), sickLineController.assignRepairStaff);
router.put('/:id/close', authorize('sickLine', 'U'), sickLineController.closeSickLine);
router.delete('/:id', authorize('sickLine', 'D'), sickLineController.deleteSickLine);

module.exports = router;
