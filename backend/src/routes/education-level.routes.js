const express = require('express');
const router = express.Router();
const EducationLevelController = require('../controllers/educationLevel.controller');

// Public education levels endpoint (no auth required)
router.get('/', EducationLevelController.listEducationLevels);

module.exports = router;
