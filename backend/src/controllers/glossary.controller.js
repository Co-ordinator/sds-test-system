'use strict';

const { GlossaryTerm } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, BadRequestError } = require('../utils/errors/appError');

class GlossaryController {
  async listTerms(req, res, next) {
    try {
      const { section, search } = req.query;
      const where = { isActive: true };
      if (section && section !== 'all') where.section = section;
      if (search) where.term = { [Op.iLike]: `%${search}%` };

      const terms = await GlossaryTerm.findAll({
        where,
        order: [['term', 'ASC']],
        attributes: ['id', 'term', 'definition', 'section', 'example'],
      });

      return res.json({ status: 'success', data: { terms } });
    } catch (error) {
      return next(error);
    }
  }

  async getTerm(req, res, next) {
    try {
      const term = await GlossaryTerm.findByPk(req.params.id, {
        attributes: ['id', 'term', 'definition', 'section', 'example'],
      });
      if (!term) throw new NotFoundError('Term not found', 'GLOSSARY_TERM_NOT_FOUND');
      return res.json({ status: 'success', data: { term } });
    } catch (error) {
      return next(error);
    }
  }

  async createTerm(req, res, next) {
    try {
      const { term, definition, section, example } = req.body;
      if (!term || !definition) {
        throw new BadRequestError('term and definition are required', 'GLOSSARY_REQUIRED_FIELDS');
      }
      const created = await GlossaryTerm.create({ term, definition, section: section || 'general', example });
      return res.status(201).json({ status: 'success', data: { term: created } });
    } catch (error) {
      return next(error);
    }
  }

  async updateTerm(req, res, next) {
    try {
      const existing = await GlossaryTerm.findByPk(req.params.id);
      if (!existing) throw new NotFoundError('Term not found', 'GLOSSARY_TERM_NOT_FOUND');
      const { term, definition, section, example, isActive } = req.body;
      await existing.update({
        ...(term !== undefined && { term }),
        ...(definition !== undefined && { definition }),
        ...(section !== undefined && { section }),
        ...(example !== undefined && { example }),
        ...(isActive !== undefined && { isActive }),
      });
      return res.json({ status: 'success', data: { term: existing } });
    } catch (error) {
      return next(error);
    }
  }

  async deleteTerm(req, res, next) {
    try {
      const existing = await GlossaryTerm.findByPk(req.params.id);
      if (!existing) throw new NotFoundError('Term not found', 'GLOSSARY_TERM_NOT_FOUND');
      await existing.destroy();
      return res.json({ status: 'success', message: 'Term deleted' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new GlossaryController();
