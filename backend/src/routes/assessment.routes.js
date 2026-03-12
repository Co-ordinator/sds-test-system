const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authentication.middleware');
const AssessmentController = require('../controllers/assessment.controller');
const CertificateController = require('../controllers/certificate.controller');

const router = express.Router();

router.use(verifyToken);

router.post('/', restrictTo('user'), AssessmentController.startAssessment);
router.get('/', restrictTo('user'), AssessmentController.listMyAssessments);
router.get('/questions', restrictTo('user'), AssessmentController.getQuestions);
router.get('/:assessmentId', restrictTo('user'), AssessmentController.getAssessment);
router.get('/:assessmentId/progress', restrictTo('user'), AssessmentController.getProgress);
router.post('/:assessmentId/progress', restrictTo('user'), AssessmentController.saveProgress);
router.post('/:assessmentId/complete', restrictTo('user'), AssessmentController.submitAssessment);
router.get('/:assessmentId/results', AssessmentController.getResults);
router.get('/:assessmentId/pdf', AssessmentController.downloadResultsPdf);

// Certificate endpoints (any authenticated user)
router.get('/:assessmentId/certificate/check', CertificateController.checkCertificate);
router.get('/:assessmentId/certificate/download', CertificateController.downloadCertificate);
router.get('/my/certificates', CertificateController.myCertificates);

module.exports = router;
