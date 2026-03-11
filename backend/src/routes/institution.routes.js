const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const { listInstitutions, createInstitution, updateInstitution, deleteInstitution } = require('../controllers/institutionController');
const { authorize } = require('../middleware/authorization.middleware');
const router = express.Router();

// Public list for registration dropdown
router.get('/', listInstitutions);

// Admin-only mutations
router.post('/', verifyToken, authorize(['admin']), createInstitution);
router.patch('/:id', verifyToken, authorize(['admin']), updateInstitution);
router.delete('/:id', verifyToken, authorize(['admin']), deleteInstitution);

module.exports = router;
