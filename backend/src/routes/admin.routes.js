const express = require('express');
const router = express.Router();
const { authorize, preventSelfDeletion } = require('../middleware/authorization.middleware');
const { verifyToken } = require('../middleware/authentication.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const validate = require('../middleware/validatation.middleware');
const AdminController = require('../controllers/admin.controller');
const QuestionController = require('../controllers/question.controller');
const OccupationController = require('../controllers/occupation.controller');
const SubjectController = require('../controllers/subject.controller');
const CertificateController = require('../controllers/certificate.controller');
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

// All admin routes require authentication + admin or test_administrator role
router.use(verifyToken, authorize(['System Administrator', 'Test Administrator']));

// ── User management ────────────────────────────────────────────────────
router.get('/users', requirePermission('users.view'), AdminController.getAllUsers);
router.get('/users/:id', requirePermission('users.view'), AdminController.getUser);
router.post('/users', requirePermission('users.create'), AdminController.createUser);
router.patch('/users/:id', requirePermission('users.update'), AdminController.updateUser);
router.delete('/users/:id', requirePermission('users.delete'), preventSelfDeletion, AdminController.deleteUser);
router.patch('/users/:id/permissions', requirePermission('permissions.manage'), AdminController.updateUserPermissions);

// ── Permission management ──────────────────────────────────────────────
router.get('/permissions', requirePermission('permissions.view'), AdminController.getAllPermissions);
router.get('/permissions/user/:id', requirePermission('permissions.view'), AdminController.getUserPermissions);

// ── Question bank management ───────────────────────────────────────────
router.get('/questions', requirePermission('questions.view'), QuestionController.listQuestions);
router.post('/questions', requirePermission('questions.create'), validate(createQuestionSchema), QuestionController.createQuestion);
router.patch('/questions/:id', requirePermission('questions.update'), validate(updateQuestionSchema), QuestionController.updateQuestion);
router.delete('/questions/:id', requirePermission('questions.delete'), QuestionController.deleteQuestion);
router.post(
  '/questions/import',
  requirePermission('questions.import'),
  express.text({ type: 'text/csv', limit: '10mb' }),
  (req, res, next) => {
    if (req.is('text/csv')) return next();
    return validate(importQuestionsSchema)(req, res, next);
  },
  QuestionController.importQuestions
);
router.get('/questions/export', requirePermission('questions.export'), QuestionController.exportQuestions);

// ── Occupation management ──────────────────────────────────────────────
router.get('/occupations', requirePermission('occupations.view'), OccupationController.listOccupations);
router.post('/occupations', requirePermission('occupations.create'), validate(createOccupationSchema), OccupationController.createOccupation);
router.patch('/occupations/:id', requirePermission('occupations.update'), validate(updateOccupationSchema), OccupationController.updateOccupation);
router.delete('/occupations/:id', requirePermission('occupations.delete'), OccupationController.deleteOccupation);
router.post(
  '/occupations/import',
  requirePermission('occupations.import'),
  express.text({ type: 'text/csv', limit: '10mb' }),
  (req, res, next) => {
    if (req.is('text/csv')) return next();
    return validate(importOccupationsSchema)(req, res, next);
  },
  OccupationController.importOccupations
);
router.get('/occupations/export', requirePermission('occupations.export'), OccupationController.exportOccupations);

// ── Analytics ──────────────────────────────────────────────────────────
router.get('/analytics', requirePermission('analytics.view'), AdminController.getAnalytics);
router.get('/analytics/institutions', requirePermission('analytics.view'), AdminController.getInstitutionAnalytics);
router.get('/analytics/holland-distribution', requirePermission('analytics.view'), AdminController.getHollandDistribution);
router.get('/analytics/trend', requirePermission('analytics.view'), AdminController.getAssessmentTrend);
router.get('/analytics/regional', requirePermission('analytics.view'), AdminController.getRegionalAnalytics);
router.get('/analytics/knowledge-graph', requirePermission('analytics.view'), AdminController.getKnowledgeGraphAnalytics);
router.get('/analytics/export', requirePermission('analytics.export'), AdminController.exportAnalytics);
router.get('/analytics/segmentation', requirePermission('analytics.view'), AdminController.getSegmentationAnalytics);
router.get('/analytics/skills-pipeline', requirePermission('analytics.view'), AdminController.getSkillsPipeline);

// ── Assessments (admin view) ───────────────────────────────────────────
router.get('/assessments', requirePermission('assessments.view'), AdminController.getAllAssessments);

// ── Data export ────────────────────────────────────────────────────────
router.get('/export/users', requirePermission('users.export'), AdminController.exportUsers);
router.get('/export/assessments', requirePermission('assessments.export'), AdminController.exportAssessments);

// ── Notifications ──────────────────────────────────────────────────────
router.get('/notifications', requirePermission('notifications.view'), AdminController.getNotifications);
router.patch('/notifications/:id/read', requirePermission('notifications.manage'), AdminController.markNotificationRead);
router.post('/notifications/mark-all-read', requirePermission('notifications.manage'), AdminController.markAllNotificationsRead);

// ── Subjects management ────────────────────────────────────────────────
router.get('/subjects', requirePermission('subjects.view'), SubjectController.listSubjects);
router.post('/subjects', requirePermission('subjects.create'), SubjectController.createSubject);
router.patch('/subjects/:id', requirePermission('subjects.update'), SubjectController.updateSubject);
router.delete('/subjects/:id', requirePermission('subjects.delete'), SubjectController.deleteSubject);
router.get('/subjects/export', requirePermission('subjects.export'), SubjectController.exportSubjects);
router.post(
  '/subjects/import',
  requirePermission('subjects.import'),
  express.text({ type: 'text/csv', limit: '5mb' }),
  SubjectController.importSubjects
);

// ── Certificate management ─────────────────────────────────────────────
router.get('/certificates', requirePermission('certificates.view'), CertificateController.listCertificates);
router.post('/certificates/:assessmentId/generate', requirePermission('certificates.generate'), CertificateController.generateCertificate);
router.get('/certificates/:assessmentId/download', requirePermission('certificates.download'), CertificateController.downloadCertificate);

// ── Audit logs ─────────────────────────────────────────────────────────
router.get('/audit-logs', requirePermission('audit.view'), AdminController.getAuditLogs);
router.get('/audit-logs/:id', requirePermission('audit.view'), AdminController.getAuditLog);

// ── Institution management (admin-only) ────────────────────────────────
router.get('/institutions', requirePermission('institutions.view'), AdminController.getInstitutions);

module.exports = router;
