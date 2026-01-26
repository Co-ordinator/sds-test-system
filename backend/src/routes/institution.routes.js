const express = require('express');
const { listInstitutions, createInstitution } = require('../controllers/institutionController');
const { authorize } = require('../middleware/authorization.middleware');
const router = express.Router();

// Public list for registration dropdown
router.get('/', listInstitutions);

// Admin-only create
router.post('/', authorize(['admin']), createInstitution);

module.exports = router;
