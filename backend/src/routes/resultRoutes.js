const express = require('express');
const router = express.Router();
const { authorize, selfOnly } = require('../middleware/authorize');
const { verifyToken } = require('../middleware/auth');
const ResultController = require('../controllers/resultController');

// All result routes require authentication
router.use(verifyToken);

// Get test results (self-only or admin/counselor)
router.get('/:attemptId', 
  selfOnly('test_result'), 
  ResultController.getResult
);

// Get PDF report (admin/counselor only)
router.get('/:attemptId/report', 
  authorize(['admin', 'counselor']),
  ResultController.getReport
);

// Get career recommendations (admin/counselor only)
router.get('/:attemptId/recommendations', 
  authorize(['admin', 'counselor']),
  ResultController.getRecommendations
);

module.exports = router;
