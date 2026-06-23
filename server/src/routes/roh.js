const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const rohValidation = require('../validations/rohValidation');
const rohController = require('../controllers/rohController');

router.use(protect);

router.post('/', authorize('roh', 'C'), validate(rohValidation.create), rohController.createROH);
router.get('/', authorize('roh', 'R'), paginate, rohController.getROHRecords);
router.get('/:id', authorize('roh', 'R'), rohController.getROH);
router.put('/:id', authorize('roh', 'U'), validate(rohValidation.update), rohController.updateROH);
router.put('/:id/start', authorize('roh', 'U'), rohController.startROH);
router.put('/:id/complete', authorize('roh', 'U'), rohController.completeROH);
router.delete('/:id', authorize('roh', 'D'), rohController.deleteROH);

module.exports = router;
