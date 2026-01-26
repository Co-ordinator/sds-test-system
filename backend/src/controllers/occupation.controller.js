const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { Occupation, sequelize } = require('../models');
const logger = require('../utils/logger');
const { occupationsArraySchema } = require('../validations/occupation.validation');

const formatResponse = (rows) => rows.map((r) => r.toJSON());

const parseCsvOccupations = async (csvText) => new Promise((resolve, reject) => {
  const records = [];
  const parser = parse({ columns: true, bom: true, trim: true, skip_empty_lines: true });

  parser.on('readable', () => {
    let record;
    while ((record = parser.read())) records.push(record);
  });
  parser.on('error', reject);
  parser.on('end', () => resolve(records));

  Readable.from(csvText).pipe(parser);
});

const normalizeCsvRecords = (records) => records.map((row, idx) => ({
  _row: idx + 2,
  code: row.code?.toUpperCase(),
  name: row.name,
  hollandCodes: row.hollandCodes || row.holland_codes
    ? String(row.hollandCodes || row.holland_codes)
        .split('|')
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean)
    : undefined,
  primaryRiasec: row.primaryRiasec || row.primary_riasec,
  secondaryRiasec: row.secondaryRiasec || row.secondary_riasec,
  description: row.description,
  category: row.category,
  educationLevel: row.educationLevel || row.education_level
    ? Number(row.educationLevel || row.education_level)
    : undefined,
  educationRequired: row.educationRequired || row.education_required,
  demandLevel: row.demandLevel || row.demand_level,
  availableInEswatini: row.availableInEswatini || row.available_in_eswatini
    ? ['true', '1', 'yes'].includes(String(row.availableInEswatini || row.available_in_eswatini).toLowerCase())
    : undefined,
  localDemand: row.localDemand || row.local_demand,
  skills: row.skills
    ? String(row.skills)
        .split('|')
        .map((v) => v.trim())
        .filter(Boolean)
    : undefined
}));

const validateOccupationsArray = (rows) => {
  const { value, error } = occupationsArraySchema.validate(rows, { abortEarly: false, stripUnknown: true });
  if (error) {
    const msg = error.details.map((d) => d.message.replace(/['"]/g, '')).join('; ');
    const err = new Error(`Validation failed: ${msg}`);
    err.statusCode = 400;
    throw err;
  }
  return value;
};

const detectDuplicateCodes = (rows) => {
  const seen = new Map();
  const dupes = [];
  rows.forEach((r, idx) => {
    if (seen.has(r.code)) {
      dupes.push({ firstIndex: seen.get(r.code), duplicateIndex: idx, code: r.code });
    } else {
      seen.set(r.code, idx);
    }
  });
  return dupes;
};

module.exports = {
  async listOccupations(req, res, next) {
    try {
      const occupations = await Occupation.findAll({ order: [['code', 'ASC']] });
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Listed occupations', req, details: { adminId: req.user?.id, count: occupations.length } });
      return res.status(200).json({ status: 'success', results: occupations.length, data: { occupations: formatResponse(occupations) } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to list occupations', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async createOccupation(req, res, next) {
    try {
      const occupation = await Occupation.create(req.body);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupation created', req, details: { adminId: req.user?.id, code: occupation.code } });
      return res.status(201).json({ status: 'success', data: { occupation: occupation.toJSON() } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to create occupation', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async updateOccupation(req, res, next) {
    try {
      const occupation = await Occupation.findByPk(req.params.id);
      if (!occupation) {
        logger.warn({ actionType: 'ADMIN_ACTION', message: `Occupation not found: ${req.params.id}`, req, details: { adminId: req.user?.id } });
        return res.status(404).json({ status: 'error', message: 'Occupation not found' });
      }
      await occupation.update(req.body);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupation updated', req, details: { adminId: req.user?.id, code: occupation.code } });
      return res.status(200).json({ status: 'success', data: { occupation: occupation.toJSON() } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: `Failed to update occupation ${req.params.id}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async deleteOccupation(req, res, next) {
    try {
      const occupation = await Occupation.findByPk(req.params.id);
      if (!occupation) {
        logger.warn({ actionType: 'ADMIN_ACTION', message: `Occupation not found for deletion: ${req.params.id}`, req, details: { adminId: req.user?.id } });
        return res.status(404).json({ status: 'error', message: 'Occupation not found' });
      }
      await occupation.destroy();
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupation deleted', req, details: { adminId: req.user?.id, code: occupation.code } });
      return res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: `Failed to delete occupation ${req.params.id}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  // Import with dry-run and upsert by code
  async importOccupations(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const dryRun = String(req.query.dryRun || req.query.dry_run || 'false').toLowerCase() === 'true';
      let rows;

      if (req.is('text/csv')) {
        const records = await parseCsvOccupations(req.body || '');
        const missingHeaders = ['code', 'name'].filter((h) => records.length && !(h in records[0]));
        if (missingHeaders.length) {
          const err = new Error(`CSV missing required headers: ${missingHeaders.join(', ')}`);
          err.statusCode = 400;
          throw err;
        }
        rows = normalizeCsvRecords(records);
      } else if (Array.isArray(req.body)) {
        rows = req.body;
      } else if (req.body && Array.isArray(req.body.occupations)) {
        rows = req.body.occupations;
      } else {
        const err = new Error('Invalid import payload. Provide an array or { occupations: [...] }');
        err.statusCode = 400;
        throw err;
      }

      const validated = validateOccupationsArray(rows);

      const dupes = detectDuplicateCodes(validated);
      if (dupes.length) {
        const err = new Error('Duplicate codes found in payload');
        err.statusCode = 400;
        err.details = dupes;
        throw err;
      }

      const codes = validated.map((o) => o.code);
      const existing = await Occupation.findAll({ where: { code: codes }, transaction });
      const existingMap = new Map(existing.map((o) => [o.code, o]));

      const summary = { imported: 0, updated: 0, dryRun, total: validated.length };

      if (dryRun) {
        await transaction.rollback();
        return res.status(200).json({ status: 'success', data: summary });
      }

      for (const o of validated) {
        const existingRecord = existingMap.get(o.code);
        if (existingRecord) {
          await existingRecord.update(o, { transaction });
          summary.updated += 1;
        } else {
          await Occupation.create(o, { transaction });
          summary.imported += 1;
        }
      }

      await transaction.commit();
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupations imported', req, details: { adminId: req.user?.id, imported: summary.imported, updated: summary.updated, total: summary.total } });
      return res.status(201).json({ status: 'success', data: summary });
    } catch (error) {
      await transaction.rollback();
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to import occupations', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async exportOccupations(req, res, next) {
    try {
      const format = (req.query.format || 'json').toLowerCase();
      const occupations = await Occupation.findAll({ order: [['code', 'ASC']] });

      logger.info({ actionType: 'ADMIN_ACTION', message: 'Occupations exported', req, details: { adminId: req.user?.id, format, count: occupations.length } });

      if (format === 'csv') {
        const parser = new Parser({ fields: ['id', 'code', 'name', 'hollandCodes', 'primaryRiasec', 'secondaryRiasec', 'description', 'category', 'educationLevel', 'educationRequired', 'demandLevel', 'availableInEswatini', 'localDemand', 'skills'] });
        const csv = parser.parse(formatResponse(occupations));
        res.header('Content-Type', 'text/csv');
        res.attachment('occupations.csv');
        return res.status(200).send(csv);
      }

      return res.status(200).json({ status: 'success', results: occupations.length, data: { occupations: formatResponse(occupations) } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export occupations', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }
};
