'use strict';

const { drawLetterheadImage } = require('./pdfAssets');
const { makeDisplayName, makeDisplayDescription } = require('./occupationDisplay');

const RIASEC_LABELS = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional'
};

const RIASEC_COLORS = {
  R: '#c83232',
  I: '#2563eb',
  A: '#7c3aed',
  S: '#059669',
  E: '#d97706',
  C: '#2d8bc4'
};

const RIASEC_SUMMARY = {
  R: 'Practical, hands-on work with tools, equipment, plants, animals, machines, and physical tasks.',
  I: 'Analytical work involving investigation, science, mathematics, research, and problem solving.',
  A: 'Creative expression through design, writing, art, music, performance, language, and original ideas.',
  S: 'Helping, teaching, supporting, advising, caring, and working closely with people.',
  E: 'Leading, persuading, selling, organizing people, managing activities, and taking initiative.',
  C: 'Structured work with records, numbers, systems, procedures, accuracy, and organized information.'
};

const RIASEC_STRENGTHS = {
  R: ['Practical', 'Technical', 'Physical tasks'],
  I: ['Analytical', 'Scientific', 'Problem solving'],
  A: ['Creative', 'Expressive', 'Original ideas'],
  S: ['Supportive', 'Teaching', 'Service'],
  E: ['Leadership', 'Persuasion', 'Business'],
  C: ['Accurate', 'Organized', 'Data handling']
};

const QUAL_LABELS = {
  certificate: 'Certificate',
  diploma: 'Diploma',
  bachelor: "Bachelor's Degree",
  honours: 'Honours Degree',
  postgrad_diploma: 'Postgraduate Diploma',
  masters: "Master's Degree",
  doctorate: 'Doctorate',
  short_course: 'Short Course',
  tvet: 'TVET Programme',
  other: 'Qualification'
};

const USER_TYPE_LABELS = {
  high_school_student: 'High school learner',
  university_student: 'Tertiary student',
  professional: 'Professional'
};

const DEMAND_LABELS = {
  critical: 'Critical demand',
  very_high: 'Very high demand',
  high: 'High demand',
  medium: 'Medium demand',
  low: 'Low demand'
};

const COLORS = {
  navy: '#07183d',
  navy2: '#102a5f',
  blue: '#2d8bc4',
  red: '#c83232',
  yellow: '#ffeb3b',
  text: '#111827',
  muted: '#5f6b7a',
  faint: '#f3f7fb',
  border: '#d7e2ec',
  white: '#ffffff'
};

const PAGE = {
  margin: 38,
  width: 595.28,
  height: 841.89
};

const contentWidth = () => PAGE.width - PAGE.margin * 2;

const read = (obj, key, fallback = undefined) => {
  if (!obj) return fallback;
  if (typeof obj.getDataValue === 'function') {
    const value = obj.getDataValue(key);
    if (value !== undefined && value !== null) return value;
  }
  if (typeof obj.get === 'function') {
    try {
      const plain = obj.get({ plain: true });
      if (plain && plain[key] !== undefined && plain[key] !== null) return plain[key];
    } catch (_) {}
  }
  if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  if (obj.dataValues && obj.dataValues[key] !== undefined && obj.dataValues[key] !== null) return obj.dataValues[key];
  return fallback;
};

const clean = (value, fallback = 'Not available') => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
};

const compact = (value, max = 120, fallback = 'Not available') => {
  const text = clean(value, fallback);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
};

const normalizeUserType = (value) => {
  const raw = String(value || '').toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
  if (raw.includes('professional')) return 'professional';
  if (raw.includes('university') || raw.includes('tertiary') || raw === 'student') return 'university_student';
  return 'high_school_student';
};

