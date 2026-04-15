'use strict';

const courseService = require('../services/course.service');
const { AuditLog } = require('../models');
const logger = require('../utils/logger');

module.exports = {

  listCourses: async (req, res, next) => {
    try {
      const { courses, total } = await courseService.listCourses(req.query);
      res.status(200).json({ status: 'success', total, results: courses.length, data: { courses } });
    } catch (error) {
      logger.error({ actionType: 'COURSE_LIST_FAILED', message: error.message, req });
      next(error);
    }
  },

  getCourse: async (req, res, next) => {
    try {
      const course = await courseService.getCourseById(req.params.id);
      if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });
      res.status(200).json({ status: 'success', data: { course } });
    } catch (error) {
      next(error);
    }
  },

  createCourse: async (req, res, next) => {
    try {
      const course = await courseService.createCourse(req.body);
      await AuditLog.create({ userId: req.user?.id, actionType: 'COURSE_CREATED', description: `Course created: ${course.name}`, details: { resourceType: 'course', resourceId: course.id }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      logger.info({ actionType: 'COURSE_CREATED', message: `Course created: ${course.name}`, req });
      res.status(201).json({ status: 'success', data: { course } });
    } catch (error) {
      logger.error({ actionType: 'COURSE_CREATE_FAILED', message: error.message, req });
      if (error.status === 400) {
        return res.status(400).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  },

  updateCourse: async (req, res, next) => {
    try {
      const course = await courseService.updateCourse(req.params.id, req.body);
      await AuditLog.create({ userId: req.user?.id, actionType: 'COURSE_UPDATED', description: `Course updated: ${course.name}`, details: { resourceType: 'course', resourceId: course.id, updates: req.body }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      logger.info({ actionType: 'COURSE_UPDATED', message: `Course updated: ${course.name}`, req });
      res.status(200).json({ status: 'success', data: { course } });
    } catch (error) {
      if (error.code === 'COURSE_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  deleteCourse: async (req, res, next) => {
    try {
      const course = await courseService.deleteCourse(req.params.id);
      await AuditLog.create({ userId: req.user?.id, actionType: 'COURSE_DELETED', description: `Course deactivated: ${course.name}`, details: { resourceType: 'course', resourceId: course.id }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      res.status(200).json({ status: 'success', message: 'Course deactivated' });
    } catch (error) {
      if (error.code === 'COURSE_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  bulkDeleteCourses: async (req, res, next) => {
    try {
      const deleted = await courseService.bulkDeleteCourses(req.body.ids);
      res.json({ status: 'success', data: { deleted } });
    } catch (error) {
      if (error.code === 'INVALID_BULK_IDS') return res.status(400).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  addRequirement: async (req, res, next) => {
    try {
      const requirement = await courseService.addRequirement(req.params.id, req.body);
      res.status(201).json({ status: 'success', data: { requirement } });
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  removeRequirement: async (req, res, next) => {
    try {
      await courseService.removeRequirement(req.params.id, req.params.reqId);
      res.status(200).json({ status: 'success', message: 'Requirement removed' });
    } catch (error) {
      if (error.code === 'REQUIREMENT_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  linkInstitution: async (req, res, next) => {
    try {
      const link = await courseService.linkInstitution(req.params.id, req.body);
      res.status(201).json({ status: 'success', data: { link } });
    } catch (error) {
      if (error.code === 'INSTITUTION_ID_REQUIRED') return res.status(400).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  unlinkInstitution: async (req, res, next) => {
    try {
      await courseService.unlinkInstitution(req.params.id, req.params.institutionId);
      res.status(200).json({ status: 'success', message: 'Institution unlinked' });
    } catch (error) {
      if (error.code === 'COURSE_INSTITUTION_LINK_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  linkOccupation: async (req, res, next) => {
    try {
      const link = await courseService.linkOccupation(req.params.id, req.body);
      res.status(201).json({ status: 'success', data: { link } });
    } catch (error) {
      if (error.code === 'OCCUPATION_ID_REQUIRED') return res.status(400).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  unlinkOccupation: async (req, res, next) => {
    try {
      await courseService.unlinkOccupation(req.params.id, req.params.occupationId);
      res.status(200).json({ status: 'success', message: 'Occupation unlinked' });
    } catch (error) {
      if (error.code === 'COURSE_OCCUPATION_LINK_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  exportCourses: async (req, res, next) => {
    try {
      const csv = await courseService.exportCourses();
      res.header('Content-Type', 'text/csv');
      res.attachment('courses_export.csv');
      return res.status(200).send(csv);
    } catch (error) {
      logger.error({ actionType: 'COURSE_EXPORT_FAILED', message: error.message, req });
      next(error);
    }
  },

  importCourses: async (req, res, next) => {
    try {
      const csvText = typeof req.body === 'string' ? req.body : req.body?.csv;
      const results = await courseService.importCourses(csvText);
      await AuditLog.create({ userId: req.user?.id, actionType: 'COURSES_IMPORTED', description: `Imported ${results.created} new, ${results.updated} updated courses`, details: results, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      res.status(200).json({ status: 'success', data: results });
    } catch (error) {
      logger.error({ actionType: 'COURSE_IMPORT_FAILED', message: error.message, req });
      if (error.code === 'CSV_REQUIRED') return res.status(400).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  searchCourses: async (req, res, next) => {
    try {
      const courses = await courseService.searchCourses(req.query.q);
      res.status(200).json({ status: 'success', data: { courses } });
    } catch (error) { next(error); }
  }
};
