'use strict';

const ASSESSMENT_CORE_ATTRIBUTES = [
  'id',
  'status',
  'progress',
  'scoreR',
  'scoreI',
  'scoreA',
  'scoreS',
  'scoreE',
  'scoreC',
  'hollandCode',
  'educationLevelAtTest',
  'userId',
  'completedAt',
  'createdAt',
  'updatedAt'
];

const OPTIONAL_ASSESSMENT_COLUMNS = {
  hollandCodeDisplay: 'holland_code_display',
  certificateProfileSnapshot: 'certificate_profile_snapshot'
};

const getAssessmentDatabaseColumns = (AssessmentModel, attributes = ASSESSMENT_CORE_ATTRIBUTES) => (
  attributes.map((attribute) => AssessmentModel?.rawAttributes?.[attribute]?.field || attribute)
);

let cachedOptionalSupport = null;

const getAssessmentOptionalColumnSupport = async (sequelize) => {
  if (cachedOptionalSupport) return cachedOptionalSupport;

  if (typeof sequelize?.query !== 'function') {
    cachedOptionalSupport = {
      hollandCodeDisplay: true,
      certificateProfileSnapshot: true
    };
    return cachedOptionalSupport;
  }

  const columnNames = Object.values(OPTIONAL_ASSESSMENT_COLUMNS);
  const [rows] = await sequelize.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'assessments'
        AND column_name IN (:columnNames)
    `,
    { replacements: { columnNames } }
  );

  const available = new Set(rows.map((row) => row.column_name));
  cachedOptionalSupport = {
    hollandCodeDisplay: available.has(OPTIONAL_ASSESSMENT_COLUMNS.hollandCodeDisplay),
    certificateProfileSnapshot: available.has(OPTIONAL_ASSESSMENT_COLUMNS.certificateProfileSnapshot)
  };
  return cachedOptionalSupport;
};

const assessmentAttributes = (options = {}) => {
  const attrs = [...ASSESSMENT_CORE_ATTRIBUTES];
  if (options.hollandCodeDisplay) attrs.push('hollandCodeDisplay');
  if (options.certificateProfileSnapshot) attrs.push('certificateProfileSnapshot');
  return attrs;
};

const resetAssessmentOptionalColumnSupportCache = () => {
  cachedOptionalSupport = null;
};

module.exports = {
  ASSESSMENT_CORE_ATTRIBUTES,
  getAssessmentDatabaseColumns,
  getAssessmentOptionalColumnSupport,
  assessmentAttributes,
  resetAssessmentOptionalColumnSupportCache
};
