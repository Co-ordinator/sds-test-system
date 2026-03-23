'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authentication.middleware');
const { authorize } = require('../middleware/authorization.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const CourseController = require('../controllers/course.controller');

// Public search (used by dropdowns in career recommendations UI)
router.get('/search', CourseController.searchCourses);

// All management routes require auth + admin/test-admin role
router.use(verifyToken, authorize(['System Administrator', 'Test Administrator']));

// ── CRUD ────────────────────────────────────────────────────────────────────
router.get('/', requirePermission('courses.view'), CourseController.listCourses);
router.get('/export', requirePermission('courses.export'), CourseController.exportCourses);
router.post('/import', requirePermission('courses.import'), express.text({ type: 'text/csv', limit: '10mb' }), CourseController.importCourses);
router.post('/bulk-delete', requirePermission('courses.delete'), CourseController.bulkDeleteCourses);
router.get('/:id', requirePermission('courses.view'), CourseController.getCourse);
router.post('/', requirePermission('courses.create'), CourseController.createCourse);
router.patch('/:id', requirePermission('courses.update'), CourseController.updateCourse);
router.delete('/:id', requirePermission('courses.delete'), CourseController.deleteCourse);

// ── Requirements ─────────────────────────────────────────────────────────────
router.post('/:id/requirements', requirePermission('courses.update'), CourseController.addRequirement);
router.delete('/:id/requirements/:reqId', requirePermission('courses.update'), CourseController.removeRequirement);

// ── Institution links ────────────────────────────────────────────────────────
router.post('/:id/institutions', requirePermission('courses.update'), CourseController.linkInstitution);
router.delete('/:id/institutions/:institutionId', requirePermission('courses.update'), CourseController.unlinkInstitution);

// ── Occupation links ─────────────────────────────────────────────────────────
router.post('/:id/occupations', requirePermission('courses.update'), CourseController.linkOccupation);
router.delete('/:id/occupations/:occupationId', requirePermission('courses.update'), CourseController.unlinkOccupation);

module.exports = router;
