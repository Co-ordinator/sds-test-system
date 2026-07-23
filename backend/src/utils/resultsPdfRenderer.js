'use strict';

const { drawLetterheadImage } = require('./pdfAssets');
const { makeDisplayName, makeDisplayDescription } = require('./occupationDisplay');
const { OFFICIAL_PROGRAM_TITLE } = require('../constants/brand');

const MINISTRY_PHYSICAL_ADDRESS = 'Ministry of Labour and Social Security, Inter-Ministerial Office Block, Mhlambanyatsi Road, Mbabane, Eswatini.';
const EXPECTED_RESULTS_PDF_PAGES = 3;

const RIASEC_LABELS = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional'
};

const RIASEC_SUMMARY = {
  R: 'Practical interests involving tools, equipment, nature, and hands-on problem solving.',
  I: 'Analytical interests involving research, science, mathematics, and investigation.',
  A: 'Creative interests involving design, language, performance, and original expression.',
  S: 'People-focused interests involving teaching, helping, advising, and community service.',
  E: 'Leadership interests involving persuasion, business, initiative, and managing activities.',
  C: 'Structured interests involving records, numbers, systems, accuracy, and organisation.'
};

const RIASEC_STRENGTHS = {
  R: ['practical work', 'technical tasks', 'physical problem solving'],
  I: ['analysis', 'research', 'scientific thinking'],
  A: ['creativity', 'communication', 'original ideas'],
  S: ['teaching', 'supporting others', 'advising people'],
  E: ['leadership', 'persuasion', 'business initiative'],
  C: ['accuracy', 'organisation', 'information handling']
};

const QUALIFICATION_LABELS = {
  certificate: 'Certificate',
  diploma: 'Diploma',
  bachelor: "Bachelor's degree",
  honours: 'Honours degree',
  postgrad_diploma: 'Postgraduate diploma',
  masters: "Master's degree",
  doctorate: 'Doctorate',
  short_course: 'Short course',
  tvet: 'TVET programme',
  other: 'Qualification'
};

