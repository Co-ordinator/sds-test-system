const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authentication.middleware');
const { ROLES } = require('../constants/roles');
const CounselorController = require('../controllers/counselor.controller');

const router = express.Router();

router.use(verifyToken, restrictTo(ROLES.TEST_ADMIN, ROLES.SYSTEM_ADMIN));

router.get('/students', CounselorController.getMyStudents);
router.get('/institution-stats', CounselorController.getInstitutionStats);
router.post(
  '/students/import',
  express.text({ type: 'text/csv', limit: '10mb' }),
  CounselorController.importStudents
);
router.delete('/students/:studentId', CounselorController.deleteStudent);
router.patch('/students/:studentId', CounselorController.updateStudent);
router.get('/students/:studentId/results', CounselorController.getStudentResults);
router.get('/login-cards', CounselorController.generateLoginCards);

module.exports = router;
