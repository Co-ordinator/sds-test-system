'use strict';

const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { Institution, User } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, BadRequestError } = require('../utils/errors/appError');

const VALID_REGIONS = new Set(['hhohho', 'manzini', 'lubombo', 'shiselweni', 'multiple']);
const VALID_TYPES = new Set(['university', 'college', 'tvet', 'school', 'vocational', 'other']);
const HIGH_SCHOOL_USER_TYPES = new Set(['school_student', 'high_school_student', 'high school student']);
const TERTIARY_USER_TYPES = new Set(['university_student', 'tertiary_student', 'university student']);
const TERTIARY_TYPES = ['university', 'college', 'tvet', 'vocational'];

const parseCsvInstitutions = (csvText) => new Promise((resolve, reject) => {
  const rows = [];
  const parser = parse({ columns: true, bom: true, trim: true, skip_empty_lines: true });
  parser.on('readable', () => { let r; while ((r = parser.read())) rows.push(r); });
  parser.on('error', reject);
  parser.on('end', () => resolve(rows));
  Readable.from(csvText).pipe(parser);
});

module.exports = {

  listInstitutions: async () => {
    return await Institution.findAll({ order: [['name', 'ASC']] });
  },

  searchInstitutions: async (query = '', filters = {}) => {
    const q = query.trim();
    const where = q ? { name: { [Op.iLike]: `%${q}%` } } : {};

    const normalizedUserType = String(filters.userType || '').trim().toLowerCase();
    const region = String(filters.region || '').trim().toLowerCase();
    const requestedTypes = String(filters.type || '')
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);

    const requestedValidTypes = requestedTypes.filter((type) => VALID_TYPES.has(type));
    const isHighSchoolUser = HIGH_SCHOOL_USER_TYPES.has(normalizedUserType);
    const isTertiaryUser = TERTIARY_USER_TYPES.has(normalizedUserType);

    const types = isHighSchoolUser
      ? ['school']
      : requestedValidTypes.length > 0
        ? requestedValidTypes
        : isTertiaryUser
          ? TERTIARY_TYPES
          : [];

    if (types.length === 1) {
      where.type = types[0];
    } else if (types.length > 1) {
      where.type = { [Op.in]: types };
    }

    if (VALID_REGIONS.has(region)) {
      if (types.length === 1 && types[0] === 'school') {
        where.region = region;
      } else {
        where.region = { [Op.in]: [region, 'multiple'] };
      }
    }

    return await Institution.findAll({
      where,
      attributes: ['id', 'name', 'type', 'region'],
      order: [['name', 'ASC']],
      limit: 20
    });
  },

  createInstitution: async (data) => {
    return await Institution.create(data);
  },

  updateInstitution: async (id, data) => {
    const institution = await Institution.findByPk(id);
    if (!institution) throw new NotFoundError('Institution not found', 'INSTITUTION_NOT_FOUND');
    const allowed = ['name', 'nameSwati', 'acronym', 'type', 'region', 'district', 'description', 'phoneNumber', 'email', 'website', 'accredited', 'bursariesAvailable', 'programs', 'facilities'];
    const updates = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    await institution.update(updates);
    return institution;
  },

  reviewInstitution: async (id, { status, name, type, region, district, accredited }) => {
    const institution = await Institution.findByPk(id);
    if (!institution) throw new NotFoundError('Institution not found', 'INSTITUTION_NOT_FOUND');
    const updates = {};
    if (status) updates.status = status;
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (region !== undefined) updates.region = region;
    if (district !== undefined) updates.district = district;
    if (accredited !== undefined) updates.accredited = accredited;
    await institution.update(updates);
    return institution;
  },

  deleteInstitution: async (id) => {
    const institution = await Institution.findByPk(id);
    if (!institution) throw new NotFoundError('Institution not found', 'INSTITUTION_NOT_FOUND');
    await User.update({ institutionId: null }, { where: { institutionId: institution.id } });
    await institution.destroy();
    return institution;
  },

  bulkDeleteInstitutions: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestError('ids array required', 'INVALID_BULK_IDS');
    await User.update({ institutionId: null }, { where: { institutionId: { [Op.in]: ids } } });
    await User.update({ workplaceInstitutionId: null }, { where: { workplaceInstitutionId: { [Op.in]: ids } } });
    return await Institution.destroy({ where: { id: { [Op.in]: ids } } });
  },

  bulkApproveInstitutions: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestError('ids array required', 'INVALID_BULK_IDS');
    const [updated] = await Institution.update({ status: 'approved' }, { where: { id: { [Op.in]: ids } } });
    return updated;
  },

  exportInstitutions: async () => {
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
    const parser = new Parser({ fields });
    return parser.parse(rows);
  },

  importInstitutions: async (csvText) => {
    if (!csvText.trim()) throw new BadRequestError('No CSV data provided', 'CSV_REQUIRED');

    const records = await parseCsvInstitutions(csvText);
    if (!records.length) throw new BadRequestError('No records found in CSV', 'CSV_EMPTY');

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

    return { created, updated, skipped, total: records.length };
  }
};
