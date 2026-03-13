'use strict';

const { EducationLevel } = require('../models');
const { Op } = require('sequelize');

module.exports = {

  listEducationLevels: async () => {
    return await EducationLevel.findAll({ order: [['level', 'ASC']] });
  },

  getEducationLevelById: async (id) => {
    return await EducationLevel.findByPk(id);
  },

  createEducationLevel: async ({ level, description }) => {
    if (level === undefined || !description) {
      throw new Error('level (integer) and description are required');
    }
    const existing = await EducationLevel.findOne({ where: { level: Number(level) } });
    if (existing) throw new Error(`Level ${level} already exists`);

    return await EducationLevel.create({ level: Number(level), description });
  },

  updateEducationLevel: async (id, { level, description }) => {
    const el = await EducationLevel.findByPk(id);
    if (!el) throw new Error('Education level not found');

    if (level !== undefined && Number(level) !== el.level) {
      const conflict = await EducationLevel.findOne({ where: { level: Number(level), id: { [Op.ne]: el.id } } });
      if (conflict) throw new Error(`Level ${level} already exists`);
    }
    const updates = {};
    if (level !== undefined) updates.level = Number(level);
    if (description !== undefined) updates.description = description;
    await el.update(updates);

    return el;
  },

  deleteEducationLevel: async (id) => {
    const el = await EducationLevel.findByPk(id);
    if (!el) throw new Error('Education level not found');
    await el.destroy();
    return el;
  }
};
