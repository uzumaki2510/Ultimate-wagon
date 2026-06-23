const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { paginate } = require('../middleware/pagination');
const validate = require('../middleware/validate');
const certValidation = require('../validations/certificationValidation');
const certController = require('../controllers/certificationController');

router.use(protect);

router.get('/expiring', authorize('certifications', 'R'), certController.getExpiringCertifications);
router.post('/', authorize('certifications', 'C'), validate(certValidation.create), certController.createCertification);
router.get('/', authorize('certifications', 'R'), paginate, certController.getCertifications);
router.get('/:id', authorize('certifications', 'R'), certController.getCertification);
router.put('/:id', authorize('certifications', 'U'), validate(certValidation.update), certController.updateCertification);
router.put('/:id/revoke', authorize('certifications', 'U'), certController.revokeCertification);
router.delete('/:id', authorize('certifications', 'D'), certController.deleteCertification);

module.exports = router;
