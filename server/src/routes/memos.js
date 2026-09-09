const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const memoController = require('../controllers/memoController');

router.use(protect);
const { authorize } = require('../middleware/rbac');

router.post('/', authorize('memos', 'C'), memoController.createMemo);
router.get('/', memoController.getMemos);
router.get('/:id', memoController.getMemo);
router.put('/:id', authorize('memos', 'U'), memoController.updateMemo);
router.delete('/:id', authorize('memos', 'D'), memoController.deleteMemo);

module.exports = router;
