const express = require('express');
const router = express.Router();
const { authorize, preventSelfDeletion } = require('../middleware/authorization.middleware');
const { verifyToken } = require('../middleware/authentication.middleware');
const validate = require('../middleware/validatation.middleware');
const AdminController = require('../controllers/admin.controller');
const QuestionController = require('../controllers/question.controller');
const OccupationController = require('../controllers/occupation.controller');
const {
  createQuestionSchema,
  updateQuestionSchema,
  importQuestionsSchema
} = require('../validations/question.validation');
const {
  createOccupationSchema,
  updateOccupationSchema,
  importOccupationsSchema
} = require('../validations/occupation.validation');

// All admin routes require admin role
router.use(verifyToken, authorize(['admin']));

// User management
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUser);
router.patch('/users/:id', AdminController.updateUser);
router.delete('/users/:id', preventSelfDeletion, AdminController.deleteUser);

// Question bank management
router.get('/questions', QuestionController.listQuestions);
router.post('/questions', validate(createQuestionSchema), QuestionController.createQuestion);
router.patch('/questions/:id', validate(updateQuestionSchema), QuestionController.updateQuestion);
router.delete('/questions/:id', QuestionController.deleteQuestion);
router.post(
  '/questions/import',
  express.text({ type: 'text/csv', limit: '10mb' }),
  (req, res, next) => {
    if (req.is('text/csv')) return next();
    return validate(importQuestionsSchema)(req, res, next);
  },
  QuestionController.importQuestions
);
router.get('/questions/export', QuestionController.exportQuestions);

// Occupation management
router.get('/occupations', OccupationController.listOccupations);
router.post('/occupations', validate(createOccupationSchema), OccupationController.createOccupation);
router.patch('/occupations/:id', validate(updateOccupationSchema), OccupationController.updateOccupation);
router.delete('/occupations/:id', OccupationController.deleteOccupation);
router.post(
  '/occupations/import',
  express.text({ type: 'text/csv', limit: '10mb' }),
  (req, res, next) => {
    if (req.is('text/csv')) return next();
    return validate(importOccupationsSchema)(req, res, next);
  },
  OccupationController.importOccupations
);
router.get('/occupations/export', OccupationController.exportOccupations);

// Analytics
router.get('/analytics', AdminController.getAnalytics);
router.get('/analytics/institutions', AdminController.getInstitutionAnalytics);
router.get('/analytics/holland-distribution', AdminController.getHollandDistribution);
router.get('/analytics/trend', AdminController.getAssessmentTrend);
router.get('/analytics/regional', AdminController.getRegionalAnalytics);
router.get('/analytics/knowledge-graph', AdminController.getKnowledgeGraphAnalytics);
router.get('/analytics/export', AdminController.exportAnalytics);
router.get('/analytics/segmentation', AdminController.getSegmentationAnalytics);
router.get('/analytics/skills-pipeline', AdminController.getSkillsPipeline);

// All assessments (admin view)
router.get('/assessments', AdminController.getAllAssessments);

// Data export
router.get('/export/users', AdminController.exportUsers);
router.get('/export/assessments', AdminController.exportAssessments);

// Notifications
router.get('/notifications', AdminController.getNotifications);
router.patch('/notifications/:id/read', AdminController.markNotificationRead);
router.post('/notifications/mark-all-read', AdminController.markAllNotificationsRead);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/audit-logs/:id', AdminController.getAuditLog);

module.exports = router;
