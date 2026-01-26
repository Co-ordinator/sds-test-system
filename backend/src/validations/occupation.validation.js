const Joi = require('joi');

const demandEnum = ['low', 'medium', 'high', 'very_high', 'critical'];

const baseOccupationSchema = Joi.object({
  code: Joi.string().trim().uppercase().length(3).required().messages({
    'string.length': 'Code must be 3 characters',
    'any.required': 'Code is required'
  }),
  name: Joi.string().trim().min(1).required().messages({
    'any.required': 'Name is required',
    'string.empty': 'Name is required'
  }),
  hollandCodes: Joi.array().items(Joi.string().trim().uppercase().length(3)).optional(),
  primaryRiasec: Joi.string().trim().length(1).uppercase().valid('R', 'I', 'A', 'S', 'E', 'C').optional(),
  secondaryRiasec: Joi.string().trim().length(1).uppercase().valid('R', 'I', 'A', 'S', 'E', 'C').optional(),
  description: Joi.string().optional(),
  category: Joi.string().optional(),
  educationLevel: Joi.number().integer().optional(),
  educationRequired: Joi.string().optional(),
  demandLevel: Joi.string().valid(...demandEnum).optional(),
  availableInEswatini: Joi.boolean().optional(),
  localDemand: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  skills: Joi.array().items(Joi.string().trim()).optional()
});

const createOccupationSchema = baseOccupationSchema;

const updateOccupationSchema = Joi.object({
  name: Joi.string().trim().min(1),
  hollandCodes: Joi.array().items(Joi.string().trim().uppercase().length(3)),
  primaryRiasec: Joi.string().trim().length(1).uppercase().valid('R', 'I', 'A', 'S', 'E', 'C'),
  secondaryRiasec: Joi.string().trim().length(1).uppercase().valid('R', 'I', 'A', 'S', 'E', 'C'),
  description: Joi.string(),
  category: Joi.string(),
  educationLevel: Joi.number().integer(),
  educationRequired: Joi.string(),
  demandLevel: Joi.string().valid(...demandEnum),
  availableInEswatini: Joi.boolean(),
  localDemand: Joi.string().valid('low', 'medium', 'high', 'critical'),
  skills: Joi.array().items(Joi.string().trim())
}).min(1);

const occupationsArraySchema = Joi.array().items(baseOccupationSchema).min(1).messages({
  'any.required': 'Occupations array is required',
  'array.min': 'Occupations array must contain at least one item'
});

const importOccupationsSchema = Joi.alternatives().try(
  occupationsArraySchema,
  Joi.object({ occupations: occupationsArraySchema.required() })
);

module.exports = {
  createOccupationSchema,
  updateOccupationSchema,
  importOccupationsSchema,
  occupationsArraySchema,
  baseOccupationSchema
};
