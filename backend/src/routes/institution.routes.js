const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const { listInstitutions, createInstitution } = require('../controllers/institutionController');
const { authorize } = require('../middleware/authorization.middleware');
const router = express.Router();

// Public list for registration dropdown
router.get('/', listInstitutions);

// Admin-only create (requires auth)
router.post('/', verifyToken, authorize(['admin']), createInstitution);

module.exports = router;
