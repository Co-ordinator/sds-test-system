'use strict';

const express = require('express');
const router = express.Router();
const glossaryController = require('../controllers/glossary.controller');
const { verifyToken } = require('../middleware/authentication.middleware');
const { authorize } = require('../middleware/authorization.middleware');

// Public — any authenticated user can read glossary terms
router.get('/', verifyToken, glossaryController.listTerms);
router.get('/:id', verifyToken, glossaryController.getTerm);

// Admin-only CRUD
router.post('/', verifyToken, authorize(['System Administrator']), glossaryController.createTerm);
router.put('/:id', verifyToken, authorize(['System Administrator']), glossaryController.updateTerm);
router.delete('/:id', verifyToken, authorize(['System Administrator']), glossaryController.deleteTerm);

module.exports = router;
