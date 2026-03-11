const { Institution, User } = require('../models');
const logger = require('../utils/logger');

const listInstitutions = async (req, res, next) => {
  try {
    const institutions = await Institution.findAll({ order: [['name', 'ASC']] });
    logger.info({ actionType: 'INSTITUTION_LIST', message: `Fetched ${institutions.length} institutions`, req });
    res.status(200).json({ status: 'success', data: { institutions } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_LIST_FAILED', message: 'Failed to list institutions', req });
    next(error);
  }
};

const createInstitution = async (req, res, next) => {
  try {
    const institution = await Institution.create(req.body);
    logger.info({ actionType: 'INSTITUTION_CREATE', message: `Created institution ${institution.name}`, req, details: { id: institution.id } });
    res.status(201).json({ status: 'success', data: { institution } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_CREATE_FAILED', message: 'Failed to create institution', req });
    next(error);
  }
};

const updateInstitution = async (req, res, next) => {
  try {
    const institution = await Institution.findByPk(req.params.id);
    if (!institution) {
      return res.status(404).json({ status: 'error', message: 'Institution not found' });
    }
    const allowed = ['name', 'nameSwati', 'acronym', 'type', 'region', 'district', 'description', 'phoneNumber', 'email', 'website', 'accredited', 'bursariesAvailable', 'programs', 'facilities'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await institution.update(updates);
    logger.info({ actionType: 'INSTITUTION_UPDATE', message: `Updated institution ${institution.id}`, req });
    res.status(200).json({ status: 'success', data: { institution } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_UPDATE_FAILED', message: 'Failed to update institution', req });
    next(error);
  }
};

const deleteInstitution = async (req, res, next) => {
  try {
    const institution = await Institution.findByPk(req.params.id);
    if (!institution) {
      return res.status(404).json({ status: 'error', message: 'Institution not found' });
    }
    // Unlink users before deleting
    await User.update({ institutionId: null }, { where: { institutionId: institution.id } });
    await institution.destroy();
    logger.info({ actionType: 'INSTITUTION_DELETE', message: `Deleted institution ${req.params.id}`, req });
    res.status(200).json({ status: 'success', message: 'Institution deleted' });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_DELETE_FAILED', message: 'Failed to delete institution', req });
    next(error);
  }
};

module.exports = {
  listInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution
};
