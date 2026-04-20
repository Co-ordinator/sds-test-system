const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const CounselorController = require('../controllers/counselor.controller');

const router = express.Router();

router.use(verifyToken);

router.get('/students', requirePermission('test_takers.view'), CounselorController.getMyStudents);
router.get('/institution-stats', requirePermission('analytics.view'), CounselorController.getInstitutionStats);
router.post(
  '/students/import',
  requirePermission('test_takers.import'),
  express.text({ type: 'text/csv', limit: '10mb' }),
  CounselorController.importStudents
);
router.delete('/students/:studentId', requirePermission('test_takers.manage'), CounselorController.deleteStudent);
router.patch('/students/:studentId', requirePermission('test_takers.manage'), CounselorController.updateStudent);
router.get('/students/:studentId/results', requirePermission('results.view'), CounselorController.getStudentResults);
router.get('/login-cards', requirePermission('test_takers.login_cards'), CounselorController.generateLoginCards);

module.exports = router;