const formatDate = (value, fallback = '') => {
  if (!value) return fallback || 'Not available';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback || 'Not available';
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatQualification = (value) => QUAL_LABELS[String(value || '').toLowerCase()] || clean(value, 'Qualification');

const parseDisplayGroups = (code) => String(code || '')
  .toUpperCase()
  .trim()
  .split(/\s+/)
  .flatMap((group) => {
    const cleaned = group.replace(/[^RIASEC/]/g, '');
    if (!cleaned) return [];
    if (!cleaned.includes('/')) return cleaned.split('').filter((letter) => RIASEC_LABELS[letter]).map((letter) => [letter]);
    return [cleaned.split('/').map((letter) => letter.trim()).filter((letter) => RIASEC_LABELS[letter])];
  })
  .filter((group) => group.length > 0)
  .slice(0, 3);

const scoreRowsFor = (assessment) => {
  const order = ['R', 'I', 'A', 'S', 'E', 'C'];
  return order.map((key) => ({
    key,
    label: RIASEC_LABELS[key],
    score: Number(read(assessment, `score${key}`, 0) || 0),
    color: RIASEC_COLORS[key]
  }));
};

const courseInstitutions = (course, limit = 3) => {
  const links = read(course, 'courseInstitutions', []) || [];
  return links
    .map((entry) => read(entry, 'institution'))
    .filter(Boolean)
    .map((institution) => clean(read(institution, 'name'), 'Institution'))
    .slice(0, limit);
};

const courseRequirements = (course, limit = 4) => {
  const requirements = read(course, 'requirements', []) || [];
  return requirements
    .slice(0, limit)
    .map((req) => {
      const subject = clean(read(req, 'subject'), 'Subject');
      const grade = clean(read(req, 'minimumGrade'), 'required grade');
      return `${subject}: ${grade}`;
    });
};

const occupationCodes = (occupation) => {
  const codes = read(occupation, 'hollandCodes', []);
  if (Array.isArray(codes) && codes.length > 0) return codes.slice(0, 3).join(', ');
  return clean(read(occupation, 'code') || read(occupation, 'primaryRiasec'), 'RIASEC');
};

const uniqueValues = (values) => [...new Set((values || []).filter(Boolean))];

const themeCode = (group) => uniqueValues(group).join('/');

const themeLabel = (group) => uniqueValues(group)
  .map((letter) => RIASEC_LABELS[letter])
  .filter(Boolean)
  .join('/');

const themeSummary = (group) => uniqueValues(group)
  .map((letter) => RIASEC_SUMMARY[letter])
  .filter(Boolean)
  .join(' Also: ');

const themeStrengths = (group) => uniqueValues(group)
  .flatMap((letter) => RIASEC_STRENGTHS[letter] || [])
  .filter(Boolean);

const addSwaziStrip = (doc, y) => {
  const x = 0;
  const w = PAGE.width;
  doc.rect(x, y, w, 4).fill(COLORS.blue);
  doc.rect(x + w * 0.42, y, 42, 4).fill(COLORS.yellow);
  doc.rect(x + w * 0.49, y, 54, 4).fill(COLORS.red);
  doc.rect(x + w * 0.58, y, 42, 4).fill(COLORS.yellow);
};

const textBlock = (doc, value, x, y, width, height, options = {}) => {
  doc
    .font(options.font || 'Helvetica')
    .fontSize(options.size || 8.5)
    .fillColor(options.color || COLORS.text)
    .text(clean(value, ''), x, y, {
      width,
      height,
      lineGap: options.lineGap ?? 1.2,
      ellipsis: true,
      align: options.align || 'left'
    });
};

const label = (doc, value, x, y, options = {}) => {
  doc
    .font(options.font || 'Helvetica-Bold')
    .fontSize(options.size || 8)
    .fillColor(options.color || COLORS.muted)
    .text(value, x, y, { width: options.width || 140, height: options.height || 12, ellipsis: true });
};

const card = (doc, x, y, w, h, options = {}) => {
  doc
    .roundedRect(x, y, w, h, options.radius ?? 7)
    .fillAndStroke(options.fill || COLORS.white, options.stroke || COLORS.border);
};

const pill = (doc, value, x, y, options = {}) => {
  const fontSize = options.size || 7.4;
  doc.font('Helvetica-Bold').fontSize(fontSize);
  const w = Math.min(options.maxWidth || 132, doc.widthOfString(value) + 16);
  doc.roundedRect(x, y, w, 16, 8).fillAndStroke(options.fill || COLORS.faint, options.stroke || COLORS.border);
  doc.fillColor(options.color || COLORS.text).text(value, x + 8, y + 4, { width: w - 16, height: 9, ellipsis: true });
  return w;
};

const sectionTitle = (doc, title, subtitle, x, y, w = contentWidth()) => {
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.navy).text(title, x, y, { width: w, height: 16, ellipsis: true });
  if (subtitle) {
    doc.font('Helvetica').fontSize(8.2).fillColor(COLORS.muted).text(subtitle, x, y + 16, { width: w, height: 18, ellipsis: true });
    return y + 38;
  }
  return y + 24;
};

