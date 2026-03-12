const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { Institution, User } = require('../models');
const { Op } = require('sequelize');
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

const searchInstitutions = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const where = q ? { name: { [Op.iLike]: `%${q}%` } } : {};
    const institutions = await Institution.findAll({
      where,
      attributes: ['id', 'name', 'type', 'region'],
      order: [['name', 'ASC']],
      limit: 20
    });
    res.status(200).json({ status: 'success', data: { institutions } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_SEARCH_FAILED', message: 'Failed to search institutions', req });
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

const exportInstitutions = async (req, res, next) => {
  try {
    const institutions = await Institution.findAll({ order: [['name', 'ASC']] });
    const fields = ['name', 'type', 'region', 'district', 'email', 'phoneNumber', 'website', 'accredited'];
    const rows = institutions.map(i => ({
      name: i.name || '',
      type: i.type || '',
      region: i.region || '',
      district: i.district || '',
      email: i.email || '',
      phoneNumber: i.phoneNumber || '',
      website: i.website || '',
      accredited: i.accredited ? 'true' : 'false'
    }));
    const { Parser } = require('json2csv');
    const csv = new Parser({ fields }).parse(rows);
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
    if (!csvText.trim()) return res.status(400).json({ status: 'error', message: 'No CSV data provided' });

    const records = await new Promise((resolve, reject) => {
      const rows = [];
      const parser = parse({ columns: true, bom: true, trim: true, skip_empty_lines: true });
      parser.on('readable', () => { let r; while ((r = parser.read())) rows.push(r); });
      parser.on('error', reject);
      parser.on('end', () => resolve(rows));
      Readable.from(csvText).pipe(parser);
    });

    if (!records.length) return res.status(400).json({ status: 'error', message: 'No records found in CSV' });

    let created = 0; let updated = 0; let skipped = 0;

    for (const row of records) {
      const name = (row.name || '').trim();
      if (!name) { skipped++; continue; }

      const payload = {
        type: row.type || 'school',
        region: row.region || null,
        district: row.district || null,
        email: row.email || null,
        phoneNumber: row.phoneNumber || row.phone_number || null,
        website: row.website || null,
        accredited: ['true', '1', 'yes'].includes(String(row.accredited || '').toLowerCase())
      };

      const existing = await Institution.findOne({ where: { name } });
      if (existing) {
        await existing.update(payload);
        updated++;
      } else {
        await Institution.create({ name, ...payload });
        created++;
      }
    }

    logger.info({ actionType: 'INSTITUTION_IMPORT', message: `Imported: ${created} created, ${updated} updated, ${skipped} skipped`, req });
    res.json({ status: 'success', data: { created, updated, skipped, total: records.length } });
  } catch (error) {
    logger.error({ actionType: 'INSTITUTION_IMPORT_FAILED', message: 'Failed to import institutions', req });
    next(error);
  }
};

module.exports = {
  listInstitutions,
  searchInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  exportInstitutions,
  importInstitutions
};
