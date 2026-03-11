const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authentication.middleware');
const AssessmentController = require('../controllers/assessment.controller');

const router = express.Router();

router.use(verifyToken);

router.post('/', restrictTo('user'), AssessmentController.startAssessment);
router.get('/', restrictTo('user'), AssessmentController.listMyAssessments);
router.get('/questions', restrictTo('user'), AssessmentController.getQuestions);
router.get('/:assessmentId', restrictTo('user'), AssessmentController.getAssessment);
router.get('/:assessmentId/progress', restrictTo('user'), AssessmentController.getProgress);
router.post('/:assessmentId/progress', restrictTo('user'), AssessmentController.saveProgress);
router.post('/:assessmentId/complete', restrictTo('user'), AssessmentController.submitAssessment);

module.exports = router;
