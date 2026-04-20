'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authentication.middleware');
const { authorize } = require('../middleware/authorization.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const reportController = require('../controllers/report.controller');

router.use(verifyToken, authorize(['System Administrator', 'Test Administrator']));

// Reports module uses analytics permissions (reports are a subset of analytics exports)
router.get('/types', requirePermission('analytics.view'), reportController.getReportTypes);
router.get('/preview/:type', requirePermission('analytics.view'), reportController.previewReport);
router.post('/generate', requirePermission('analytics.export'), reportController.generateReport);

module.exports = router;
