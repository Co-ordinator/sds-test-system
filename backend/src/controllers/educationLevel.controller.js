'use strict';

const educationLevelService = require('../services/educationLevel.service');
const { AuditLog } = require('../models');
const logger = require('../utils/logger');

module.exports = {

  listEducationLevels: async (req, res, next) => {
    try {
      const levels = await educationLevelService.listEducationLevels();
      res.status(200).json({ status: 'success', results: levels.length, data: { educationLevels: levels } });
    } catch (error) { next(error); }
  },

  getEducationLevel: async (req, res, next) => {
    try {
      const level = await educationLevelService.getEducationLevelById(req.params.id);
      if (!level) return res.status(404).json({ status: 'error', message: 'Education level not found' });
      res.status(200).json({ status: 'success', data: { educationLevel: level } });
    } catch (error) { next(error); }
  },

  createEducationLevel: async (req, res, next) => {
    try {
      const created = await educationLevelService.createEducationLevel(req.body);
      await AuditLog.create({ userId: req.user?.id, actionType: 'EDUCATION_LEVEL_CREATED', description: `Education level created: ${created.description}`, details: { resourceType: 'education_level', resourceId: created.id }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      logger.info({ actionType: 'EDUCATION_LEVEL_CREATED', message: `Level ${created.level} created`, req });
      res.status(201).json({ status: 'success', data: { educationLevel: created } });
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('already exists')) {
        return res.status(400).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  },

  updateEducationLevel: async (req, res, next) => {
    try {
      const el = await educationLevelService.updateEducationLevel(req.params.id, req.body);
      await AuditLog.create({ userId: req.user?.id, actionType: 'EDUCATION_LEVEL_UPDATED', description: `Education level updated: ${el.description}`, details: { resourceType: 'education_level', resourceId: el.id, updates: req.body }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      res.status(200).json({ status: 'success', data: { educationLevel: el } });
    } catch (error) {
      if (error.message === 'Education level not found') return res.status(404).json({ status: 'error', message: error.message });
      if (error.message.includes('already exists')) return res.status(400).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  deleteEducationLevel: async (req, res, next) => {
    try {
      const el = await educationLevelService.deleteEducationLevel(req.params.id);
      await AuditLog.create({ userId: req.user?.id, actionType: 'EDUCATION_LEVEL_DELETED', description: `Education level deleted: ${el.description}`, details: { resourceType: 'education_level', resourceId: el.id }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      res.status(200).json({ status: 'success', message: 'Education level deleted' });
    } catch (error) {
      if (error.message === 'Education level not found') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  }
};
