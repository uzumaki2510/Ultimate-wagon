const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const inspectionValidation = require('../validations/inspectionValidation');
const inspectionController = require('../controllers/inspectionController');

router.use(protect);

router.post('/', authorize('inspections', 'C'), validate(inspectionValidation.create), inspectionController.createInspection);
router.get('/', authorize('inspections', 'R'), paginate, inspectionController.getInspections);
router.get('/:id', authorize('inspections', 'R'), inspectionController.getInspection);
router.put('/:id', authorize('inspections', 'U'), validate(inspectionValidation.update), inspectionController.updateInspection);
router.delete('/:id', authorize('inspections', 'D'), inspectionController.deleteInspection);

module.exports = router;
