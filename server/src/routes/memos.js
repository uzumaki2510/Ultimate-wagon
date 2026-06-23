const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const memoController = require('../controllers/memoController');

router.use(protect);

router.post('/', memoController.createMemo);
router.get('/', memoController.getMemos);
router.get('/:id', memoController.getMemo);
router.put('/:id', memoController.updateMemo);
router.delete('/:id', memoController.deleteMemo);

module.exports = router;
