const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authentication.middleware');
const { ROLES } = require('../constants/roles');
const AssessmentController = require('../controllers/assessment.controller');
const CertificateController = require('../controllers/certificate.controller');

const router = express.Router();

router.use(verifyToken);

router.post('/', restrictTo(ROLES.TEST_TAKER), AssessmentController.startAssessment);
router.get('/', restrictTo(ROLES.TEST_TAKER), AssessmentController.listMyAssessments);
router.get('/questions', restrictTo(ROLES.TEST_TAKER), AssessmentController.getQuestions);
router.get('/:assessmentId', restrictTo(ROLES.TEST_TAKER), AssessmentController.getAssessment);
router.get('/:assessmentId/progress', restrictTo(ROLES.TEST_TAKER), AssessmentController.getProgress);
router.post('/:assessmentId/progress', restrictTo(ROLES.TEST_TAKER), AssessmentController.saveProgress);
router.post('/:assessmentId/complete', restrictTo(ROLES.TEST_TAKER), AssessmentController.submitAssessment);
router.get('/:assessmentId/results', AssessmentController.getResults);
router.get('/:assessmentId/pdf', AssessmentController.downloadResultsPdf);

// Certificate endpoints (any authenticated user)
router.get('/:assessmentId/certificate/check', CertificateController.checkCertificate);
router.get('/:assessmentId/certificate/download', CertificateController.downloadCertificate);
router.get('/my/certificates', CertificateController.myCertificates);

module.exports = router;
