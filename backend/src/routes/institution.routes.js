const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const { listInstitutions, searchInstitutions, createInstitution, updateInstitution, reviewInstitution, bulkDeleteInstitutions, bulkApproveInstitutions, deleteInstitution, exportInstitutions, importInstitutions } = require('../controllers/institution.controller');
const router = express.Router();

// Public list for registration dropdown
router.get('/', listInstitutions);

// Public search for workplace input (?q=query)
router.get('/search', searchInstitutions);

// Admin-only mutations
router.post('/', verifyToken, requirePermission('institutions.create'), createInstitution);
router.patch('/:id', verifyToken, requirePermission('institutions.update'), updateInstitution);
router.patch('/:id/review', verifyToken, requirePermission('institutions.update'), reviewInstitution);
router.delete('/:id', verifyToken, requirePermission('institutions.delete'), deleteInstitution);
router.post('/bulk-delete', verifyToken, requirePermission('institutions.delete'), bulkDeleteInstitutions);
router.post('/bulk-approve', verifyToken, requirePermission('institutions.update'), bulkApproveInstitutions);

// Admin import/export
router.get('/export', verifyToken, requirePermission('institutions.export'), exportInstitutions);
router.post(
  '/import',
  verifyToken,
  requirePermission('institutions.import'),
  express.text({ type: 'text/csv', limit: '5mb' }),
  importInstitutions
);

module.exports = router;