const DEMAND_LABELS = {
  critical: 'Critical',
  very_high: 'Very high',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

const USER_TYPE_LABELS = {
  high_school_student: 'High school learner',
  university_student: 'Tertiary student',
  professional: 'Professional'
};

const COLORS = {
  navy: '#17324d',
  blue: '#2b5d7d',
  ink: '#202a33',
  muted: '#5f6b76',
  border: '#cbd3da',
  pale: '#f4f6f8',
  paleBlue: '#eef3f6',
  white: '#ffffff'
};

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 46,
  footerRuleY: 802,
  footerTextY: 812
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

const brief = (value, max = 140, fallback = 'Not available') => {
  const text = clean(value, fallback);
  if (text.length <= max) return text;
  const draft = text.slice(0, max - 1);
  const breakAt = draft.lastIndexOf(' ');
  return `${draft.slice(0, breakAt > max * 0.55 ? breakAt : max - 1).trim()}...`;
};

const unique = (values) => [...new Set((values || []).filter(Boolean))];

const normalizeUserType = (value) => {
  const raw = String(value || '').toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
  if (raw.includes('professional')) return 'professional';
  if (raw.includes('university') || raw.includes('tertiary') || raw === 'student') return 'university_student';
  return 'high_school_student';
};

const parseDisplayGroups = (code) => String(code || '')
  .toUpperCase()
  .trim()
  .split(/\s+/)
  .flatMap((group) => {
    const cleaned = group.replace(/[^RIASEC/]/g, '');
    if (!cleaned) return [];
    if (!cleaned.includes('/')) {
      return cleaned.split('').filter((letter) => RIASEC_LABELS[letter]).map((letter) => [letter]);
    }
    return [cleaned.split('/').filter((letter) => RIASEC_LABELS[letter])];
  })
  .filter((group) => group.length > 0)
  .slice(0, 3);

const scoreRowsFor = (assessment) => ['R', 'I', 'A', 'S', 'E', 'C'].map((key) => ({
  key,
  label: RIASEC_LABELS[key],
  score: Number(read(assessment, `score${key}`, 0) || 0)
}));

const themeCode = (group) => unique(group).join('/');
const themeLabel = (group) => unique(group).map((letter) => RIASEC_LABELS[letter]).filter(Boolean).join(' / ');
const themeSummary = (group) => unique(group).map((letter) => RIASEC_SUMMARY[letter]).filter(Boolean).join(' ');
const themeStrengths = (group) => unique(group).flatMap((letter) => RIASEC_STRENGTHS[letter] || []);

const setText = (doc, font = 'Helvetica', size = 8.5, color = COLORS.ink) => {
  doc.font(font).fontSize(size).fillColor(color);
};

const drawBoundedText = (doc, value, x, y, width, height, options = {}) => {
  setText(doc, options.font || 'Helvetica', options.size || 8.3, options.color || COLORS.ink);
  doc.text(clean(value, options.fallback || ''), x, y, {
    width,
    height,
    align: options.align || 'left',
    lineGap: options.lineGap ?? 1,
    ellipsis: options.ellipsis !== false
  });
};

const drawRule = (doc, x, y, width, color = COLORS.border, lineWidth = 0.6) => {
  doc.moveTo(x, y).lineTo(x + width, y).strokeColor(color).lineWidth(lineWidth).stroke();
};

const drawPhysicalAddress = (doc, x, y, width) => {
  let fontSize = 8.5;
  doc.font('Helvetica').fontSize(fontSize);
  while (fontSize > 7 && doc.widthOfString(MINISTRY_PHYSICAL_ADDRESS) > width) {
    fontSize -= 0.25;
    doc.fontSize(fontSize);
  }
  drawBoundedText(doc, MINISTRY_PHYSICAL_ADDRESS, x, y, width, 13, {
    size: fontSize,
    color: '#374151',
    align: 'center',
    ellipsis: false
  });
  return y + 14;
};

const drawFirstPageHeader = (doc, generatedDateStr) => {
  const margin = PAGE.margin;
  const width = contentWidth();
  const letterhead = drawLetterheadImage(doc, {
    x: 0,
    y: 18,
    width: PAGE.width,
    maxHeight: 118
  });
  const addressY = (letterhead ? letterhead.bottom : 132) + 2;
  const addressBottom = drawPhysicalAddress(doc, margin, addressY, width);
  const ruleY = Math.max(addressBottom + 3, 153);
  drawRule(doc, margin, ruleY, width, COLORS.navy, 0.8);

  drawBoundedText(doc, OFFICIAL_PROGRAM_TITLE, margin, ruleY + 10, width, 12, {
    font: 'Helvetica-Bold', size: 8.8, color: COLORS.navy, align: 'center'
  });
  drawBoundedText(doc, 'SELF-DIRECTED SEARCH CAREER ASSESSMENT REPORT', margin, ruleY + 32, width, 18, {
    font: 'Helvetica-Bold', size: 13, color: COLORS.ink, align: 'center'
  });
  drawBoundedText(doc, `Official results summary | Generated ${generatedDateStr}`, margin, ruleY + 52, width, 12, {
    size: 8, color: COLORS.muted, align: 'center'
  });
  return ruleY + 74;
};

const drawContinuationHeader = (doc, title, subtitle, pageNumber) => {
  const margin = PAGE.margin;
  const width = contentWidth();
  doc.rect(0, 0, PAGE.width, 4).fill(COLORS.navy);
  drawBoundedText(doc, 'MINISTRY OF LABOUR AND SOCIAL SECURITY', margin, 24, width * 0.72, 12, {
    font: 'Helvetica-Bold', size: 8, color: COLORS.navy
  });
  drawBoundedText(doc, title, margin, 39, width * 0.72, 16, {
    font: 'Helvetica-Bold', size: 11.5, color: COLORS.ink
  });
  drawBoundedText(doc, subtitle, margin, 56, width * 0.78, 12, {
    size: 7.8, color: COLORS.muted
  });
  drawBoundedText(doc, `PAGE ${pageNumber} OF ${EXPECTED_RESULTS_PDF_PAGES}`, margin, 29, width, 12, {
    font: 'Helvetica-Bold', size: 7.5, color: COLORS.blue, align: 'right'
  });
  drawRule(doc, margin, 73, width);
  return 86;
};

const drawSectionTitle = (doc, title, subtitle, x, y, width = contentWidth()) => {
  drawBoundedText(doc, title.toUpperCase(), x, y, width, 14, {
    font: 'Helvetica-Bold', size: 9.2, color: COLORS.navy
  });
  drawRule(doc, x, y + 16, width, COLORS.border);
  if (subtitle) {
    drawBoundedText(doc, subtitle, x, y + 22, width, 22, { size: 7.7, color: COLORS.muted });
    return y + 48;
  }
  return y + 25;
};

const drawProfileGrid = (doc, items, x, y, width) => {
  const height = 72;
  const columns = 3;
  const cellWidth = width / columns;
  doc.rect(x, y, width, height).fillAndStroke(COLORS.white, COLORS.border);
  items.slice(0, 6).forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellX = x + column * cellWidth;
    const cellY = y + row * 36;
    if (column > 0) doc.moveTo(cellX, cellY).lineTo(cellX, cellY + 36).strokeColor(COLORS.border).lineWidth(0.4).stroke();
    if (row > 0) drawRule(doc, cellX, cellY, cellWidth, COLORS.border, 0.4);
    drawBoundedText(doc, item.label.toUpperCase(), cellX + 9, cellY + 7, cellWidth - 18, 9, {
      font: 'Helvetica-Bold', size: 6.8, color: COLORS.muted
    });
    drawBoundedText(doc, item.value, cellX + 9, cellY + 18, cellWidth - 18, 14, {
      font: 'Helvetica-Bold', size: 8.2, color: COLORS.ink
    });
  });
  return y + height;
};

