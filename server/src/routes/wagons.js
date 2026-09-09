const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const wagonValidation = require('../validations/wagonValidation');
const wagonController = require('../controllers/wagonController');

router.use(protect);

router.get('/deleted', authorize('wagons', 'D'), wagonController.getDeleted);
router.post('/:id/restore', authorize('wagons', 'D'), wagonController.restoreWagon);
router.get('/search', authorize('wagons', 'R'), paginate, wagonController.searchWagons);
router.post('/', authorize('wagons', 'C'), validate(wagonValidation.create), wagonController.createWagon);
router.get('/', authorize('wagons', 'R'), paginate, validate(wagonValidation.search, 'query'), wagonController.getWagons);
// Ownership and self-claim permissions are checked inside this scoped controller.
router.patch('/:id/assignment', authorize('wagons', 'R'), require('../controllers/workspaceController').assign);
router.post('/:id/reopen', require('../middleware/rbac').restrictTo('admin', 'super_admin'), require('../controllers/workspaceController').reopen);
router.get('/:id/readiness', authorize('wagons', 'R'), require('../controllers/workspaceController').readiness);
router.get('/:id', authorize('wagons', 'R'), wagonController.getWagon);
router.get('/:id/history', authorize('wagons', 'R'), wagonController.getWagonFullHistory);
router.put('/:id', authorize('wagons', 'U'), validate(wagonValidation.update), wagonController.updateWagon);
router.delete('/:id', authorize('wagons', 'D'), wagonController.deleteWagon);

module.exports = router;
