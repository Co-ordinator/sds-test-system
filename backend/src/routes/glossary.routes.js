'use strict';

const express = require('express');
const router = express.Router();
const glossaryController = require('../controllers/glossary.controller');
const { verifyToken } = require('../middleware/authentication.middleware');
const { authorize } = require('../middleware/authorization.middleware');

// Public endpoints - no authentication required for reading
router.get('/', glossaryController.listTerms);
router.get('/:id', glossaryController.getTerm);

// Admin-only CRUD
router.post('/', verifyToken, authorize(['System Administrator']), glossaryController.createTerm);
router.put('/:id', verifyToken, authorize(['System Administrator']), glossaryController.updateTerm);
router.delete('/:id', verifyToken, authorize(['System Administrator']), glossaryController.deleteTerm);

module.exports = router;
