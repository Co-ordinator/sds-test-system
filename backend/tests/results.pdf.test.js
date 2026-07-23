'use strict';

const PDFDocument = require('pdfkit');
const { Writable } = require('stream');
const {
  EXPECTED_RESULTS_PDF_PAGES,
  MINISTRY_PHYSICAL_ADDRESS,
  renderResultsPdf
} = require('../src/utils/resultsPdfRenderer');
const { OFFICIAL_PROGRAM_TITLE } = require('../src/constants/brand');
const { countPdfPages, extractPdfText } = require('./helpers/certificatePdfFixtures');

const longText = 'A detailed pathway requiring careful research, current entry requirement checks, practical experience, and discussion with a qualified career counselor.';

const renderFixture = () => new Promise((resolve, reject) => {
  const chunks = [];
  const output = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    }
  });
  output.once('finish', () => resolve(Buffer.concat(chunks)));
  output.once('error', reject);

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  doc.pipe(output);
  renderResultsPdf(doc, {
    assessment: {
      id: 'results-pdf-fixture-0001',
      status: 'completed',
      completedAt: '2026-07-10T10:00:00.000Z',
      scoreR: 31,
      scoreI: 42,
      scoreA: 37,
      scoreS: 28,
      scoreE: 24,
      scoreC: 19,
      hollandCode: 'IAR',
      hollandCodeDisplay: 'I A R/C',
      user: { userType: 'University Student' }
    },
    recommendations: {
      audience: { focusMessage: longText },
      occupations: Array.from({ length: 7 }, (_, index) => ({
        name: `Professional Career Option ${index + 1}`,
        code: 'IAR',
        localDemand: index % 2 ? 'high' : 'very_high',
        description: `${longText} ${longText}`
      })),
      courses: Array.from({ length: 6 }, (_, index) => ({
        name: `Accredited Study Pathway ${index + 1}`,
        qualificationType: 'bachelor',
        durationYears: 4,
        fundingPriority: index % 2 === 0,
        courseInstitutions: [{ institution: { name: 'University of Eswatini' } }],
        requirements: [{ subject: 'Mathematics', minimumGrade: 'C' }]
      })),
      suggestedSubjects: ['Mathematics', 'Physical Science', 'English', 'Information Technology'],
      fundingAlignment: {
        overall: 'Strong alignment',
        fields: [{ field: 'Information and Communication Technology' }]
      }
    },
    studentName: 'PDF Layout Verification Candidate',
    generatedDateStr: '11 July 2026',
    completedDate: '10 July 2026'
  });
  doc.end();
});

describe('test-taker results PDF', () => {
  test('renders exactly three content-filled pages with official ministry details', async () => {
    const pdf = await renderFixture();
    const text = extractPdfText(pdf);

    expect(countPdfPages(pdf)).toBe(EXPECTED_RESULTS_PDF_PAGES);
    expect(text).toContain(MINISTRY_PHYSICAL_ADDRESS);
    expect(text).toContain(OFFICIAL_PROGRAM_TITLE);
    expect(text).toContain('SELF-DIRECTED SEARCH CAREER ASSESSMENT REPORT');
    expect(text).toContain('Career and Study Pathways');
    expect(text).toContain('Profile Meaning and Action Plan');
    expect(text).toContain('Page 3 of 3');
    expect(text).not.toContain('Page 4');
    expect(text).not.toContain('NATIONAL EMPLOYMENT SERVICES DEPARTMENT');
    expect(text).not.toContain('MEASUREMENT AND TESTING UNIT');
  });
});
