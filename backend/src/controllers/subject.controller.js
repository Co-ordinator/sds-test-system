'use strict';

const subjectService = require('../services/subject.service');
const logger = require('../utils/logger');

module.exports = {
  async listSubjects(req, res, next) {
    try {
      const subjects = await subjectService.listSubjects();
      res.json({ status: 'success', data: { subjects } });
    } catch (err) { next(err); }
  },

  async createSubject(req, res, next) {
    try {
      const subject = await subjectService.createSubject(req.body);
      logger.info({ actionType: 'SUBJECT_CREATE', message: `Created subject: ${subject.name}`, req });
      res.status(201).json({ status: 'success', data: { subject } });
    } catch (err) {
      if (err.message === 'Name is required') return res.status(400).json({ status: 'error', message: err.message });
      next(err);
    }
  },

  async updateSubject(req, res, next) {
    try {
      const subject = await subjectService.updateSubject(req.params.id, req.body);
      logger.info({ actionType: 'SUBJECT_UPDATE', message: `Updated subject ${subject.id}`, req });
      res.json({ status: 'success', data: { subject } });
    } catch (err) {
      if (err.message === 'Subject not found') return res.status(404).json({ status: 'error', message: err.message });
      next(err);
    }
  },

  async deleteSubject(req, res, next) {
    try {
      await subjectService.deleteSubject(req.params.id);
      logger.info({ actionType: 'SUBJECT_DELETE', message: `Deleted subject ${req.params.id}`, req });
      res.json({ status: 'success', message: 'Subject deleted' });
    } catch (err) {
      if (err.message === 'Subject not found') return res.status(404).json({ status: 'error', message: err.message });
      next(err);
    }
  },

  async importSubjects(req, res, next) {
    try {
      const csvText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const result = await subjectService.importSubjects(csvText);
      logger.info({ actionType: 'SUBJECT_IMPORT', message: `Imported subjects: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`, req });
      res.json({ status: 'success', data: result });
    } catch (err) {
      if (err.message === 'No records found in CSV') return res.status(400).json({ status: 'error', message: err.message });
      next(err);
    }
  },

  async exportSubjects(req, res, next) {
    try {
      const csv = await subjectService.exportSubjects();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="subjects.csv"');
      res.send(csv);
    } catch (err) { next(err); }
  }
};
