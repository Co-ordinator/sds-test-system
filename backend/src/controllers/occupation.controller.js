const occupationService = require('../services/occupation.service');
const logger = require('../utils/logger');

const formatResponse = (rows) => rows.map((r) => r.toJSON());

module.exports = {
  async searchOccupations(req, res, next) {
    try {
      const occupations = await occupationService.searchOccupations(req.query.q);
      logger.info({ actionType: 'OCCUPATION_SEARCH', message: 'Searched occupations', req, details: { query: req.query.q, count: occupations.length } });
      return res.status(200).json({ status: 'success', results: occupations.length, data: { occupations: formatResponse(occupations) } });
    } catch (error) {
      logger.error({ actionType: 'OCCUPATION_SEARCH_FAILED', message: 'Failed to search occupations', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async listOccupations(req, res, next) {
    try {
      const occupations = await occupationService.listOccupations();
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Listed occupations', req, details: { adminId: req.user?.id, count: occupations.length } });
      return res.status(200).json({ status: 'success', results: occupations.length, data: { occupations: formatResponse(occupations) } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to list occupations', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async createOccupation(req, res, next) {
    try {
      const occupation = await occupationService.createOccupation(req.body);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupation created', req, details: { adminId: req.user?.id, code: occupation.code } });
      return res.status(201).json({ status: 'success', data: { occupation: occupation.toJSON() } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to create occupation', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async updateOccupation(req, res, next) {
    try {
      const occupation = await occupationService.updateOccupation(req.params.id, req.body);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupation updated', req, details: { adminId: req.user?.id, code: occupation.code } });
      return res.status(200).json({ status: 'success', data: { occupation: occupation.toJSON() } });
    } catch (error) {
      if (error.code === 'OCCUPATION_NOT_FOUND') {
        logger.warn({ actionType: 'ADMIN_ACTION', message: `Occupation not found: ${req.params.id}`, req, details: { adminId: req.user?.id } });
      }
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: `Failed to update occupation ${req.params.id}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async reviewOccupation(req, res, next) {
    try {
      const occupation = await occupationService.reviewOccupation(req.params.id, req.body);
      logger.info({ actionType: 'OCCUPATION_REVIEWED', message: `Occupation reviewed: ${occupation.name}`, req, details: { adminId: req.user?.id, occupationId: occupation.id, newStatus: req.body.status } });
      return res.status(200).json({ status: 'success', data: { occupation: occupation.toJSON() } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: `Failed to review occupation ${req.params.id}`, req, details: { error: error.message } });
      return next(error);
    }
  },

  async bulkDeleteOccupations(req, res, next) {
    try {
      const deleted = await occupationService.bulkDeleteOccupations(req.body.ids);
      logger.info({ actionType: 'BULK_DELETE_OCCUPATIONS', message: `Bulk deleted ${deleted} occupations`, req, details: { adminId: req.user?.id, count: deleted } });
      return res.json({ status: 'success', data: { deleted } });
    } catch (error) {
      logger.error({ actionType: 'BULK_DELETE_OCCUPATIONS_FAILED', message: 'Bulk delete occupations failed', req, details: { error: error.message } });
      return next(error);
    }
  },

  async bulkApproveOccupations(req, res, next) {
    try {
      const updated = await occupationService.bulkApproveOccupations(req.body.ids);
      logger.info({ actionType: 'BULK_APPROVE_OCCUPATIONS', message: `Bulk approved ${updated} occupations`, req, details: { adminId: req.user?.id, count: updated } });
      return res.json({ status: 'success', data: { updated } });
    } catch (error) {
      logger.error({ actionType: 'BULK_APPROVE_OCCUPATIONS_FAILED', message: 'Bulk approve occupations failed', req, details: { error: error.message } });
      return next(error);
    }
  },

  async deleteOccupation(req, res, next) {
    try {
      const occupation = await occupationService.deleteOccupation(req.params.id);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupation deleted', req, details: { adminId: req.user?.id, code: occupation.code } });
      return res.status(204).send();
    } catch (error) {
      if (error.code === 'OCCUPATION_NOT_FOUND') {
        logger.warn({ actionType: 'ADMIN_ACTION', message: `Occupation not found for deletion: ${req.params.id}`, req, details: { adminId: req.user?.id } });
      }
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: `Failed to delete occupation ${req.params.id}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async importOccupations(req, res, next) {
    try {
      const dryRun = String(req.query.dryRun || req.query.dry_run || 'false').toLowerCase() === 'true';
      const summary = await occupationService.importOccupations(req.body, req.is('text/csv') ? 'text/csv' : 'json', dryRun);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupations imported', req, details: { adminId: req.user?.id, imported: summary.imported, updated: summary.updated, total: summary.total } });
      return res.status(dryRun ? 200 : 201).json({ status: 'success', data: summary });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to import occupations', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async exportOccupations(req, res, next) {
    try {
      const format = (req.query.format || 'json').toLowerCase();
      const result = await occupationService.exportOccupations(format);

      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupations exported', req, details: { adminId: req.user?.id, format, count: result.occupations.length } });

      if (format === 'csv') {
        res.header('Content-Type', 'text/csv');
        res.attachment('occupations.csv');
        return res.status(200).send(result.csv);
      }

      return res.status(200).json({ status: 'success', results: result.occupations.length, data: { occupations: formatResponse(result.occupations) } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export occupations', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }
};
