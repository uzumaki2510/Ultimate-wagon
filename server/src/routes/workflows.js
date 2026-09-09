const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const workflowController = require('../controllers/workflowController');

router.use(protect);
const { authorize } = require('../middleware/rbac');

router.post('/', authorize('workflows', 'C'), workflowController.createWorkflow);
router.get('/', workflowController.getWorkflows);
router.get('/assignees', require('../controllers/workspaceController').assignees);
router.get('/integrity', require('../middleware/rbac').restrictTo('admin', 'super_admin'), workflowController.getIntegrity);
router.post('/:id/transition', authorize('workflows', 'U'), workflowController.transitionWorkflow);
router.post('/:id/reconcile', require('../middleware/rbac').restrictTo('admin', 'super_admin'), workflowController.normalizeWorkflow);
router.get('/:id', workflowController.getWorkflow);
router.post('/:id/correction', require('../middleware/rbac').restrictTo('admin', 'super_admin'), workflowController.correctWorkflow);
router.put('/:id', authorize('workflows', 'U'), workflowController.updateWorkflow);
router.delete('/:id', authorize('workflows', 'D'), workflowController.deleteWorkflow);

module.exports = router;
