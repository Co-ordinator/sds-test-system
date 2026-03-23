'use strict';

const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { Subject } = require('../models');

const VALID_RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'];

const parseCodes = (val) => {
  if (!val) return [];
  return String(val).split(/[|,]/).map(s => s.trim().toUpperCase()).filter(c => VALID_RIASEC.includes(c));
};

const parseCsvSubjects = (csvText) => new Promise((resolve, reject) => {
  const records = [];
  const parser = parse({ columns: true, bom: true, trim: true, skip_empty_lines: true });
  parser.on('readable', () => { let r; while ((r = parser.read())) records.push(r); });
  parser.on('error', reject);
  parser.on('end', () => resolve(records));
  Readable.from(csvText).pipe(parser);
});

module.exports = {

  listSubjects: async () => {
    return await Subject.findAll({ order: [['display_order', 'ASC'], ['name', 'ASC']] });
  },

  createSubject: async ({ name, riasecCodes, description, level, isActive, displayOrder }) => {
    if (!name?.trim()) throw new Error('Name is required');
    return await Subject.create({
      name: name.trim(),
      riasecCodes: riasecCodes || [],
      description: description || null,
      level: level || 'high_school',
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0
    });
  },

  updateSubject: async (id, data) => {
    const subject = await Subject.findByPk(id);
    if (!subject) throw new Error('Subject not found');
    const allowed = ['name', 'riasecCodes', 'description', 'level', 'isActive', 'displayOrder'];
    const updates = {};
    for (const k of allowed) { if (data[k] !== undefined) updates[k] = data[k]; }
    await subject.update(updates);
    return subject;
  },

  deleteSubject: async (id) => {
    const subject = await Subject.findByPk(id);
    if (!subject) throw new Error('Subject not found');
    await subject.destroy();
    return subject;
  },

  importSubjects: async (csvText) => {
    const rows = await parseCsvSubjects(csvText);
    if (!rows.length) throw new Error('No records found in CSV');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = (row.name || '').trim();
      if (!name) { skipped++; continue; }

      const riasecCodes = parseCodes(row.riasecCodes || row.riasec_codes);
      const level = row.level || 'high_school';
      const isActive = row.isActive !== undefined
        ? ['true', '1', 'yes'].includes(String(row.isActive).toLowerCase())
        : true;
      const displayOrder = parseInt(row.displayOrder || row.display_order || '0', 10) || 0;
      const description = row.description || null;

      const existing = await Subject.findOne({ where: { name } });
      if (existing) {
        await existing.update({ riasecCodes, level, isActive, displayOrder, description });
        updated++;
      } else {
        await Subject.create({ name, riasecCodes, level, isActive, displayOrder, description });
        created++;
      }
    }

    return { created, updated, skipped, total: rows.length };
  },

  exportSubjects: async () => {
    const subjects = await Subject.findAll({ order: [['display_order', 'ASC'], ['name', 'ASC']] });
    const fields = ['name', 'riasecCodes', 'description', 'level', 'isActive', 'displayOrder'];
    const rows = subjects.map(s => ({
      name: s.name,
      riasecCodes: (s.riasecCodes || []).join('|'),
      description: s.description || '',
      level: s.level,
      isActive: s.isActive,
      displayOrder: s.displayOrder
    }));
    const parser = new Parser({ fields });
    return parser.parse(rows);
  }
};
