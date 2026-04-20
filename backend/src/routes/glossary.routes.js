'use strict';

const express = require('express');
const router = express.Router();
const glossaryController = require('../controllers/glossary.controller');
const { verifyToken } = require('../middleware/authentication.middleware');
const { requirePermission } = require('../middleware/permission.middleware');

// Public endpoints - no authentication required for reading
router.get('/', glossaryController.listTerms);
router.get('/:id', glossaryController.getTerm);

// Admin-only CRUD - requires authentication + specific permissions
router.post('/', verifyToken, requirePermission('glossary.create'), glossaryController.createTerm);
router.put('/:id', verifyToken, requirePermission('glossary.update'), glossaryController.updateTerm);
router.delete('/:id', verifyToken, requirePermission('glossary.delete'), glossaryController.deleteTerm);

module.exports = router;
