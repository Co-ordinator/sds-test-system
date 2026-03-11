const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const AssessmentController = require('../controllers/assessment.controller');

const router = express.Router();

router.use(verifyToken);

router.get('/:assessmentId', AssessmentController.getResults);
router.get('/:assessmentId/pdf', AssessmentController.downloadResultsPdf);

module.exports = router;
