const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const { listInstitutions, searchInstitutions, createInstitution, updateInstitution, reviewInstitution, bulkDeleteInstitutions, bulkApproveInstitutions, deleteInstitution, exportInstitutions, importInstitutions } = require('../controllers/institution.controller');
const { authorize } = require('../middleware/authorization.middleware');
const router = express.Router();

// Public list for registration dropdown
router.get('/', listInstitutions);

// Public search for workplace input (?q=query)
router.get('/search', searchInstitutions);

// Admin-only mutations
router.post('/', verifyToken, authorize(['System Administrator', 'Test Administrator']), createInstitution);
router.patch('/:id', verifyToken, authorize(['System Administrator', 'Test Administrator']), updateInstitution);
router.patch('/:id/review', verifyToken, authorize(['System Administrator', 'Test Administrator']), reviewInstitution);
router.delete('/:id', verifyToken, authorize(['System Administrator', 'Test Administrator']), deleteInstitution);
router.post('/bulk-delete', verifyToken, authorize(['System Administrator', 'Test Administrator']), bulkDeleteInstitutions);
router.post('/bulk-approve', verifyToken, authorize(['System Administrator', 'Test Administrator']), bulkApproveInstitutions);

// Admin import/export
router.get('/export', verifyToken, authorize(['System Administrator', 'Test Administrator']), exportInstitutions);
router.post(
  '/import',
  verifyToken,
  authorize(['System Administrator', 'Test Administrator']),
  express.text({ type: 'text/csv', limit: '5mb' }),
  importInstitutions
);

module.exports = router;
