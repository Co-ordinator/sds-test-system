'use strict';

const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { Occupation, sequelize } = require('../models');
const { Op } = require('sequelize');
const { occupationsArraySchema } = require('../validations/occupation.validation');

const parseCsvOccupations = async (csvText) => new Promise((resolve, reject) => {
  const records = [];
  const parser = parse({ columns: true, bom: true, trim: true, skip_empty_lines: true });
  parser.on('readable', () => { let record; while ((record = parser.read())) records.push(record); });
  parser.on('error', reject);
  parser.on('end', () => resolve(records));
  Readable.from(csvText).pipe(parser);
});

const normalizeCsvRecords = (records) => records.map((row, idx) => ({
  _row: idx + 2,
  code: row.code?.toUpperCase(),
  name: row.name,
  hollandCodes: row.hollandCodes || row.holland_codes
    ? String(row.hollandCodes || row.holland_codes).split('|').map((v) => v.trim().toUpperCase()).filter(Boolean)
    : undefined,
  primaryRiasec: row.primaryRiasec || row.primary_riasec,
  secondaryRiasec: row.secondaryRiasec || row.secondary_riasec,
  description: row.description,
  category: row.category,
  educationLevel: row.educationLevel || row.education_level ? Number(row.educationLevel || row.education_level) : undefined,
  educationRequired: row.educationRequired || row.education_required,
  demandLevel: row.demandLevel || row.demand_level,
  availableInEswatini: row.availableInEswatini || row.available_in_eswatini
    ? ['true', '1', 'yes'].includes(String(row.availableInEswatini || row.available_in_eswatini).toLowerCase())
    : undefined,
  localDemand: row.localDemand || row.local_demand,
  skills: row.skills ? String(row.skills).split('|').map((v) => v.trim()).filter(Boolean) : undefined
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

  searchOccupations: async (query) => {
    if (!query || query.trim().length < 1) return [];
    const searchTerm = `%${query.trim()}%`;
    return await Occupation.findAll({
      where: {
        [sequelize.Op.or]: [
          { name: { [sequelize.Op.iLike]: searchTerm } },
          { category: { [sequelize.Op.iLike]: searchTerm } }
        ]
      },
      order: [['name', 'ASC']],
      limit: 20
    });
  },

  listOccupations: async () => {
    return await Occupation.findAll({ order: [['code', 'ASC']] });
  },

  createOccupation: async (data) => {
    return await Occupation.create(data);
  },

  updateOccupation: async (id, data) => {
    const occupation = await Occupation.findByPk(id);
    if (!occupation) throw new Error('Occupation not found');
    await occupation.update(data);
    return occupation;
  },

  reviewOccupation: async (id, { status, primaryRiasec, secondaryRiasec, code, category, hollandCodes, demandLevel }) => {
    const occupation = await Occupation.findByPk(id);
    if (!occupation) throw new Error('Occupation not found');
    const updates = {};
    if (status) updates.status = status;
    if (primaryRiasec !== undefined) updates.primaryRiasec = primaryRiasec;
    if (secondaryRiasec !== undefined) updates.secondaryRiasec = secondaryRiasec;
    if (code) updates.code = code;
    if (category !== undefined) updates.category = category;
    if (hollandCodes !== undefined) updates.hollandCodes = hollandCodes;
    if (demandLevel !== undefined) updates.demandLevel = demandLevel;
    await occupation.update(updates);
    return occupation;
  },

  deleteOccupation: async (id) => {
    const occupation = await Occupation.findByPk(id);
    if (!occupation) throw new Error('Occupation not found');
    await occupation.destroy();
    return occupation;
  },

  bulkDeleteOccupations: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids array required');
    return await Occupation.destroy({ where: { id: { [Op.in]: ids } } });
  },

  bulkApproveOccupations: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids array required');
    const [updated] = await Occupation.update({ status: 'approved' }, { where: { id: { [Op.in]: ids } } });
    return updated;
  },

  importOccupations: async (payload, contentType, dryRun = false) => {
    const transaction = await sequelize.transaction();
    try {
      let rows;

      if (contentType === 'text/csv') {
        const records = await parseCsvOccupations(payload || '');
        const missingHeaders = ['code', 'name'].filter((h) => records.length && !(h in records[0]));
        if (missingHeaders.length) {
          const err = new Error(`CSV missing required headers: ${missingHeaders.join(', ')}`);
          err.statusCode = 400;
          throw err;
        }
        rows = normalizeCsvRecords(records);
      } else if (Array.isArray(payload)) {
        rows = payload;
      } else if (payload && Array.isArray(payload.occupations)) {
        rows = payload.occupations;
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
        return summary;
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
      return summary;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  exportOccupations: async (format = 'json') => {
    const occupations = await Occupation.findAll({ order: [['code', 'ASC']] });
    if (format === 'csv') {
      const parser = new Parser({ fields: ['id', 'code', 'name', 'hollandCodes', 'primaryRiasec', 'secondaryRiasec', 'description', 'category', 'educationLevel', 'educationRequired', 'demandLevel', 'availableInEswatini', 'localDemand', 'skills'] });
      return { csv: parser.parse(occupations.map(o => o.toJSON())), occupations };
    }
    return { occupations };
  }
};