const drawCodeSummary = (doc, code, labels, audienceFocus, x, y, width) => {
  const height = 78;
  const codeWidth = 134;
  doc.rect(x, y, width, height).fillAndStroke(COLORS.paleBlue, COLORS.border);
  drawBoundedText(doc, 'HOLLAND CODE', x + 14, y + 12, codeWidth - 28, 10, {
    font: 'Helvetica-Bold', size: 7, color: COLORS.muted, align: 'center'
  });
  drawBoundedText(doc, code, x + 14, y + 28, codeWidth - 28, 30, {
    font: 'Helvetica-Bold', size: 21, color: COLORS.navy, align: 'center'
  });
  doc.moveTo(x + codeWidth, y + 11).lineTo(x + codeWidth, y + height - 11).strokeColor(COLORS.border).lineWidth(0.6).stroke();
  drawBoundedText(doc, labels, x + codeWidth + 14, y + 12, width - codeWidth - 28, 17, {
    font: 'Helvetica-Bold', size: 9.2, color: COLORS.ink
  });
  drawBoundedText(doc, audienceFocus, x + codeWidth + 14, y + 34, width - codeWidth - 28, 32, {
    size: 8.1, color: COLORS.muted, lineGap: 1.1
  });
  return y + height;
};

const drawScoreProfile = (doc, scoreRows, x, y, width) => {
  const sorted = [...scoreRows].sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const maxScore = Math.max(...sorted.map((row) => row.score), 1);
  const labelWidth = 106;
  const scoreWidth = 35;
  const barWidth = width - labelWidth - scoreWidth - 18;
  sorted.forEach((row, index) => {
    const rowY = y + index * 29;
    drawBoundedText(doc, `${row.key}  ${row.label}`, x, rowY + 4, labelWidth, 13, {
      font: index < 3 ? 'Helvetica-Bold' : 'Helvetica',
      size: 8.1,
      color: COLORS.ink
    });
    doc.rect(x + labelWidth, rowY + 7, barWidth, 8).fill(COLORS.pale);
    const fillWidth = Math.max(2, barWidth * (row.score / maxScore));
    doc.rect(x + labelWidth, rowY + 7, fillWidth, 8).fill(index < 3 ? COLORS.navy : COLORS.blue);
    drawBoundedText(doc, String(row.score), x + width - scoreWidth, rowY + 3, scoreWidth, 14, {
      font: 'Helvetica-Bold', size: 8.2, color: COLORS.ink, align: 'right'
    });
    drawRule(doc, x, rowY + 24, width, COLORS.pale, 0.4);
  });
  return y + sorted.length * 29;
};