const pageShell = (doc, title, subtitle, pageNo, totalPages, options = {}) => {
  const m = PAGE.margin;
  const w = contentWidth();

  if (options.officialHeader) {
    const letterhead = drawLetterheadImage(doc, {
      x: 0,
      y: 18,
      width: doc.page.width,
      maxHeight: 132
    });
    const titleY = letterhead ? Math.max(letterhead.bottom + 10, 160) : 58;

    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.text)
      .text(title, m, titleY, { width: w, align: 'center' });
    doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.muted)
      .text(subtitle, m, titleY + 14, { width: w, align: 'center' });
    const ruleY = titleY + 24;
    doc.moveTo(m, ruleY).lineTo(m + w, ruleY).strokeColor(COLORS.border).lineWidth(0.6).stroke();
    return ruleY + 14;
  }

  addSwaziStrip(doc, 0);
  const letterhead = drawLetterheadImage(doc, { x: m, y: 20, width: 198, maxHeight: 52, align: 'left' });

  if (!letterhead) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.navy).text('KINGDOM OF ESWATINI', m, 26, { width: 180 });
    doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted).text('Ministry of Labour & Social Security', m, 38, { width: 180 });
  }

  doc.moveTo(m, 80).lineTo(m + w, 80).strokeColor(COLORS.border).lineWidth(0.7).stroke();
  doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.navy).text(title, m, 94, { width: w * 0.78, height: 18, ellipsis: true });
  doc.font('Helvetica').fontSize(7.8).fillColor(COLORS.muted).text(subtitle, m, 112, { width: w * 0.76, height: 14, ellipsis: true });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.blue)
    .text(`PAGE ${pageNo} OF ${totalPages}`, m, 97, { width: w, align: 'right', lineBreak: false });
  return 138;
};

const drawScoreBars = (doc, rows, x, y, w, h) => {
  card(doc, x, y, w, h, { fill: '#fbfdff' });
  label(doc, 'RIASEC SCORE PROFILE', x + 14, y + 12, { color: COLORS.blue, width: w - 28 });
  const max = Math.max(...rows.map((row) => row.score), 1);
  rows.forEach((row, index) => {
    const rowY = y + 34 + index * 22;
    const pct = row.score / max;
    doc.roundedRect(x + 14, rowY + 8, w - 86, 7, 3.5).fill('#e7eef6');
    doc.roundedRect(x + 14, rowY + 8, Math.max(3, (w - 86) * pct), 7, 3.5).fill(row.color);
    doc.font('Helvetica-Bold').fontSize(8.2).fillColor(row.color).text(row.key, x + 14, rowY - 1, { width: 16 });
    doc.font('Helvetica').fontSize(7.6).fillColor(COLORS.text).text(row.label, x + 34, rowY, { width: 94, height: 10, ellipsis: true });
    doc.font('Helvetica-Bold').fontSize(8.2).fillColor(COLORS.text).text(String(row.score), x + w - 42, rowY, { width: 28, align: 'right' });
  });
};

