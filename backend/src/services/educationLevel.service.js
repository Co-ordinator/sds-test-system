'use strict';

const { EducationLevel } = require('../models');
const { Op } = require('sequelize');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/errors/appError');

module.exports = {

  listEducationLevels: async () => {
    return await EducationLevel.findAll({ order: [['level', 'ASC']] });
  },

  getEducationLevelById: async (id) => {
    return await EducationLevel.findByPk(id);
  },

  createEducationLevel: async ({ level, description }) => {
    if (level === undefined || !description) {
      throw new BadRequestError('level (integer) and description are required', 'REQUIRED_FIELDS_MISSING');
    }
    const existing = await EducationLevel.findOne({ where: { level: Number(level) } });
    if (existing) throw new ConflictError(`Level ${level} already exists`, 'EDUCATION_LEVEL_EXISTS');

    return await EducationLevel.create({ level: Number(level), description });
  },

  updateEducationLevel: async (id, { level, description }) => {
    const el = await EducationLevel.findByPk(id);
    if (!el) throw new NotFoundError('Education level not found', 'EDUCATION_LEVEL_NOT_FOUND');

    if (level !== undefined && Number(level) !== el.level) {
      const conflict = await EducationLevel.findOne({ where: { level: Number(level), id: { [Op.ne]: el.id } } });
      if (conflict) throw new ConflictError(`Level ${level} already exists`, 'EDUCATION_LEVEL_EXISTS');
    }
    const updates = {};
    if (level !== undefined) updates.level = Number(level);
    if (description !== undefined) updates.description = description;
    await el.update(updates);

    return el;
  },

  deleteEducationLevel: async (id) => {
    const el = await EducationLevel.findByPk(id);
    if (!el) throw new NotFoundError('Education level not found', 'EDUCATION_LEVEL_NOT_FOUND');
    await el.destroy();
    return el;
  }
};