const drawFixedTable = (doc, { x, y, width, columns, rows, rowHeight, emptyMessage }) => {
  const headerHeight = 23;
  doc.rect(x, y, width, headerHeight).fillAndStroke(COLORS.navy, COLORS.navy);
  let columnX = x;
  columns.forEach((column) => {
    drawBoundedText(doc, column.label, columnX + 6, y + 7, column.width - 12, 10, {
      font: 'Helvetica-Bold', size: 7, color: COLORS.white,
      align: column.align || 'left'
    });
    columnX += column.width;
  });

  const displayRows = rows.length ? rows : [{ __empty: emptyMessage || 'No information is currently available.' }];
  displayRows.forEach((row, index) => {
    const rowY = y + headerHeight + index * rowHeight;
    doc.rect(x, rowY, width, rowHeight).fillAndStroke(index % 2 === 0 ? COLORS.white : COLORS.pale, COLORS.border);
    if (row.__empty) {
      drawBoundedText(doc, row.__empty, x + 9, rowY + 10, width - 18, rowHeight - 18, {
        size: 8.2, color: COLORS.muted
      });
      return;
    }
    let cellX = x;
    columns.forEach((column) => {
      drawBoundedText(doc, row[column.key] ?? '', cellX + 6, rowY + 7, column.width - 12, rowHeight - 13, {
        font: column.font || 'Helvetica',
        size: column.size || 7.5,
        color: column.color || COLORS.ink,
        align: column.align || 'left',
        lineGap: 0.8
      });
      cellX += column.width;
    });
  });
  return y + headerHeight + displayRows.length * rowHeight;
};

const normalizeOccupations = (recommendations) => {
  const output = [];
  const seen = new Set();
  for (const occupation of recommendations.occupations || []) {
    const displayName = read(occupation, 'displayName') || makeDisplayName(read(occupation, 'name'));
    const key = clean(displayName, '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push({
      name: displayName,
      code: (() => {
        const codes = read(occupation, 'hollandCodes', []);
        if (Array.isArray(codes) && codes.length) return codes.slice(0, 2).join(', ');
        return clean(read(occupation, 'code') || read(occupation, 'primaryRiasec'), 'RIASEC');
      })(),
      demand: (() => {
        const demand = read(occupation, 'localDemand') || read(occupation, 'demandLevel');
        return demand ? DEMAND_LABELS[demand] || clean(demand) : 'Not listed';
      })(),
      description: brief(
        read(occupation, 'displayDescription') || makeDisplayDescription(occupation, displayName),
        145
      )
    });
    if (output.length >= 5) break;
  }
  return output;
};

const normalizeCourses = (recommendations) => (recommendations.courses || []).slice(0, 4).map((course) => {
  const institutions = (read(course, 'courseInstitutions', []) || [])
    .map((entry) => read(entry, 'institution'))
    .filter(Boolean)
    .map((institution) => clean(read(institution, 'name'), 'Institution'))
    .slice(0, 2);
  const requirements = (read(course, 'requirements', []) || []).slice(0, 2).map((requirement) => (
    `${clean(read(requirement, 'subject'), 'Subject')}: ${clean(read(requirement, 'minimumGrade'), 'required grade')}`
  ));
  const duration = read(course, 'durationYears') ? `${read(course, 'durationYears')} year(s)` : 'Duration varies';
  const notes = [
    institutions.length ? institutions.join(', ') : 'Confirm institution availability',
    requirements.length ? `Entry: ${requirements.join('; ')}` : 'Confirm current entry requirements'
  ].join(' | ');
  return {
    pathway: clean(read(course, 'name'), 'Study pathway'),
    qualification: `${QUALIFICATION_LABELS[String(read(course, 'qualificationType') || '').toLowerCase()] || clean(read(course, 'qualificationType'), 'Qualification')} | ${duration}`,
    funding: read(course, 'fundingPriority') ? 'Priority field' : 'General',
    notes: brief(notes, 155)
  };
});

