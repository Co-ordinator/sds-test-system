const Joi = require('joi');

const sectionEnum = ['activities', 'competencies', 'occupations', 'self_estimates'];
const riasecEnum = ['R', 'I', 'A', 'S', 'E', 'C'];

const baseQuestionSchema = Joi.object({
  text: Joi.string().trim().min(1).required().messages({
    'any.required': 'Question text is required',
    'string.empty': 'Question text is required'
  }),
  section: Joi.string().valid(...sectionEnum).required().messages({
    'any.only': `Section must be one of ${sectionEnum.join(', ')}`,
    'any.required': 'Section is required'
  }),
  riasecType: Joi.string().valid(...riasecEnum).required().messages({
    'any.only': `RIASEC type must be one of ${riasecEnum.join(', ')}`,
    'any.required': 'RIASEC type is required'
  }),
  order: Joi.number().integer().positive().required().messages({
    'number.base': 'Order must be a number',
    'number.integer': 'Order must be an integer',
    'number.positive': 'Order must be greater than 0',
    'any.required': 'Order is required'
  })
});

const createQuestionSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
  section: Joi.string().valid(...sectionEnum).required(),
  riasecType: Joi.string().valid(...riasecEnum).required(),
  order: Joi.number().integer().positive().optional()
});

const updateQuestionSchema = Joi.object({
  text: Joi.string().trim().min(1),
  section: Joi.string().valid(...sectionEnum),
  riasecType: Joi.string().valid(...riasecEnum),
  order: Joi.number().integer().positive()
}).min(1);

const questionsArraySchema = Joi.array().items(baseQuestionSchema).min(1).messages({
  'any.required': 'Questions array is required',
  'array.min': 'Questions array must contain at least one item'
});

const importQuestionsSchema = Joi.alternatives().try(
  questionsArraySchema,
  Joi.object({ questions: questionsArraySchema.required() })
);

module.exports = {
  createQuestionSchema,
  updateQuestionSchema,
  importQuestionsSchema,
  questionsArraySchema,
  baseQuestionSchema
};
