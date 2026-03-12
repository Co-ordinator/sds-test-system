'use strict';

const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { Subject } = require('../models');
const logger = require('../utils/logger');

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
  async listSubjects(req, res, next) {
    try {
      const subjects = await Subject.findAll({ order: [['display_order', 'ASC'], ['name', 'ASC']] });
      res.json({ status: 'success', data: { subjects } });
    } catch (err) { next(err); }
  },

  async createSubject(req, res, next) {
    try {
      const { name, riasecCodes, description, level, isActive, displayOrder } = req.body;
      if (!name?.trim()) return res.status(400).json({ status: 'error', message: 'Name is required' });
      const subject = await Subject.create({
        name: name.trim(),
        riasecCodes: riasecCodes || [],
        description: description || null,
        level: level || 'high_school',
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0
      });
      logger.info({ actionType: 'SUBJECT_CREATE', message: `Created subject: ${subject.name}`, req });
      res.status(201).json({ status: 'success', data: { subject } });
    } catch (err) { next(err); }
  },

  async updateSubject(req, res, next) {
    try {
      const subject = await Subject.findByPk(req.params.id);
      if (!subject) return res.status(404).json({ status: 'error', message: 'Subject not found' });
      const allowed = ['name', 'riasecCodes', 'description', 'level', 'isActive', 'displayOrder'];
      const updates = {};
      for (const k of allowed) { if (req.body[k] !== undefined) updates[k] = req.body[k]; }
      await subject.update(updates);
      logger.info({ actionType: 'SUBJECT_UPDATE', message: `Updated subject ${subject.id}`, req });
      res.json({ status: 'success', data: { subject } });
    } catch (err) { next(err); }
  },

  async deleteSubject(req, res, next) {
    try {
      const subject = await Subject.findByPk(req.params.id);
      if (!subject) return res.status(404).json({ status: 'error', message: 'Subject not found' });
      await subject.destroy();
      logger.info({ actionType: 'SUBJECT_DELETE', message: `Deleted subject ${req.params.id}`, req });
      res.json({ status: 'success', message: 'Subject deleted' });
    } catch (err) { next(err); }
  },

  async importSubjects(req, res, next) {
    try {
      const csvText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const rows = await parseCsvSubjects(csvText);
      if (!rows.length) return res.status(400).json({ status: 'error', message: 'No records found in CSV' });

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

      logger.info({ actionType: 'SUBJECT_IMPORT', message: `Imported subjects: ${created} created, ${updated} updated, ${skipped} skipped`, req });
      res.json({ status: 'success', data: { created, updated, skipped, total: rows.length } });
    } catch (err) { next(err); }
  },

  async exportSubjects(req, res, next) {
    try {
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
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="subjects.csv"');
      res.send(csv);
    } catch (err) { next(err); }
  }
};