const drawInfoPanel = (doc, title, body, x, y, width, height) => {
  doc.rect(x, y, width, height).fillAndStroke(COLORS.pale, COLORS.border);
  drawBoundedText(doc, title.toUpperCase(), x + 11, y + 10, width - 22, 12, {
    font: 'Helvetica-Bold', size: 7.4, color: COLORS.navy
  });
  drawBoundedText(doc, body, x + 11, y + 29, width - 22, height - 39, {
    size: 8, color: COLORS.ink, lineGap: 1.1
  });
};

const drawActionSteps = (doc, steps, x, y, width) => {
  const rowHeight = 43;
  steps.slice(0, 5).forEach((step, index) => {
    const rowY = y + index * rowHeight;
    doc.circle(x + 13, rowY + 15, 10).fill(COLORS.navy);
    drawBoundedText(doc, String(index + 1), x + 6, rowY + 9, 14, 12, {
      font: 'Helvetica-Bold', size: 8, color: COLORS.white, align: 'center'
    });
    drawBoundedText(doc, step.title, x + 31, rowY + 4, width - 31, 13, {
      font: 'Helvetica-Bold', size: 8.5, color: COLORS.ink
    });
    drawBoundedText(doc, step.body, x + 31, rowY + 18, width - 31, 20, {
      size: 7.7, color: COLORS.muted
    });
    drawRule(doc, x + 31, rowY + 40, width - 31, COLORS.pale, 0.4);
  });
  return y + steps.slice(0, 5).length * rowHeight;
};

const drawFooters = (doc) => {
  const range = doc.bufferedPageRange();
  if (range.count !== EXPECTED_RESULTS_PDF_PAGES) {
    throw new Error(`Results PDF must contain exactly ${EXPECTED_RESULTS_PDF_PAGES} pages; rendered ${range.count}.`);
  }

  for (let pageIndex = 0; pageIndex < range.count; pageIndex += 1) {
    doc.switchToPage(range.start + pageIndex);
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    drawRule(doc, PAGE.margin, PAGE.footerRuleY, contentWidth(), COLORS.border, 0.5);
    drawBoundedText(
      doc,
      `SDS Career Assessment System | ${OFFICIAL_PROGRAM_TITLE}`,
      PAGE.margin,
      PAGE.footerTextY,
      contentWidth() * 0.78,
      10,
      { size: 7, color: COLORS.muted, ellipsis: false }
    );
    drawBoundedText(doc, `Page ${pageIndex + 1} of ${range.count}`, PAGE.margin, PAGE.footerTextY, contentWidth(), 10, {
      font: 'Helvetica-Bold', size: 7, color: COLORS.navy, align: 'right', ellipsis: false
    });
    doc.page.margins.bottom = originalBottomMargin;
  }
};

