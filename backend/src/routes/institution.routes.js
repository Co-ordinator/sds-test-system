const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const { listInstitutions, searchInstitutions, createInstitution, updateInstitution, deleteInstitution, exportInstitutions, importInstitutions } = require('../controllers/institution.controller');
const { authorize } = require('../middleware/authorization.middleware');
const router = express.Router();

// Public list for registration dropdown
router.get('/', listInstitutions);

// Public search for workplace input (?q=query)
router.get('/search', searchInstitutions);

// Admin-only mutations
router.post('/', verifyToken, authorize(['admin']), createInstitution);
router.patch('/:id', verifyToken, authorize(['admin']), updateInstitution);
router.delete('/:id', verifyToken, authorize(['admin']), deleteInstitution);

// Admin import/export
router.get('/export', verifyToken, authorize(['admin']), exportInstitutions);
router.post(
  '/import',
  verifyToken,
  authorize(['admin']),
  express.text({ type: 'text/csv', limit: '5mb' }),
  importInstitutions
);

module.exports = router;
