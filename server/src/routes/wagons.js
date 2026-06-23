const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const wagonValidation = require('../validations/wagonValidation');
const wagonController = require('../controllers/wagonController');

router.use(protect);

router.get('/search', authorize('wagons', 'R'), paginate, wagonController.searchWagons);
router.post('/', authorize('wagons', 'C'), validate(wagonValidation.create), wagonController.createWagon);
router.get('/', authorize('wagons', 'R'), paginate, validate(wagonValidation.search, 'query'), wagonController.getWagons);
router.get('/:id', authorize('wagons', 'R'), wagonController.getWagon);
router.get('/:id/history', authorize('wagons', 'R'), wagonController.getWagonFullHistory);
router.put('/:id', authorize('wagons', 'U'), validate(wagonValidation.update), wagonController.updateWagon);
router.delete('/:id', authorize('wagons', 'D'), wagonController.deleteWagon);

module.exports = router;