const renderResultsPdf = (doc, context) => {
  const {
    assessment,
    recommendations = {},
    studentName,
    generatedDateStr,
    completedDate
  } = context;

  const margin = PAGE.margin;
  const width = contentWidth();
  const student = read(assessment, 'user', {}) || {};
  const userType = normalizeUserType(read(student, 'userType'));
  const userTypeLabel = USER_TYPE_LABELS[userType] || 'Test taker';
  const rawCode = read(assessment, 'hollandCodeDisplay') || read(assessment, 'hollandCode') || '';
  const scoreRows = scoreRowsFor(assessment);
  const sortedScores = [...scoreRows].sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const displayGroups = parseDisplayGroups(rawCode).length
    ? parseDisplayGroups(rawCode)
    : sortedScores.slice(0, 3).map((row) => [row.key]);
  const displayCode = displayGroups.map(themeCode).join(' ') || clean(rawCode);
  const labelsText = displayGroups.map(themeLabel).join(' - ');
  const audienceFocus = read(recommendations, 'audience')?.focusMessage
    || 'Use these results as structured guidance for career and education planning.';
  const occupations = normalizeOccupations(recommendations);
  const courses = normalizeCourses(recommendations);
  const subjects = (recommendations.suggestedSubjects || []).slice(0, 8).map((subject) => clean(subject));
  const funding = recommendations.fundingAlignment || null;

  // Page 1: official summary and score profile.
  let y = drawFirstPageHeader(doc, generatedDateStr);
  y = drawProfileGrid(doc, [
    { label: 'Prepared for', value: studentName },
    { label: 'Profile group', value: userTypeLabel },
    { label: 'Assessment status', value: 'Completed' },
    { label: 'Completed', value: completedDate },
    { label: 'Generated', value: generatedDateStr },
    { label: 'Report reference', value: clean(read(assessment, 'id')).slice(0, 13).toUpperCase() }
  ], margin, y, width) + 12;
  y = drawCodeSummary(doc, displayCode, labelsText, audienceFocus, margin, y, width) + 14;
  y = drawSectionTitle(doc, 'What your result means', null, margin, y);
  doc.rect(margin, y, width, 55).fillAndStroke(COLORS.white, COLORS.border);
  drawBoundedText(
    doc,
    `Your Holland Code summarises the strongest patterns in your interests and self-reported abilities. Codes separated by a slash are tied and should be considered together. The result supports informed discussion; it does not make a career decision for you.`,
    margin + 11,
    y + 10,
    width - 22,
    37,
    { size: 8.2, color: COLORS.ink, lineGap: 1.2 }
  );
  y += 70;
  y = drawSectionTitle(doc, 'RIASEC score profile', 'Themes are ranked by score. Similar scores should be discussed together.', margin, y);
  y = drawScoreProfile(doc, scoreRows, margin, y, width) + 8;
  drawInfoPanel(
    doc,
    'Using this report',
    'Review these findings with a counselor and alongside current requirements, finances, and qualifications.',
    margin,
    y,
    width,
    50
  );

  // Page 2: career and study options.
  doc.addPage();
  y = drawContinuationHeader(
    doc,
    'Career and Study Pathways',
    'A concise shortlist for further research and professional guidance',
    2
  );
  y = drawSectionTitle(
    doc,
    'Recommended career options',
    'Investigate the day-to-day work, training route, working conditions, and local opportunities for each option.',
    margin,
    y
  );
  y = drawFixedTable(doc, {
    x: margin,
    y,
    width,
    rowHeight: 54,
    columns: [
      { key: 'number', label: '#', width: 25, align: 'center', font: 'Helvetica-Bold' },
      { key: 'name', label: 'Career option', width: 132, font: 'Helvetica-Bold', size: 7.7 },
      { key: 'code', label: 'Code', width: 60, align: 'center' },
      { key: 'description', label: 'Why it may fit', width: 209 },
      { key: 'demand', label: 'Demand', width: width - 426 }
    ],
    rows: occupations.map((occupation, index) => ({ number: index + 1, ...occupation })),
    emptyMessage: 'No occupation matches are currently mapped for this profile. Ask a counselor to interpret the Holland themes.'
  }) + 16;
  y = drawSectionTitle(
    doc,
    userType === 'professional' ? 'Learning and qualification pathways' : 'Recommended study pathways',
    'Confirm accreditation, current entry requirements, availability, and application dates before applying.',
    margin,
    y
  );
  y = drawFixedTable(doc, {
    x: margin,
    y,
    width,
    rowHeight: 58,
    columns: [
      { key: 'pathway', label: 'Pathway', width: 142, font: 'Helvetica-Bold', size: 7.7 },
      { key: 'qualification', label: 'Qualification', width: 102 },
      { key: 'funding', label: 'Funding', width: 67 },
      { key: 'notes', label: 'Institution and entry notes', width: width - 311 }
    ],
    rows: courses,
    emptyMessage: 'No linked study pathways are currently available. Use the Holland themes to discuss accredited options with a counselor.'
  }) + 12;
  drawInfoPanel(
    doc,
    'Important',
    'Guidance only. Confirm requirements with the relevant institution, employer, or professional body.',
    margin,
    y,
    width,
    54
  );

  // Page 3: profile detail and action plan.
  doc.addPage();
  y = drawContinuationHeader(
    doc,
    'Profile Meaning and Action Plan',
    'Your strongest themes, planning considerations, and practical next steps',
    3
  );
  y = drawSectionTitle(doc, 'Strongest Holland themes', labelsText, margin, y);
  const scoreMap = Object.fromEntries(scoreRows.map((row) => [row.key, row.score]));
  y = drawFixedTable(doc, {
    x: margin,
    y,
    width,
    rowHeight: 70,
    columns: [
      { key: 'code', label: 'Code', width: 54, align: 'center', font: 'Helvetica-Bold' },
      { key: 'theme', label: 'Theme', width: 104, font: 'Helvetica-Bold' },
      { key: 'score', label: 'Score', width: 50, align: 'center' },
      { key: 'strengths', label: 'Likely strengths', width: 135 },
      { key: 'meaning', label: 'Interpretation', width: width - 343 }
    ],
    rows: displayGroups.slice(0, 3).map((group) => ({
      code: themeCode(group),
      theme: themeLabel(group),
      score: unique(group).map((letter) => scoreMap[letter]).join(' / '),
      strengths: unique(themeStrengths(group)).slice(0, 5).join(', '),
      meaning: themeSummary(group)
    }))
  }) + 16;

  const gap = 14;
  const half = (width - gap) / 2;
  const focusTitle = userType === 'professional' ? 'Learning focus' : 'Subject focus';
  const focusText = subjects.length
    ? subjects.join(', ')
    : 'No specific subject list is available. Use the top Holland themes when reviewing subjects or learning priorities.';
  const fundingFields = funding?.fields || [];
  const fundingText = funding
    ? `${clean(funding.overall, 'Alignment not rated')}. ${fundingFields.length
      ? `Priority matches: ${fundingFields.slice(0, 4).map((field) => clean(field.field)).join(', ')}.`
      : clean(funding.interpretation, 'Confirm current funding priorities and application dates.')}`
    : 'Funding alignment is not currently available. Confirm current priority fields, deadlines, and alternative funding sources.';
  drawInfoPanel(doc, focusTitle, focusText, margin, y, half, 96);
  drawInfoPanel(doc, 'Funding priority alignment', fundingText, margin + half + gap, y, half, 96);
  y += 112;

  y = drawSectionTitle(doc, 'Recommended next steps', null, margin, y);
  const topCareerNames = occupations.slice(0, 3).map((occupation) => occupation.name).join(', ');
  const topCourseNames = courses.slice(0, 2).map((course) => course.pathway).join(', ');
  y = drawActionSteps(doc, [
    { title: 'Review your profile', body: `Identify which parts of ${labelsText || 'your Holland themes'} describe you most accurately.` },
    { title: 'Research career options', body: topCareerNames ? `Compare ${topCareerNames}.` : 'Build a shortlist of occupations related to your strongest themes.' },
    { title: 'Check learning requirements', body: topCourseNames ? `Confirm current requirements for ${topCourseNames}.` : 'Identify accredited pathways and confirm current entry requirements.' },
    { title: 'Discuss your choices', body: 'Review the shortlist with a counselor, teacher, mentor, parent, or relevant professional.' },
    { title: 'Record a practical plan', body: 'Choose one primary path, one alternative, and one action to complete this week.' }
  ], margin, y, width) + 6;

  drawInfoPanel(
    doc,
    'Guidance note',
    'Use current prospectuses, labour-market information, and qualified counseling before final decisions.',
    margin,
    y,
    width,
    52
  );

  drawFooters(doc);
};

module.exports = {
  EXPECTED_RESULTS_PDF_PAGES,
  MINISTRY_PHYSICAL_ADDRESS,
  renderResultsPdf
};
