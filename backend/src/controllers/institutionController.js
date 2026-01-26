const { Institution } = require('../models');
const logger = require('../utils/logger');

const listInstitutions = async (req, res, next) => {
  try {
    const institutions = await Institution.findAll({ order: [['name', 'ASC']] });
    logger.info({ actionType: 'INSTITUTION_LIST', message: `Fetched ${institutions.length} institutions`, req });
    res.status(200).json({ status: 'success', data: { institutions } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_LIST_FAILED', message: 'Failed to list institutions', error: error.message, stack: error.stack, req });
    next(error);
  }
};

const createInstitution = async (req, res, next) => {
  try {
    const institution = await Institution.create(req.body);
    logger.info({ actionType: 'INSTITUTION_CREATE', message: `Created institution ${institution.name}`, req, details: { id: institution.id } });
    res.status(201).json({ status: 'success', data: { institution } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_CREATE_FAILED', message: 'Failed to create institution', error: error.message, stack: error.stack, req });
    next(error);
  }
};

module.exports = {
  listInstitutions,
  createInstitution
};
