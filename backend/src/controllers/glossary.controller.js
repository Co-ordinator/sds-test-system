'use strict';

const { GlossaryTerm } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, BadRequestError } = require('../utils/errors/appError');

const VALID_SECTIONS = new Set([
  'riasec',
  'structure',
  'actions',
  'occupations',
  'activities',
  'competencies',
  'self_estimates',
  'general',
]);

const SECTION_ALIASES = {
  'riasec types': 'riasec',
  assessment: 'structure',
  'assessment terms': 'structure',
  'activity words': 'actions',
  action: 'actions',
  occupation: 'occupations',
  competency: 'competencies',
  'self estimate': 'self_estimates',
  'self estimates': 'self_estimates',
  'self-estimates': 'self_estimates',
};

const normalizeSection = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === 'all') return { section: null, valid: true };
  const normalized = SECTION_ALIASES[raw] || raw.replace(/[\s-]+/g, '_');
  return { section: normalized, valid: VALID_SECTIONS.has(normalized) };
};

const normalizeText = (value) => String(value || '').trim();

const dedupeTerms = (terms) => {
  const seen = new Set();
  return terms.filter((term) => {
    const key = `${String(term.section || '').toLowerCase()}::${String(term.term || '').trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

class GlossaryController {
  async listTerms(req, res, next) {
    try {
      const { section, search } = req.query;
      const normalizedSection = normalizeSection(section);
      if (!normalizedSection.valid) {
        return res.json({ status: 'success', data: { terms: [] } });
      }

      const where = { isActive: true };
      if (normalizedSection.section) where.section = normalizedSection.section;

      const searchTerm = normalizeText(search);
      if (searchTerm) {
        const pattern = `%${searchTerm}%`;
        where[Op.or] = [
          { term: { [Op.iLike]: pattern } },
          { definition: { [Op.iLike]: pattern } },
          { example: { [Op.iLike]: pattern } },
        ];
      }

      const records = await GlossaryTerm.findAll({
        where,
        order: [['term', 'ASC'], ['section', 'ASC'], ['updatedAt', 'DESC']],
        attributes: ['id', 'term', 'definition', 'section', 'example'],
      });
      const terms = dedupeTerms(records);

      return res.json({ status: 'success', data: { terms } });
    } catch (error) {
      return next(error);
    }
  }

  async getTerm(req, res, next) {
    try {
      const term = await GlossaryTerm.findOne({
        where: { id: req.params.id, isActive: true },
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
      const normalizedTerm = normalizeText(term);
      const normalizedDefinition = normalizeText(definition);
      if (!normalizedTerm || !normalizedDefinition) {
        throw new BadRequestError('term and definition are required', 'GLOSSARY_REQUIRED_FIELDS');
      }
      const normalizedSection = normalizeSection(section || 'general');
      if (!normalizedSection.valid || !normalizedSection.section) {
        throw new BadRequestError('Invalid glossary section', 'GLOSSARY_INVALID_SECTION');
      }

      const created = await GlossaryTerm.create({
        term: normalizedTerm,
        definition: normalizedDefinition,
        section: normalizedSection.section,
        example: example === undefined || example === null ? null : normalizeText(example),
      });
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
      const normalizedTerm = term === undefined ? undefined : normalizeText(term);
      const normalizedDefinition = definition === undefined ? undefined : normalizeText(definition);
      if (normalizedTerm === '' || normalizedDefinition === '') {
        throw new BadRequestError('term and definition cannot be blank', 'GLOSSARY_REQUIRED_FIELDS');
      }

      const sectionUpdate = section === undefined ? undefined : normalizeSection(section);
      if (sectionUpdate && (!sectionUpdate.valid || !sectionUpdate.section)) {
        throw new BadRequestError('Invalid glossary section', 'GLOSSARY_INVALID_SECTION');
      }

      await existing.update({
        ...(normalizedTerm !== undefined && { term: normalizedTerm }),
        ...(normalizedDefinition !== undefined && { definition: normalizedDefinition }),
        ...(sectionUpdate && { section: sectionUpdate.section }),
        ...(example !== undefined && { example: example === null ? null : normalizeText(example) }),
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
