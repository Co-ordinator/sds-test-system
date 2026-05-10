'use strict';

const GENERIC_PREFIX = /^all\s+other\s+/i;

const SPECIAL_GROUPS = [
  [/\bmathematical scientists?\b/i, 'Mathematical Science'],
  [/\bcomputer scientists?\b/i, 'Computer Science'],
  [/\bphysical scientists?\b/i, 'Physical Science'],
  [/\bsocial scientists?\b/i, 'Social Science'],
  [/\bnatural sciences?\b/i, 'Natural Science'],
  [/\bengineers?\b/i, 'Engineering'],
  [/\bengineering technologists? and technicians?\b/i, 'Engineering Technology'],
  [/\bengineering technicians?\b/i, 'Engineering Technology'],
  [/\bscience technologists? and technicians?\b/i, 'Science Technology'],
  [/\bscience technicians?\b/i, 'Science Technology'],
  [/\bhealth technologists? and technicians?\b/i, 'Health Technology'],
  [/\bpostsecondary teachers?\b/i, 'Postsecondary Teaching'],
  [/\bteachers?\b/i, 'Teaching'],
  [/\bmanagers? and administrators?\b/i, 'Management and Administration'],
  [/\badministrators?\b/i, 'Administration'],
  [/\bfinancial specialists?\b/i, 'Financial Specialist'],
  [/\blegal assistants? and technicians?\b/i, 'Legal Support'],
  [/\bprotective service workers?\b/i, 'Protective Service'],
  [/\breligious workers?\b/i, 'Religious Service'],
  [/\btherapists?\b/i, 'Therapy'],
  [/\bworkers?\b/i, 'Work'],
  [/\boccupations?\b/i, 'Career Paths']
];

const ABBREVIATIONS = [
  [/\btex\.\s*prod\.\b/gi, 'textile production'],
  [/\bwood\s+prod\.\b/gi, 'wood products'],
  [/\bfood\s+prep\.\b/gi, 'food preparation'],
  [/\bmetal\s+prod\.\b/gi, 'metal products'],
  [/\bbuild,\s*mat\.\b/gi, 'building materials'],
  [/\bnonmet\.\s*min\.\b/gi, 'non-metallic minerals'],
  [/\bmfd\.\s*bldgs\.\b/gi, 'manufactured buildings'],
  [/\bcan\.\s*&\s*preserv\.\b/gi, 'canning and preserving'],
  [/\bpersonal\s+ser\.\b/gi, 'personal service'],
  [/\belec,\s*equip\.\b/gi, 'electrical equipment'],
  [/\blight,\s*fix\.\b/gi, 'lighting fixtures'],
  [/\bplastic-synth\.\b/gi, 'plastic and synthetics']
];

const titleCase = (value) => String(value || '')
  .toLowerCase()
  .replace(/\b([a-z])/g, (match) => match.toUpperCase())
  .replace(/\bAnd\b/g, 'and')
  .replace(/\bOf\b/g, 'of')
  .replace(/\bFor\b/g, 'for')
  .replace(/\bIn\b/g, 'in')
  .replace(/\bOr\b/g, 'or');

const normalizeSpacing = (value) => String(value || '')
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.;:)])/g, '$1')
  .replace(/([(])\s+/g, '$1')
  .trim();

const expandAbbreviations = (value) => {
  let text = String(value || '');
  ABBREVIATIONS.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });
  return normalizeSpacing(text);
};

const removeNec = (value) => normalizeSpacing(
  String(value || '')
    .replace(/\bn\.?\s*e\.?\s*c\.?\*?/gi, '')
    .replace(/\bnec\b/gi, '')
    .replace(/\(\s*[;,.\s]*\)/g, '')
    .replace(/,\s*[,.)]/g, ',')
    .replace(/\s*,\s*$/g, '')
    .replace(/\s*\(\s*;\s*/g, ' (')
);

const removeTechnicalParentheticals = (value) => normalizeSpacing(
  String(value || '').replace(/\s*\(([^)]*(?:n\.?\s*e\.?\s*c\.?|tex\.\s*prod\.|wood\s+prod\.|food\s+prep\.|metal\s+prod\.|build,\s*mat\.)[^)]*)\)/gi, '')
);

const toCareerGroup = (value) => {
  let text = removeNec(removeTechnicalParentheticals(expandAbbreviations(value)))
    .replace(GENERIC_PREFIX, '')
    .replace(/\bexcept clerical\b/ig, '')
    .replace(/\bincluding clerical\b/ig, '')
    .replace(/[*/]+$/g, '')
    .replace(/\s*[-/]\s*$/, '');

  SPECIAL_GROUPS.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  text = normalizeSpacing(text)
    .replace(/\s*,\s*$/g, '')
    .replace(/\s+and\s+Related$/i, '')
    .replace(/\s+Related$/i, '');

  if (!text) return 'Related Career Paths';
  if (!/(career|careers|path|paths|work|service|teaching|technology|engineering|science|administration|management|support|therapy)$/i.test(text)) {
    text = `${text} Careers`;
  } else if (/(science|engineering|technology|administration|management|support|therapy)$/i.test(text)) {
    text = `${text} Careers`;
  }
  return titleCase(text).replace(/\bScience Careers\b/g, 'Science Careers');
};

const makeDisplayName = (name) => {
  const original = normalizeSpacing(name);
  if (!original) return 'Career option';

  const withoutTechnicalParentheses = removeTechnicalParentheticals(original);
  const isGeneric = GENERIC_PREFIX.test(original)
    || /\bn\.?\s*e\.?\s*c\.?\*?\.?\s*$/i.test(withoutTechnicalParentheses)
    || /,\s*other\b/i.test(original)
    || /other,\s*n\.?\s*e\.?\s*c\.?/i.test(original);

  if (isGeneric) {
    return toCareerGroup(original);
  }

  const cleaned = removeNec(removeTechnicalParentheticals(expandAbbreviations(original)))
    .replace(/[*/]+$/g, '');

  return normalizeSpacing(cleaned) || original;
};

const makeDisplayDescription = (occupation, displayName) => {
  const rawDescription = occupation?.description || occupation?.dataValues?.description;
  if (rawDescription) {
    return removeNec(expandAbbreviations(rawDescription));
  }

  const code = occupation?.primaryRiasec || occupation?.dataValues?.primaryRiasec || occupation?.code || occupation?.dataValues?.code;
  const source = occupation?.source || occupation?.dataValues?.source;
  const genericSource = source && /Dictionary of Holland Occupational Codes/i.test(source);
  if (genericSource || /career paths|careers/i.test(displayName)) {
    return `A broad career area matched to your Holland profile. Discuss specific roles, training routes, and local opportunities with a counselor.`;
  }
  if (code) {
    return `A career option aligned with your ${String(code).toUpperCase().replace(/[^RIASEC]/g, '').slice(0, 3) || 'RIASEC'} interest profile.`;
  }
  return '';
};

const decorateOccupation = (occupation) => {
  if (!occupation) return occupation;
  const name = occupation.name || occupation.dataValues?.name;
  const displayName = makeDisplayName(name);
  const displayDescription = makeDisplayDescription(occupation, displayName);

  if (typeof occupation.setDataValue === 'function') {
    occupation.setDataValue('displayName', displayName);
    occupation.setDataValue('displayDescription', displayDescription);
  } else {
    occupation.displayName = displayName;
    occupation.displayDescription = displayDescription;
  }
  return occupation;
};

module.exports = {
  makeDisplayName,
  makeDisplayDescription,
  decorateOccupation
};