const drawCodeCard = (doc, groups, labelsText, x, y, w, h) => {
  card(doc, x, y, w, h, { fill: COLORS.navy, stroke: COLORS.navy });
  label(doc, 'HOLLAND CODE', x + 16, y + 14, { color: COLORS.yellow, width: w - 32 });
  let codeX = x + 16;
  groups.forEach((group) => {
    const value = group.join('/');
    doc.font('Helvetica-Bold').fontSize(22);
    const chipW = Math.max(42, doc.widthOfString(value) + 20);
    doc.roundedRect(codeX, y + 34, chipW, 38, 7).fillAndStroke(COLORS.white, '#ffffff');
    doc.fillColor(COLORS.navy).text(value, codeX, y + 42, { width: chipW, align: 'center' });
    codeX += chipW + 8;
  });
  textBlock(doc, labelsText, x + 16, y + 82, w - 32, h - 94, { color: '#dbeafe', size: 8.8, font: 'Helvetica-Bold' });
};

const drawInfoRow = (doc, title, value, x, y, w) => {
  label(doc, title.toUpperCase(), x, y, { width: w, color: COLORS.blue, size: 7.2 });
  textBlock(doc, value, x, y + 11, w, 18, { size: 8.7, font: 'Helvetica-Bold', color: COLORS.text });
};

const drawOccupationCard = (doc, occupation, index, x, y, w, h) => {
  const demand = read(occupation, 'localDemand') || read(occupation, 'demandLevel');
  const demandText = demand ? DEMAND_LABELS[demand] || clean(demand) : 'Demand not listed';
  const primary = clean(read(occupation, 'primaryRiasec') || occupationCodes(occupation), 'R');
  const displayName = read(occupation, 'displayName') || makeDisplayName(read(occupation, 'name'));
  const displayDescription = read(occupation, 'displayDescription') || makeDisplayDescription(occupation, displayName);
  card(doc, x, y, w, h, { fill: '#fbfdff' });
  doc.roundedRect(x + 10, y + 11, 26, 26, 6).fillAndStroke(RIASEC_COLORS[primary[0]] || COLORS.blue, RIASEC_COLORS[primary[0]] || COLORS.blue);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white).text(String(index + 1), x + 10, y + 19, { width: 26, align: 'center' });
  textBlock(doc, displayName, x + 44, y + 9, w - 54, 20, { font: 'Helvetica-Bold', size: 9.2, color: COLORS.navy });
  textBlock(doc, `${occupationCodes(occupation)} | ${demandText}`, x + 44, y + 30, w - 54, 12, { size: 7.4, color: COLORS.blue, font: 'Helvetica-Bold' });
  textBlock(doc, displayDescription, x + 10, y + 48, w - 20, 34, { size: 7.8, color: COLORS.muted });
};

const drawCourseCard = (doc, course, index, x, y, w, h) => {
  const qualification = formatQualification(read(course, 'qualificationType'));
  const duration = read(course, 'durationYears') ? `${read(course, 'durationYears')} year(s)` : 'Duration varies';
  const institutions = courseInstitutions(course, 2);
  const requirements = courseRequirements(course, 3);
  card(doc, x, y, w, h, { fill: '#fbfdff' });
  doc.font('Helvetica-Bold').fontSize(7.8).fillColor(COLORS.blue).text(String(index + 1).padStart(2, '0'), x + 10, y + 11, { width: 20 });
  textBlock(doc, read(course, 'name'), x + 34, y + 8, w - 44, 18, { font: 'Helvetica-Bold', size: 8.9, color: COLORS.navy });
  textBlock(doc, `${qualification} | ${duration}${read(course, 'fundingPriority') ? ' | Priority field' : ''}`, x + 34, y + 27, w - 44, 12, { size: 7.3, color: COLORS.blue, font: 'Helvetica-Bold' });
  const detail = [
    institutions.length ? `Institutions: ${institutions.join(', ')}` : 'Institution links: confirm with counselor',
    requirements.length ? `Entry: ${requirements.join('; ')}` : 'Entry: confirm latest requirements'
  ].join('   ');
  textBlock(doc, detail, x + 10, y + 43, w - 20, h - 48, { size: 7.3, color: COLORS.muted });
};

