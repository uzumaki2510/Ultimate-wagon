const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const workflowController = require('../controllers/workflowController');

router.use(protect);

router.post('/', workflowController.createWorkflow);
router.get('/', workflowController.getWorkflows);
router.get('/:id', workflowController.getWorkflow);
router.put('/:id', workflowController.updateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
