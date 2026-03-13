'use strict';

const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const {
  Course, CourseInstitution, CourseRequirement, OccupationCourse,
  Institution, Occupation
} = require('../models');
const { Op } = require('sequelize');

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const parseCsv = (csvText) => new Promise((resolve, reject) => {
  const records = [];
  const parser = parse({ columns: true, bom: true, trim: true, skip_empty_lines: true });
  parser.on('readable', () => { let r; while ((r = parser.read())) records.push(r); });
  parser.on('error', reject);
  parser.on('end', () => resolve(records));
  Readable.from(csvText).pipe(parser);
});

const QUAL_TYPES = ['certificate','diploma','bachelor','honours','postgrad_diploma','masters','doctorate','short_course','tvet','other'];

/* ─── Service ─────────────────────────────────────────────────────────────── */

module.exports = {

  /* List courses with filters and pagination */
  listCourses: async ({ search, qualificationType, fieldOfStudy, isActive, limit = 100, offset = 0 }) => {
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
    if (qualificationType) where.qualificationType = qualificationType;
    if (fieldOfStudy) where.fieldOfStudy = { [Op.iLike]: `%${fieldOfStudy}%` };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { fieldOfStudy: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { rows, count } = await Course.findAndCountAll({
      where,
      include: [
        { model: CourseRequirement, as: 'requirements', required: false },
        {
          model: Institution, as: 'institutions', required: false,
          attributes: ['id', 'name', 'type', 'region'],
          through: { model: CourseInstitution, as: 'link', attributes: ['isActive', 'applicationUrl'] }
        },
        {
          model: Occupation, as: 'occupations', required: false,
          attributes: ['id', 'name', 'primaryRiasec'],
          through: { model: OccupationCourse, as: 'link', attributes: ['relevanceScore', 'isPrimaryPathway'] }
        }
      ],
      order: [['name', 'ASC']],
      limit: Number(limit),
      offset: Number(offset),
      distinct: true
    });

    return { courses: rows, total: count };
  },

  /* Get single course by ID with full relations */
  getCourseById: async (id) => {
    const course = await Course.findByPk(id, {
      include: [
        { model: CourseRequirement, as: 'requirements', required: false },
        {
          model: Institution, as: 'institutions', required: false,
          attributes: ['id', 'name', 'type', 'region'],
          through: { model: CourseInstitution, as: 'link', attributes: ['id', 'isActive', 'applicationUrl', 'customRequirements'] }
        },
        {
          model: Occupation, as: 'occupations', required: false,
          attributes: ['id', 'name', 'primaryRiasec', 'demandLevel'],
          through: { model: OccupationCourse, as: 'link', attributes: ['id', 'relevanceScore', 'isPrimaryPathway', 'notes'] }
        }
      ]
    });
    return course;
  },

  /* Create course with optional requirements, institution links, occupation links */
  createCourse: async (data) => {
    const {
      name, nameSwati, qualificationType, durationYears, description,
      riasecCodes, suggestedSubjects, fieldOfStudy, isActive,
      requirements = [], institutions = [], occupations = []
    } = data;

    if (!name) throw new Error('name is required');
    if (!QUAL_TYPES.includes(qualificationType)) {
      throw new Error(`qualificationType must be one of: ${QUAL_TYPES.join(', ')}`);
    }

    const course = await Course.create({
      name, nameSwati, qualificationType, durationYears, description,
      riasecCodes: riasecCodes || [], suggestedSubjects: suggestedSubjects || [],
      fieldOfStudy, isActive: isActive !== false
    });

    if (requirements.length > 0) {
      await CourseRequirement.bulkCreate(
        requirements.map(r => ({ courseId: course.id, subject: r.subject, minimumGrade: r.minimumGrade, isMandatory: r.isMandatory !== false })),
        { ignoreDuplicates: true }
      );
    }
    if (institutions.length > 0) {
      await CourseInstitution.bulkCreate(
        institutions.map(i => ({ courseId: course.id, institutionId: i.institutionId || i, applicationUrl: i.applicationUrl, isActive: true })),
        { ignoreDuplicates: true }
      );
    }
    if (occupations.length > 0) {
      await OccupationCourse.bulkCreate(
        occupations.map(o => ({ courseId: course.id, occupationId: o.occupationId || o, relevanceScore: o.relevanceScore, isPrimaryPathway: o.isPrimaryPathway || false })),
        { ignoreDuplicates: true }
      );
    }

    return await Course.findByPk(course.id, { include: [{ model: CourseRequirement, as: 'requirements' }] });
  },

  /* Update course fields */
  updateCourse: async (id, updates) => {
    const course = await Course.findByPk(id);
    if (!course) throw new Error('Course not found');

    const allowed = ['name','nameSwati','qualificationType','durationYears','description','riasecCodes','suggestedSubjects','fieldOfStudy','isActive'];
    const sanitized = {};
    for (const k of allowed) { if (updates[k] !== undefined) sanitized[k] = updates[k]; }
    await course.update(sanitized);

    return await Course.findByPk(course.id, {
      include: [
        { model: CourseRequirement, as: 'requirements' },
        { model: Institution, as: 'institutions', through: { attributes: ['isActive','applicationUrl'] } },
        { model: Occupation, as: 'occupations', through: { attributes: ['relevanceScore','isPrimaryPathway'] } }
      ]
    });
  },

  /* Soft delete course (set isActive = false) */
  deleteCourse: async (id) => {
    const course = await Course.findByPk(id);
    if (!course) throw new Error('Course not found');
    await course.update({ isActive: false });
    return course;
  },

  /* Bulk soft delete courses */
  bulkDeleteCourses: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids array required');
    const [count] = await Course.update({ isActive: false }, { where: { id: { [Op.in]: ids } } });
    return count;
  },

  /* ─── Requirements ───────────────────────────────────────────────────────── */

  addRequirement: async (courseId, { subject, minimumGrade, isMandatory = true }) => {
    if (!subject || !minimumGrade) throw new Error('subject and minimumGrade required');
    return await CourseRequirement.create({ courseId, subject, minimumGrade, isMandatory });
  },

  removeRequirement: async (courseId, reqId) => {
    const r = await CourseRequirement.findOne({ where: { id: reqId, courseId } });
    if (!r) throw new Error('Requirement not found');
    await r.destroy();
  },

  /* ─── Institution links ──────────────────────────────────────────────────── */

  linkInstitution: async (courseId, { institutionId, applicationUrl, customRequirements }) => {
    if (!institutionId) throw new Error('institutionId required');
    const [link, created] = await CourseInstitution.findOrCreate({
      where: { courseId, institutionId },
      defaults: { applicationUrl, customRequirements, isActive: true }
    });
    if (!created) await link.update({ applicationUrl, customRequirements, isActive: true });
    return link;
  },

  unlinkInstitution: async (courseId, institutionId) => {
    const link = await CourseInstitution.findOne({ where: { courseId, institutionId } });
    if (!link) throw new Error('Link not found');
    await link.destroy();
  },

  /* ─── Occupation links ───────────────────────────────────────────────────── */

  linkOccupation: async (courseId, { occupationId, relevanceScore, isPrimaryPathway = false, notes }) => {
    if (!occupationId) throw new Error('occupationId required');
    const [link, created] = await OccupationCourse.findOrCreate({
      where: { courseId, occupationId },
      defaults: { relevanceScore, isPrimaryPathway, notes }
    });
    if (!created) await link.update({ relevanceScore, isPrimaryPathway, notes });
    return link;
  },

  unlinkOccupation: async (courseId, occupationId) => {
    const link = await OccupationCourse.findOne({ where: { courseId, occupationId } });
    if (!link) throw new Error('Link not found');
    await link.destroy();
  },

  /* ─── Import / Export ────────────────────────────────────────────────────── */

  exportCourses: async () => {
    const courses = await Course.findAll({ order: [['name', 'ASC']], raw: true });
    const rows = courses.map(c => ({
      name: c.name, nameSwati: c.nameSwati || '',
      qualificationType: c.qualification_type || c.qualificationType,
      durationYears: c.duration_years || c.durationYears || '',
      description: c.description || '',
      fieldOfStudy: c.field_of_study || c.fieldOfStudy || '',
      riasecCodes: (c.riasec_codes || c.riasecCodes || []).join('|'),
      suggestedSubjects: (c.suggested_subjects || c.suggestedSubjects || []).join('|'),
      isActive: c.is_active !== undefined ? c.is_active : c.isActive
    }));
    const parser = new Parser({ fields: ['name','nameSwati','qualificationType','durationYears','description','fieldOfStudy','riasecCodes','suggestedSubjects','isActive'] });
    return parser.parse(rows);
  },

  importCourses: async (csvText) => {
    if (!csvText) throw new Error('CSV body required');

    const records = await parseCsv(csvText);
    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of records) {
      try {
        const name = row.name?.trim();
        if (!name) { results.skipped++; continue; }

        const qt = row.qualificationType || row.qualification_type || 'bachelor';
        if (!QUAL_TYPES.includes(qt)) { results.errors.push(`Row "${name}": invalid qualificationType "${qt}"`); results.skipped++; continue; }

        const riasec = row.riasecCodes || row.riasec_codes ? String(row.riasecCodes || row.riasec_codes).split('|').map(s => s.trim()).filter(Boolean) : [];
        const subjects = row.suggestedSubjects || row.suggested_subjects ? String(row.suggestedSubjects || row.suggested_subjects).split('|').map(s => s.trim()).filter(Boolean) : [];

        const [course, created] = await Course.findOrCreate({
          where: { name },
          defaults: { qualificationType: qt, nameSwati: row.nameSwati || row.name_swati, durationYears: row.durationYears || row.duration_years || null, description: row.description, fieldOfStudy: row.fieldOfStudy || row.field_of_study, riasecCodes: riasec, suggestedSubjects: subjects, isActive: String(row.isActive ?? row.is_active) !== 'false' }
        });

        if (!created) {
          await course.update({ qualificationType: qt, nameSwati: row.nameSwati || row.name_swati || course.nameSwati, durationYears: row.durationYears || row.duration_years || course.durationYears, description: row.description || course.description, fieldOfStudy: row.fieldOfStudy || row.field_of_study || course.fieldOfStudy, riasecCodes: riasec.length ? riasec : course.riasecCodes, suggestedSubjects: subjects.length ? subjects : course.suggestedSubjects });
          results.updated++;
        } else { results.created++; }
      } catch (err) {
        results.errors.push(`Row "${row.name}": ${err.message}`);
        results.skipped++;
      }
    }

    return results;
  },

  /* Search courses (public, for dropdowns) */
  searchCourses: async (query = '') => {
    return await Course.findAll({
      where: { isActive: true, name: { [Op.iLike]: `%${query}%` } },
      attributes: ['id', 'name', 'qualificationType', 'fieldOfStudy'],
      order: [['name', 'ASC']], limit: 20
    });
  }
};
