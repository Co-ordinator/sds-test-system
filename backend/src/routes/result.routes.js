const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const AssessmentController = require('../controllers/assessment.controller');

const router = express.Router();

router.use(verifyToken);

router.get('/:assessmentId', requirePermission('results.view'), AssessmentController.getResults);
router.get('/:assessmentId/pdf', requirePermission('results.download_pdf'), AssessmentController.downloadResultsPdf);

module.exports = router;