const drawActionItem = (doc, number, title, text, x, y, w, h) => {
  card(doc, x, y, w, h, { fill: '#fbfdff' });
  doc.roundedRect(x + 10, y + 12, 28, 28, 7).fillAndStroke(COLORS.navy, COLORS.navy);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.yellow).text(String(number).padStart(2, '0'), x + 10, y + 21, { width: 28, align: 'center' });
  textBlock(doc, title, x + 48, y + 10, w - 58, 14, { font: 'Helvetica-Bold', size: 9.2, color: COLORS.navy });
  textBlock(doc, text, x + 48, y + 28, w - 58, h - 32, { size: 7.9, color: COLORS.muted });
};

const drawPills = (doc, items, x, y, w, maxRows = 2) => {
  let px = x;
  let py = y;
  let rows = 1;
  for (const item of items) {
    doc.font('Helvetica-Bold').fontSize(7.4);
    const value = compact(item, 32);
    const pillW = Math.min(132, doc.widthOfString(value) + 16);
    if (px + pillW > x + w) {
      rows += 1;
      if (rows > maxRows) break;
      px = x;
      py += 20;
    }
    pill(doc, value, px, py, { fill: COLORS.white, stroke: COLORS.border, color: COLORS.navy });
    px += pillW + 6;
  }
  return py + 20;
};

