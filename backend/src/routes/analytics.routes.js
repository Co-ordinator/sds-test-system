'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authentication.middleware');
const { authorize } = require('../middleware/authorization.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const AnalyticsController = require('../controllers/analytics.controller');

// All analytics routes: must be authenticated + admin or test_administrator role
router.use(verifyToken, authorize(['System Administrator', 'Test Administrator']));

// ── Overview & KPIs ─────────────────────────────────────────────────────────
router.get('/', requirePermission('analytics.view'), AnalyticsController.getOverview);

// ── Distribution & Trends ───────────────────────────────────────────────────
router.get('/holland-distribution', requirePermission('analytics.view'), AnalyticsController.getHollandDistribution);
router.get('/trend', requirePermission('analytics.view'), AnalyticsController.getTrend);

// ── Geographic & Institutional ──────────────────────────────────────────────
router.get('/regional', requirePermission('analytics.view'), AnalyticsController.getRegional);
router.get('/institutions', requirePermission('analytics.view'), AnalyticsController.getInstitutionBreakdown);

// ── Career Intelligence ─────────────────────────────────────────────────────
router.get('/knowledge-graph', requirePermission('analytics.view'), AnalyticsController.getKnowledgeGraph);
router.get('/segmentation', requirePermission('analytics.view'), AnalyticsController.getSegmentation);
router.get('/skills-pipeline', requirePermission('analytics.view'), AnalyticsController.getSkillsPipeline);

// ── Government Funding Priority Alignment ───────────────────────────────
router.get('/funding-alignment', requirePermission('analytics.view'), AnalyticsController.getFundingAlignment);

// ── Export ──────────────────────────────────────────────────────────────────
router.get('/export', requirePermission('analytics.export'), AnalyticsController.exportAnalytics);

module.exports = router;
