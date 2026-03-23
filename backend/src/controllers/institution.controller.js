const institutionService = require('../services/institution.service');
const logger = require('../utils/logger');

const listInstitutions = async (req, res, next) => {
  try {
    const institutions = await institutionService.listInstitutions();
    logger.info({ actionType: 'INSTITUTION_LIST', message: `Fetched ${institutions.length} institutions`, req });
    res.status(200).json({ status: 'success', data: { institutions } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_LIST_FAILED', message: 'Failed to list institutions', req });
    next(error);
  }
};

const searchInstitutions = async (req, res, next) => {
  try {
    const institutions = await institutionService.searchInstitutions(req.query.q);
    res.status(200).json({ status: 'success', data: { institutions } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_SEARCH_FAILED', message: 'Failed to search institutions', req });
    next(error);
  }
};

const createInstitution = async (req, res, next) => {
  try {
    const institution = await institutionService.createInstitution(req.body);
    logger.info({ actionType: 'INSTITUTION_CREATE', message: `Created institution ${institution.name}`, req, details: { id: institution.id } });
    res.status(201).json({ status: 'success', data: { institution } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_CREATE_FAILED', message: 'Failed to create institution', req });
    next(error);
  }
};

const updateInstitution = async (req, res, next) => {
  try {
    const institution = await institutionService.updateInstitution(req.params.id, req.body);
    logger.info({ actionType: 'INSTITUTION_UPDATE', message: `Updated institution ${institution.id}`, req });
    res.status(200).json({ status: 'success', data: { institution } });
  } catch (error) {
    if (error.message === 'Institution not found') return res.status(404).json({ status: 'error', message: error.message });
    logger.error({ actionType: 'INSTITUTION_UPDATE_FAILED', message: 'Failed to update institution', req });
    next(error);
  }
};

const reviewInstitution = async (req, res, next) => {
  try {
    const institution = await institutionService.reviewInstitution(req.params.id, req.body);
    logger.info({ actionType: 'INSTITUTION_REVIEWED', message: `Institution reviewed: ${institution.name}`, req, details: { adminId: req.user?.id, institutionId: institution.id, newStatus: req.body.status } });
    res.status(200).json({ status: 'success', data: { institution } });
  } catch (error) {
    if (error.message === 'Institution not found') return res.status(404).json({ status: 'error', message: error.message });
    logger.error({ actionType: 'INSTITUTION_REVIEW_FAILED', message: `Failed to review institution ${req.params.id}`, req });
    next(error);
  }
};

const bulkDeleteInstitutions = async (req, res, next) => {
  try {
    const deleted = await institutionService.bulkDeleteInstitutions(req.body.ids);
    logger.info({ actionType: 'BULK_DELETE_INSTITUTIONS', message: `Bulk deleted ${deleted} institutions`, req, details: { adminId: req.user?.id, count: deleted } });
    res.json({ status: 'success', data: { deleted } });
  } catch (error) {
    if (error.message === 'ids array required') return res.status(400).json({ status: 'error', message: error.message });
    logger.error({ actionType: 'BULK_DELETE_INSTITUTIONS_FAILED', message: 'Bulk delete institutions failed', req, details: { error: error.message } });
    next(error);
  }
};

const bulkApproveInstitutions = async (req, res, next) => {
  try {
    const updated = await institutionService.bulkApproveInstitutions(req.body.ids);
    logger.info({ actionType: 'BULK_APPROVE_INSTITUTIONS', message: `Bulk approved ${updated} institutions`, req, details: { adminId: req.user?.id, count: updated } });
    res.json({ status: 'success', data: { updated } });
  } catch (error) {
    if (error.message === 'ids array required') return res.status(400).json({ status: 'error', message: error.message });
    logger.error({ actionType: 'BULK_APPROVE_INSTITUTIONS_FAILED', message: 'Bulk approve institutions failed', req, details: { error: error.message } });
    next(error);
  }
};

const deleteInstitution = async (req, res, next) => {
  try {
    await institutionService.deleteInstitution(req.params.id);
    logger.info({ actionType: 'INSTITUTION_DELETE', message: `Deleted institution ${req.params.id}`, req });
    res.status(200).json({ status: 'success', message: 'Institution deleted' });
  } catch (error) {
    if (error.message === 'Institution not found') return res.status(404).json({ status: 'error', message: error.message });
    logger.error({ actionType: 'INSTITUTION_DELETE_FAILED', message: 'Failed to delete institution', req });
    next(error);
  }
};

const exportInstitutions = async (req, res, next) => {
  try {
    const csv = await institutionService.exportInstitutions();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="institutions.csv"');
    res.send(csv);
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_EXPORT_FAILED', message: 'Failed to export institutions', req });
    next(error);
  }
};

const importInstitutions = async (req, res, next) => {
  try {
    const csvText = typeof req.body === 'string' ? req.body : '';
    const result = await institutionService.importInstitutions(csvText);
    logger.info({ actionType: 'INSTITUTION_IMPORT', message: `Imported: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`, req });
    res.json({ status: 'success', data: result });
  } catch (error) {
    if (error.message === 'No CSV data provided' || error.message === 'No records found in CSV') {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    logger.error({ actionType: 'INSTITUTION_IMPORT_FAILED', message: 'Failed to import institutions', req });
    next(error);
  }
};

module.exports = {
  listInstitutions,
  searchInstitutions,
  createInstitution,
  updateInstitution,
  reviewInstitution,
  bulkDeleteInstitutions,
  bulkApproveInstitutions,
  deleteInstitution,
  exportInstitutions,
  importInstitutions
};
