'use strict';

jest.mock('../src/models', () => ({
  AuditLog: {
    create: jest.fn(),
    update: jest.fn()
  },
  sequelize: {
    col: jest.fn(),
    fn: jest.fn()
  }
}));

jest.mock('../src/services/certificate.service', () => ({}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

const { buildSummaryCertificatePdf } = require('../src/controllers/certificate.controller');
const {
  CERTIFICATE_FIXTURES,
  MINISTRY_ADDRESS,
  countPdfPages,
  extractPdfText,
  renderCertificateFixture,
  writeFixturePdf
} = require('./helpers/certificatePdfFixtures');

describe('summary certificate PDF fixtures', () => {
  const renderedFixtures = new Map();

  beforeAll(async () => {
    expect(typeof buildSummaryCertificatePdf).toBe('function');

    for (const fixture of CERTIFICATE_FIXTURES) {
      const pdfBuffer = await renderCertificateFixture(buildSummaryCertificatePdf, fixture);
      renderedFixtures.set(fixture.slug, {
        pdfBuffer,
        text: extractPdfText(pdfBuffer)
      });

      if (process.env.KEEP_CERTIFICATE_FIXTURES === '1') {
        await writeFixturePdf(fixture, pdfBuffer);
      }
    }
  }, 60_000);

  test.each(CERTIFICATE_FIXTURES)('$slug renders one nonempty A4 PDF page', (fixture) => {
    const { pdfBuffer } = renderedFixtures.get(fixture.slug);

    expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pdfBuffer.length).toBeGreaterThan(10_000);
    expect(pdfBuffer.toString('latin1')).toContain('%%EOF');
    expect(countPdfPages(pdfBuffer)).toBe(1);
  });

  test.each(CERTIFICATE_FIXTURES)('$slug renders role-aware recipient text', (fixture) => {
    const { text } = renderedFixtures.get(fixture.slug);
    const normalizedText = text.toLocaleLowerCase('en-ZA');

    [
      MINISTRY_ADDRESS,
      'PRE-SERVICE TERTIARY EDUCATION & TRAINING',
      'SELF-DIRECTED SEARCH (SDS) SUMMARY SHEET CERTIFICATE',
      'YOUR SDS CODE',
      ...fixture.expectedText
    ].forEach((expected) => {
      expect(normalizedText).toContain(expected.toLocaleLowerCase('en-ZA'));
    });

    fixture.excludedText.forEach((excluded) => {
      expect(normalizedText).not.toContain(excluded.toLocaleLowerCase('en-ZA'));
    });

    expect(normalizedText).not.toContain('national employment services department');
    expect(normalizedText).not.toContain('measurement and testing unit');
  });
});
