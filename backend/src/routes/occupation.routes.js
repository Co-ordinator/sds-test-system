const express = require('express');
const router = express.Router();
const OccupationController = require('../controllers/occupation.controller');

// Public occupation search endpoint (no auth required)
router.get('/search', OccupationController.searchOccupations);

module.exports = router;
