'use strict';

const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

/**
 * Analytics Controller — HTTP layer only.
 * All query logic lives in analytics.service.js.
 * Each handler: parse req → call service → send response.
 */
const AnalyticsController = {

  /* ── GET /api/v1/analytics ─────────────────────────────────────────────── */
  getOverview: async (req, res, next) => {
    try {
      const data = await analyticsService.getOverview(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch analytics overview', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/holland-distribution ────────────────────────── */
  getHollandDistribution: async (req, res, next) => {
    try {
      const data = await analyticsService.getHollandDistribution(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch Holland distribution', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/trend ───────────────────────────────────────── */
  getTrend: async (req, res, next) => {
    try {
      const data = await analyticsService.getTrend(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch assessment trend', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/regional ───────────────────────────────────── */
  getRegional: async (req, res, next) => {
    try {
      const data = await analyticsService.getRegional(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch regional analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/institutions ────────────────────────────────── */
  getInstitutionBreakdown: async (req, res, next) => {
    try {
      const data = await analyticsService.getInstitutionBreakdown();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch institution analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/knowledge-graph ─────────────────────────────── */
  getKnowledgeGraph: async (req, res, next) => {
    try {
      const data = await analyticsService.getKnowledgeGraph(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch knowledge graph analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/segmentation ────────────────────────────────── */
  getSegmentation: async (req, res, next) => {
    try {
      const data = await analyticsService.getSegmentation(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch segmentation analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/skills-pipeline ─────────────────────────────── */
  getSkillsPipeline: async (req, res, next) => {
    try {
      const data = await analyticsService.getSkillsPipeline(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch skills pipeline', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/funding-alignment ───────────────────────── */
  getFundingAlignment: async (req, res, next) => {
    try {
      const data = await analyticsService.getFundingAlignmentAnalytics(req.query);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to fetch funding alignment analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  /* ── GET /api/v1/analytics/export?format=csv|pdf ───────────────────────── */
  exportAnalytics: async (req, res, next) => {
    try {
      const format = (req.query.format || 'csv').toLowerCase();
      const { overviewData, hollandDist, regionalDist, filters } = await analyticsService.getExportData(req.query);

      const formatFilterLabel = (val, fallback = 'All') => val || fallback;

      if (format === 'pdf') {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics_report.pdf"');
        doc.pipe(res);

        const pageWidth = doc.page.width - 100;
        const filtersSummary = [
          `Institution: ${formatFilterLabel(filters.institutionId)}`,
          `Institution Type: ${formatFilterLabel(filters.institutionType)}`,
          `Region: ${formatFilterLabel(filters.region)}`,
          `User Type: ${formatFilterLabel(filters.userType)}`,
          `Start Date: ${formatFilterLabel(filters.startDate, 'Any')}`,
          `End Date: ${formatFilterLabel(filters.endDate, 'Any')}`
        ];

        doc.rect(50, 50, pageWidth, 55).fill('#2D8BC4');
        doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('Analytics Report', 65, 68);
        doc.fillColor('#111827').moveDown(3).fontSize(10).font('Helvetica-Bold').text('Applied Filters');
        doc.fontSize(8.5).font('Helvetica').fillColor('#374151').text(filtersSummary.join('  |  '));
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Summary');
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        doc.text(`Registered Users: ${overviewData.totalUsers}`);
        doc.text(`Students: ${overviewData.studentCount}`);
        doc.text(`Total Assessments: ${overviewData.totalAssessments}`);
        doc.text(`Completed Assessments: ${overviewData.completedAssessments}`);
        doc.text(`Completion Rate: ${overviewData.completionRate}%`);
        doc.moveDown(0.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('RIASEC Averages');
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        ['avgR','avgI','avgA','avgS','avgE','avgC'].forEach(key => {
          doc.text(`${key.replace('avg','').toUpperCase()}: ${Number(overviewData.averages[key] || 0).toFixed(1)}`);
        });
        doc.moveDown(0.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Top Holland Codes');
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        hollandDist.slice(0, 10).forEach(row => doc.text(`${row.hollandCode}: ${row.count}`));
        doc.moveDown(0.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Regional Completions');
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        regionalDist.forEach(row => doc.text(`${row.region}: ${row.completedAssessments}`));
        doc.end();
        return;
      }

      const csvRows = [
        {
          section: 'summary',
          registeredUsers: overviewData.totalUsers,
          students: overviewData.studentCount,
          totalAssessments: overviewData.totalAssessments,
          completedAssessments: overviewData.completedAssessments,
          completionRate: overviewData.completionRate,
          avgR: Number(overviewData.averages.avgR || 0).toFixed(1),
          avgI: Number(overviewData.averages.avgI || 0).toFixed(1),
          avgA: Number(overviewData.averages.avgA || 0).toFixed(1),
          avgS: Number(overviewData.averages.avgS || 0).toFixed(1),
          avgE: Number(overviewData.averages.avgE || 0).toFixed(1),
          avgC: Number(overviewData.averages.avgC || 0).toFixed(1),
          institutionId: filters.institutionId || '',
          institutionType: filters.institutionType || '',
          region: filters.region || '',
          userType: filters.userType || '',
          startDate: filters.startDate || '',
          endDate: filters.endDate || ''
        },
        ...hollandDist.map(row => ({ section: 'holland_distribution', hollandCode: row.hollandCode, count: row.count })),
        ...regionalDist.map(row => ({ section: 'regional_completion', region: row.region, completedAssessments: row.completedAssessments }))
      ];

      const parser = new Parser();
      const csv = parser.parse(csvRows);
      res.header('Content-Type', 'text/csv');
      res.attachment('analytics_report.csv');
      return res.status(200).send(csv);
    } catch (error) {
      logger.error({ actionType: 'ANALYTICS_ERROR', message: 'Failed to export analytics', req, details: { error: error.message } });
      next(error);
    }
  }
};

module.exports = AnalyticsController;
