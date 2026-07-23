'use strict';

const USER_TYPES = Object.freeze({
  HIGH_SCHOOL: 'High School Student',
  UNIVERSITY: 'University Student',
  PROFESSIONAL: 'Professional'
});

const MISSING_TEXT = /^(?:not specified|not provided|n\/?a|none|null|undefined)$/i;

const readValue = (record, key) => {
  if (!record) return undefined;
  if (record[key] !== undefined) return record[key];
  return record.dataValues?.[key];
};

const normalizePunctuation = (value) => String(value || '')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\u2026/g, '...')
  .replace(/\u00a0/g, ' ');

const cleanText = (value) => {
  const text = normalizePunctuation(value).replace(/\s+/g, ' ').trim();
  return text && !MISSING_TEXT.test(text) ? text : '';
};

const cleanClauseText = (value) => cleanText(value).replace(/[.,;:]+$/g, '').trim();

const upperClauseText = (value) => cleanClauseText(value).toUpperCase();

const normalizeUserType = (value) => {
  const compact = cleanText(value).toLowerCase().replace(/[\s_-]+/g, '');
  if (compact === 'highschoolstudent' || compact === 'highschool') return USER_TYPES.HIGH_SCHOOL;
  if (compact === 'universitystudent' || compact === 'university') return USER_TYPES.UNIVERSITY;
  if (compact === 'professional') return USER_TYPES.PROFESSIONAL;
  return '';
};

const normalizeRegion = (value) => upperClauseText(value).replace(/\s+REGION$/i, '').trim();

const firstText = (...values) => {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
};

const buildLiveRoleContext = (user) => {
  const userType = normalizeUserType(readValue(user, 'userType'));
  const institution = readValue(user, 'institution');
  const workplace = readValue(user, 'workplace');
  const occupation = readValue(user, 'occupation');

  const isProfessional = userType === USER_TYPES.PROFESSIONAL;
  const locationOwner = isProfessional ? workplace : institution;

  return {
    userType,
    institutionName: upperClauseText(firstText(
      readValue(institution, 'name'),
      readValue(user, 'currentInstitution')
    )),
    workplaceName: upperClauseText(firstText(
      readValue(workplace, 'name'),
      readValue(user, 'workplaceName')
    )),
    occupationName: upperClauseText(firstText(
      readValue(occupation, 'name'),
      readValue(user, 'currentOccupation')
    )),
    districtName: upperClauseText(firstText(
      readValue(locationOwner, 'district'),
      readValue(user, 'district')
    )),
    regionName: normalizeRegion(firstText(
      readValue(locationOwner, 'region'),
      readValue(user, 'region')
    ))
  };
};

const buildSnapshotRoleContext = (snapshot) => ({
  userType: normalizeUserType(readValue(snapshot, 'userType')),
  institutionName: upperClauseText(readValue(snapshot, 'institutionName')),
  workplaceName: upperClauseText(readValue(snapshot, 'workplaceName')),
  occupationName: upperClauseText(readValue(snapshot, 'occupationName')),
  districtName: upperClauseText(firstText(
    readValue(snapshot, 'district'),
    readValue(snapshot, 'districtName')
  )),
  regionName: normalizeRegion(firstText(
    readValue(snapshot, 'region'),
    readValue(snapshot, 'regionName')
  ))
});

/**
 * Produce the role-aware data used in an official certificate sentence.
 *
 * A non-null snapshot is authoritative for every role/context value so that a
 * later profile edit cannot rewrite an older certificate. The recipient name
 * and PIN deliberately remain live identity fields and are never read from the
 * snapshot.
 */
const buildCertificateRecipientContext = ({ user = {}, snapshot = null } = {}) => {
  const firstName = cleanText(readValue(user, 'firstName'));
  const lastName = cleanText(readValue(user, 'lastName'));
  const recipientName = upperClauseText([firstName, lastName].filter(Boolean).join(' ')) || 'TEST TAKER';
  const pin = cleanClauseText(firstText(
    readValue(user, 'nationalId'),
    readValue(user, 'studentCode')
  ));

  const roleContext = snapshot === null || snapshot === undefined
    ? buildLiveRoleContext(user)
    : buildSnapshotRoleContext(snapshot);

  return {
    recipientName,
    pin,
    ...roleContext
  };
};

const regionWithArticle = (regionName) => (
  regionName === 'MULTIPLE' ? 'multiple regions' : `the ${regionName} Region`
);

const regionWithoutArticle = (regionName) => (
  regionName === 'MULTIPLE' ? 'multiple regions' : `${regionName} Region`
);

const appendStudentContext = (statement, context, university = false) => {
  if (context.institutionName) {
    statement += university
      ? ` while registered at ${context.institutionName}`
      : ` at ${context.institutionName}`;
    if (context.regionName) statement += `, located in ${regionWithArticle(context.regionName)}`;
  } else if (context.regionName) {
    statement += ` in ${regionWithArticle(context.regionName)}`;
  }
  return statement;
};

const appendProfessionalContext = (statement, context) => {
  statement += ' as a Professional';
  if (context.occupationName) statement += ` working as ${context.occupationName}`;
  if (context.workplaceName) statement += ` at ${context.workplaceName}`;

  if (context.districtName && context.regionName) {
    statement += `, based in ${context.districtName}, ${regionWithoutArticle(context.regionName)}`;
  } else if (context.districtName) {
    statement += `, based in ${context.districtName}`;
  } else if (context.regionName) {
    statement += `, based in ${regionWithArticle(context.regionName)}`;
  }
  return statement;
};

const buildCertificateStatement = ({ user = {}, snapshot = null, testDate = '' } = {}) => {
  const context = buildCertificateRecipientContext({ user, snapshot });
  const dateLabel = upperClauseText(testDate);
  const identity = context.pin
    ? `${context.recipientName}, PIN: ${context.pin},`
    : context.recipientName;

  let statement = `This is to certify that ${identity} completed a Self-Directed Search test`;
  if (dateLabel) statement += ` in ${dateLabel}`;

  if (context.userType === USER_TYPES.HIGH_SCHOOL) {
    statement = appendStudentContext(statement, context);
  } else if (context.userType === USER_TYPES.UNIVERSITY) {
    statement = appendStudentContext(statement, context, true);
  } else if (context.userType === USER_TYPES.PROFESSIONAL) {
    statement = appendProfessionalContext(statement, context);
  }

  return `${statement}.`;
};

module.exports = {
  USER_TYPES,
  buildCertificateRecipientContext,
  buildCertificateStatement
};
