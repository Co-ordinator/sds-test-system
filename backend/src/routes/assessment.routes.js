const express = require('express');
const { verifyToken, restrictTo, requireCompletedOnboarding } = require('../middleware/authentication.middleware');
const AssessmentController = require('../controllers/assessment.controller');
const CertificateController = require('../controllers/certificate.controller');

const router = express.Router();

// Note: Assessment routes use role-based auth (restrictTo) instead of permission system
// This is intentional - the test-taking workflow is role-specific by design
// Permissions are for administrative operations, not for test taker actions
router.use(verifyToken);
router.use(requireCompletedOnboarding);

router.post('/', restrictTo('Test Taker'), AssessmentController.startAssessment);
router.get('/', restrictTo('Test Taker'), AssessmentController.listMyAssessments);
router.get('/questions', restrictTo('Test Taker'), AssessmentController.getQuestions);
router.get('/:assessmentId', restrictTo('Test Taker'), AssessmentController.getAssessment);
router.get('/:assessmentId/progress', restrictTo('Test Taker'), AssessmentController.getProgress);
router.post('/:assessmentId/progress', restrictTo('Test Taker'), AssessmentController.saveProgress);
router.post('/:assessmentId/complete', restrictTo('Test Taker'), AssessmentController.submitAssessment);
router.get('/:assessmentId/results', AssessmentController.getResults);
router.get('/:assessmentId/pdf', AssessmentController.downloadResultsPdf);

// Certificate endpoints (any authenticated user)
router.post('/:assessmentId/certificate/generate', restrictTo('Test Taker'), CertificateController.generateMyCertificate);
router.get('/:assessmentId/certificate/check', CertificateController.checkCertificate);
router.get('/:assessmentId/certificate/download', CertificateController.downloadCertificate);
router.get('/my/certificates', CertificateController.myCertificates);

module.exports = router;
