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
router.delete('/users/:id', preventSelfDeletion, AdminController.deleteUser);

// Question bank management
router.get('/questions', QuestionController.listQuestions);
router.post('/questions', validate(createQuestionSchema), QuestionController.createQuestion);
router.patch('/questions/:id', validate(updateQuestionSchema), QuestionController.updateQuestion);
router.delete('/questions/:id', QuestionController.deleteQuestion);
router.post(
  '/questions/import',
  // Accept CSV uploads as raw text; JSON handled by default middleware
  express.text({ type: 'text/csv', limit: '10mb' }),
  // For JSON body import validation
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

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/audit-logs/:id', AdminController.getAuditLog);

module.exports = router;
