const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authentication.middleware');
const CounselorController = require('../controllers/counselor.controller');

const router = express.Router();

router.use(verifyToken, restrictTo('counselor'));

router.get('/students', CounselorController.getMyStudents);
router.get('/institution-stats', CounselorController.getInstitutionStats);
router.post(
  '/students/import',
  express.text({ type: 'text/csv', limit: '10mb' }),
  CounselorController.importStudents
);

module.exports = router;