const renderResultsPdf = (doc, context) => {
  const {
    assessment,
    recommendations = {},
    studentName,
    generatedDateStr,
    completedDate
  } = context;

  const student = read(assessment, 'user', {}) || {};
  const userType = normalizeUserType(read(student, 'userType'));
  const userTypeLabel = USER_TYPE_LABELS[userType] || read(recommendations, 'audience')?.label || 'Test taker';
  const audienceFocus = read(recommendations, 'audience')?.focusMessage || 'Use these results as a guide for career and education planning.';
  const rawCode = read(assessment, 'hollandCodeDisplay') || read(assessment, 'hollandCode') || '';
  const codeGroups = parseDisplayGroups(rawCode);
  const scoreRows = scoreRowsFor(assessment);
  const sortedScores = [...scoreRows].sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const fallbackGroups = sortedScores.slice(0, 3).map((row) => [row.key]);
  const displayGroups = codeGroups.length ? codeGroups : fallbackGroups;
  const labelsText = displayGroups.map((group) => group.map((letter) => RIASEC_LABELS[letter]).join('/')).join(' - ');
  const topThemeGroups = displayGroups.slice(0, 3);
  const occupations = [];
  const seenOccupationNames = new Set();
  for (const occupation of recommendations.occupations || []) {
    const displayName = read(occupation, 'displayName') || makeDisplayName(read(occupation, 'name'));
    const displayDescription = read(occupation, 'displayDescription') || makeDisplayDescription(occupation, displayName);
    const dedupeKey = displayName.toLowerCase();
    if (seenOccupationNames.has(dedupeKey)) continue;
    seenOccupationNames.add(dedupeKey);
    if (typeof occupation.setDataValue === 'function') {
      occupation.setDataValue('displayName', displayName);
      occupation.setDataValue('displayDescription', displayDescription);
    } else {
      occupation.displayName = displayName;
      occupation.displayDescription = displayDescription;
    }
    occupations.push(occupation);
    if (occupations.length >= 6) break;
  }
  const courses = (recommendations.courses || []).slice(0, 5);
  const subjects = (recommendations.suggestedSubjects || []).slice(0, 12);
  const funding = recommendations.fundingAlignment || null;
  const m = PAGE.margin;
  const w = contentWidth();
  const totalPages = 4;

  let y = pageShell(
    doc,
    'CAREER ASSESSMENT REPORT',
    `Detailed personalized results - Generated: ${generatedDateStr}`,
    1,
    totalPages,
    { officialHeader: true }
  );
  const leftW = 252;
  const rightW = w - leftW - 16;
  card(doc, m, y, leftW, 126, { fill: '#fbfdff' });
  label(doc, 'PREPARED FOR', m + 14, y + 14, { color: COLORS.blue });
  textBlock(doc, studentName, m + 14, y + 29, leftW - 28, 20, { font: 'Helvetica-Bold', size: 12, color: COLORS.navy });
  drawInfoRow(doc, 'Profile', userTypeLabel, m + 14, y + 58, 110);
  drawInfoRow(doc, 'Completed', completedDate, m + 132, y + 58, 102);
  drawInfoRow(doc, 'Generated', generatedDateStr, m + 14, y + 91, 110);
  drawInfoRow(doc, 'Report ID', read(assessment, 'id'), m + 132, y + 91, 102);
  drawCodeCard(doc, displayGroups, labelsText, m + leftW + 16, y, rightW, 126);

  y += 148;
  drawScoreBars(doc, scoreRows, m, y, 228, 172);
  card(doc, m + 244, y, w - 244, 172, { fill: '#fbfdff' });
  label(doc, 'KEY INTERPRETATION', m + 258, y + 14, { color: COLORS.blue, width: w - 272 });
  textBlock(doc, audienceFocus, m + 258, y + 30, w - 272, 34, { size: 8.4, color: COLORS.muted });
  topThemeGroups.forEach((group, index) => {
    const letters = uniqueValues(group);
    const leadLetter = letters[0];
    const codeText = themeCode(letters);
    const labelText = themeLabel(letters);
    const summaryText = themeSummary(letters);
    const boxY = y + 72 + index * 31;
    doc.roundedRect(m + 258, boxY, 32, 24, 6).fill(RIASEC_COLORS[leadLetter] || COLORS.blue);
    doc.font('Helvetica-Bold').fontSize(codeText.length > 1 ? 8 : 9).fillColor(COLORS.white).text(codeText, m + 258, boxY + 7, { width: 32, align: 'center' });
    textBlock(doc, labelText, m + 298, boxY, 132, 12, { font: 'Helvetica-Bold', size: 8.4, color: COLORS.navy });
    textBlock(doc, summaryText, m + 298, boxY + 13, w - 312, 18, { size: 7.4, color: COLORS.muted });
  });

  y += 196;
  y = sectionTitle(doc, 'What this result is useful for', 'Use the result to focus your discussion, not to make final decisions automatically.', m, y);
  const useCards = [
    ['Career direction', 'Shortlist career environments that fit your interests and abilities.'],
    ['Study planning', 'Compare subjects, courses, entry requirements, and institutions.'],
    ['Counseling', 'Take this report to a counselor, teacher, parent, or mentor for planning.']
  ];
  const useW = (w - 20) / 3;
  useCards.forEach(([title, body], index) => {
    const x = m + index * (useW + 10);
    card(doc, x, y, useW, 80, { fill: index === 0 ? '#fefce8' : '#fbfdff' });
    textBlock(doc, title, x + 12, y + 14, useW - 24, 14, { font: 'Helvetica-Bold', size: 9, color: COLORS.navy });
    textBlock(doc, body, x + 12, y + 32, useW - 24, 36, { size: 7.8, color: COLORS.muted });
  });

  doc.addPage();
  y = pageShell(doc, 'PROFILE MEANING AND CAREER MATCHES', 'Top themes and occupations aligned to your SDS profile', 2, totalPages);
  y = sectionTitle(doc, 'Your strongest Holland themes', labelsText, m, y);
  const themeW = (w - 20) / 3;
  topThemeGroups.forEach((group, index) => {
    const letters = uniqueValues(group);
    const leadLetter = letters[0];
    const codeText = themeCode(letters);
    const labelText = themeLabel(letters);
    const strengthsText = uniqueValues(themeStrengths(letters)).slice(0, 4).join(' | ');
    const summaryText = themeSummary(letters);
    const x = m + index * (themeW + 10);
    card(doc, x, y, themeW, 118, { fill: '#fbfdff' });
    doc.roundedRect(x + 12, y + 12, 34, 30, 7).fill(RIASEC_COLORS[leadLetter] || COLORS.blue);
    doc.font('Helvetica-Bold').fontSize(codeText.length > 1 ? 10 : 13).fillColor(COLORS.white).text(codeText, x + 12, y + 19, { width: 34, align: 'center' });
    textBlock(doc, labelText, x + 54, y + 12, themeW - 66, 14, { font: 'Helvetica-Bold', size: 8.9, color: COLORS.navy });
    textBlock(doc, strengthsText, x + 54, y + 29, themeW - 66, 18, { size: 7.1, color: COLORS.blue, font: 'Helvetica-Bold' });
    textBlock(doc, summaryText, x + 12, y + 55, themeW - 24, 48, { size: 7.6, color: COLORS.muted });
  });

  y += 140;
  y = sectionTitle(doc, 'Recommended career paths', 'The report shows the highest-value matches only. Use them as a shortlist for investigation.', m, y);
  if (occupations.length) {
    const occW = (w - 12) / 2;
    occupations.forEach((occupation, index) => {
      const x = m + (index % 2) * (occW + 12);
      const rowY = y + Math.floor(index / 2) * 96;
      drawOccupationCard(doc, occupation, index, x, rowY, occW, 84);
    });
  } else {
    card(doc, m, y, w, 56, { fill: '#fbfdff' });
    textBlock(doc, 'No occupation matches are currently mapped for this profile. Review the Holland themes above with a counselor.', m + 14, y + 18, w - 28, 24, { color: COLORS.muted });
  }

  doc.addPage();
  y = pageShell(doc, 'STUDY, SUBJECTS AND FUNDING GUIDANCE', 'Course, subject, and priority-field information to support planning', 3, totalPages);
  y = sectionTitle(doc, userType === 'professional' ? 'Upskilling and qualification pathways' : 'Recommended study pathways', 'Confirm entry requirements and accreditation before applying.', m, y);
  if (courses.length) {
    courses.forEach((course, index) => {
      drawCourseCard(doc, course, index, m, y + index * 70, w, 60);
    });
    y += courses.length * 70 + 6;
  } else {
    card(doc, m, y, w, 54, { fill: '#fbfdff' });
    textBlock(doc, 'No course matches are currently linked to this profile. A counselor can help map the Holland code to accredited pathways.', m + 14, y + 17, w - 28, 22, { color: COLORS.muted });
    y += 68;
  }

  const leftBoxW = (w - 14) / 2;
  card(doc, m, y, leftBoxW, 128, { fill: '#fbfdff' });
  label(doc, userType === 'professional' ? 'LEARNING FOCUS' : 'SUBJECT FOCUS', m + 12, y + 12, { color: COLORS.blue });
  if (subjects.length) {
    drawPills(doc, subjects, m + 12, y + 32, leftBoxW - 24, 3);
  } else {
    textBlock(doc, 'Subject recommendations are not currently available for this result. Use your top Holland themes when discussing subjects with a counselor.', m + 12, y + 32, leftBoxW - 24, 62, { color: COLORS.muted, size: 8 });
  }
  textBlock(doc, userType === 'professional'
    ? 'For professionals, use this section to identify short courses, postgraduate options, or transitions that fit your current experience.'
    : 'For learners and students, subject choices should support both your interest profile and the entry requirements of your target pathway.',
  m + 12, y + 94, leftBoxW - 24, 24, { color: COLORS.muted, size: 7.4 });

  card(doc, m + leftBoxW + 14, y, leftBoxW, 128, { fill: '#fffdf0', stroke: '#eadf8b' });
  label(doc, 'FUNDING PRIORITY ALIGNMENT', m + leftBoxW + 26, y + 12, { color: COLORS.red, width: leftBoxW - 24 });
  const fundingOverall = funding ? clean(funding.overall, 'LOW').toUpperCase() : 'NOT AVAILABLE';
  doc.font('Helvetica-Bold').fontSize(15).fillColor(fundingOverall === 'HIGH' ? '#166534' : fundingOverall === 'MEDIUM' ? '#92400e' : COLORS.red)
    .text(fundingOverall, m + leftBoxW + 26, y + 31, { width: leftBoxW - 28, height: 20 });
  const priorityFields = funding?.fields || [];
  const fundingText = priorityFields.length
    ? `Priority field matches: ${priorityFields.slice(0, 3).map((field) => clean(field.field)).join(', ')}.`
    : clean(funding?.interpretation, 'Funding priority data is not available for this profile.');
  textBlock(doc, fundingText, m + leftBoxW + 26, y + 57, leftBoxW - 28, 54, { size: 7.8, color: COLORS.muted });

  doc.addPage();
  y = pageShell(doc, 'PERSONAL ACTION PLAN', 'Turn your SDS result into clear decisions and conversations', 4, totalPages);
  y = sectionTitle(doc, 'Recommended next steps', 'Complete these actions before making final study or career decisions.', m, y);
  const topOccNames = occupations.slice(0, 3).map((occ) => clean(read(occ, 'displayName') || makeDisplayName(read(occ, 'name')))).join(', ');
  const topCourseNames = courses.slice(0, 2).map((course) => clean(read(course, 'name'))).join(', ');
  const actions = [
    ['Review your code', `Focus on ${labelsText || 'your top Holland themes'} and note which descriptions feel accurate.`],
    ['Research career paths', topOccNames ? `Compare these career options: ${topOccNames}.` : 'Ask a counselor to help identify occupations related to your Holland code.'],
    ['Check study requirements', topCourseNames ? `Check entry requirements for ${topCourseNames}.` : 'Build a list of accredited courses and confirm entry requirements.'],
    ['Discuss funding', 'Check government priority fields, application dates, and alternative funding sources early.'],
    ['Make a short plan', 'Choose one primary path, one backup path, and one action to complete this week.']
  ];
  actions.forEach(([title, body], index) => {
    drawActionItem(doc, index + 1, title, body, m, y + index * 58, w, 48);
  });

  y += actions.length * 58 + 16;
  const halfW = (w - 14) / 2;
  card(doc, m, y, halfW, 142, { fill: '#fbfdff' });
  label(doc, 'COUNSELOR DISCUSSION GUIDE', m + 12, y + 12, { color: COLORS.blue, width: halfW - 24 });
  const questions = [
    'Which parts of my code describe me best?',
    'Which subjects or modules should I prioritize?',
    'What are the realistic entry requirements?',
    'Which careers should I shadow or research first?',
    'What funding deadlines apply?'
  ];
  questions.forEach((question, index) => {
    textBlock(doc, `${index + 1}. ${question}`, m + 12, y + 32 + index * 18, halfW - 24, 14, { size: 7.8, color: COLORS.text });
  });

  card(doc, m + halfW + 14, y, halfW, 142, { fill: '#fbfdff' });
  label(doc, 'IMPORTANT NOTE', m + halfW + 26, y + 12, { color: COLORS.red, width: halfW - 24 });
  textBlock(doc,
    'This report is career guidance material. It should be used with counselor support, institution prospectuses, current admission rules, and updated labour-market information before final decisions are made.',
    m + halfW + 26,
    y + 32,
    halfW - 28,
    62,
    { size: 8, color: COLORS.muted }
  );
  textBlock(doc,
    `Generated for ${studentName}. Assessment completed ${completedDate}. Keep this report with your school, study, or career planning records.`,
    m + halfW + 26,
    y + 102,
    halfW - 28,
    28,
    { size: 7.6, color: COLORS.text }
  );

  const pages = doc.bufferedPageRange();
  for (let pageIndex = 0; pageIndex < pages.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    const footerY = PAGE.height - 62;
    doc.moveTo(PAGE.margin, footerY - 9).lineTo(PAGE.margin + contentWidth(), footerY - 9)
      .strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(7.4).fillColor(COLORS.muted)
      .text('SDS Career Assessment System | Ministry of Labor: Measurement and Testing Unit', PAGE.margin, footerY, {
        width: contentWidth() * 0.68,
        align: 'left',
        lineBreak: false
      });
    doc.font('Helvetica-Bold').fontSize(7.6).fillColor(COLORS.blue)
      .text(`Page ${pageIndex + 1} of ${pages.count}`, PAGE.margin, footerY, {
        width: contentWidth(),
        align: 'right',
        lineBreak: false
      });
  }
};

module.exports = {
  renderResultsPdf
};
