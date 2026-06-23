const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const userController = require('../controllers/userController');

router.use(protect);

router.get('/pending', authorize('users', 'U'), userController.getPendingUsers);
router.get('/', authorize('users', 'R'), paginate, userController.getUsers);
router.get('/:id', authorize('users', 'R'), userController.getUser);
router.put('/:id/approve', authorize('users', 'U'), userController.approveUser);
router.put('/:id/reject', authorize('users', 'U'), userController.rejectUser);
router.put('/:id', authorize('users', 'U'), userController.updateUser);
router.delete('/:id', authorize('users', 'D'), userController.deleteUser);

module.exports = router;
