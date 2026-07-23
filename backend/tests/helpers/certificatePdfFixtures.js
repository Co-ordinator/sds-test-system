'use strict';

const fs = require('fs/promises');
const path = require('path');
const { Writable } = require('stream');
const zlib = require('zlib');

const MINISTRY_ADDRESS = 'Ministry of Labour and Social Security, Inter-Ministerial Office Block, Mhlambanyatsi Road, Mbabane, Eswatini.';
const TMP_PDF_DIR = path.resolve(__dirname, '../../../tmp/pdfs');

const SECTION_SCORES = Object.freeze({
  activities: Object.freeze({ R: 8, I: 11, A: 10, S: 7, E: 6, C: 5 }),
  competencies: Object.freeze({ R: 9, I: 12, A: 9, S: 8, E: 7, C: 4 }),
  occupations: Object.freeze({ R: 7, I: 10, A: 11, S: 6, E: 5, C: 4 }),
  self_estimates: Object.freeze({ R: 7, I: 9, A: 7, S: 7, E: 6, C: 6 })
});

const baseAssessment = (user) => ({
  id: `fixture-${String(user.userType || 'test-taker').toLowerCase().replace(/\s+/g, '-')}`,
  status: 'completed',
  completedAt: '2026-07-01T10:30:00.000Z',
  scoreR: 31,
  scoreI: 42,
  scoreA: 37,
  scoreS: 28,
  scoreE: 24,
  scoreC: 19,
  hollandCode: 'IAR',
  certificateProfileSnapshot: null,
  user
});

const CERTIFICATE_FIXTURES = Object.freeze([
  Object.freeze({
    slug: 'high-school-student',
    assessment: baseAssessment({
      firstName: 'Lindiwe',
      lastName: 'Dlamini',
      nationalId: '0101011100223',
      studentCode: 'SDS-HS-0001',
      userType: 'High School Student',
      currentInstitution: 'Stale Scalar High School',
      region: 'hhohho',
      district: 'Mbabane',
      gradeLevel: 'Form 5',
      institution: {
        name: 'Mbabane Central High School',
        region: 'hhohho',
        district: 'Mbabane'
      }
    }),
    expectedText: [
      'LINDIWE DLAMINI',
      'PIN: 0101011100223',
      'at MBABANE CENTRAL HIGH SCHOOL, located in the HHOHHO Region.'
    ],
    excludedText: ['STALE SCALAR HIGH SCHOOL']
  }),
  Object.freeze({
    slug: 'university-student',
    assessment: baseAssessment({
      firstName: 'Thabiso',
      lastName: 'Maseko',
      nationalId: '0202022200334',
      studentCode: 'SDS-UNI-0001',
      userType: 'University Student',
      currentInstitution: 'Stale Scalar University',
      region: 'manzini',
      district: 'Kwaluseni',
      degreeProgram: 'Bachelor of Science in Information Technology',
      yearOfStudy: 3,
      institution: {
        name: 'University of Eswatini',
        region: 'manzini',
        district: 'Kwaluseni'
      }
    }),
    expectedText: [
      'THABISO MASEKO',
      'PIN: 0202022200334',
      'while registered at UNIVERSITY OF ESWATINI, located in the MANZINI Region.'
    ],
    excludedText: ['STALE SCALAR UNIVERSITY']
  }),
  Object.freeze({
    slug: 'professional-complete',
    assessment: baseAssessment({
      firstName: 'Nomsa',
      lastName: 'Simelane',
      nationalId: '0303033300445',
      studentCode: 'SDS-PRO-0001',
      userType: 'Professional',
      currentInstitution: 'Professional Current Institution Must Not Appear',
      workplaceName: 'Stale Scalar Workplace',
      currentOccupation: 'Stale Scalar Occupation',
      yearsExperience: 6,
      region: 'hhohho',
      district: 'Mbabane',
      workplace: {
        name: 'Datamatics Eswatini',
        region: 'hhohho',
        district: 'Mbabane'
      },
      occupation: {
        name: 'Software Developer'
      }
    }),
    expectedText: [
      'NOMSA SIMELANE',
      'PIN: 0303033300445',
      'as a Professional working as SOFTWARE DEVELOPER at DATAMATICS ESWATINI, based in MBABANE, HHOHHO Region.'
    ],
    excludedText: [
      'PROFESSIONAL CURRENT INSTITUTION MUST NOT APPEAR',
      'STALE SCALAR WORKPLACE',
      'STALE SCALAR OCCUPATION'
    ]
  }),
  Object.freeze({
    slug: 'professional-snapshot',
    assessment: {
      ...baseAssessment({
        firstName: 'Snapshot',
        lastName: 'Candidate',
        nationalId: '0404044400556',
        userType: 'High School Student',
        currentInstitution: 'New School Must Not Appear',
        workplaceName: 'New Workplace Must Not Appear',
        currentOccupation: 'New Occupation Must Not Appear',
        district: 'New District',
        region: 'manzini'
      }),
      certificateProfileSnapshot: {
        userType: 'Professional',
        institutionName: null,
        workplaceName: 'Original Employer',
        occupationName: 'Civil Engineer',
        district: 'Lobamba',
        region: 'hhohho'
      }
    },
    expectedText: [
      'SNAPSHOT CANDIDATE',
      'PIN: 0404044400556',
      'as a Professional working as CIVIL ENGINEER at ORIGINAL EMPLOYER, based in LOBAMBA, HHOHHO Region.'
    ],
    excludedText: [
      'NEW SCHOOL MUST NOT APPEAR',
      'NEW WORKPLACE MUST NOT APPEAR',
      'NEW OCCUPATION MUST NOT APPEAR',
      'NEW DISTRICT',
      'MANZINI Region'
    ]
  }),
  Object.freeze({
    slug: 'professional-legacy',
    assessment: baseAssessment({
      firstName: 'Sibusiso',
      lastName: 'Nkambule',
      studentCode: 'SDS-LEGACY-0001',
      userType: 'Professional',
      currentInstitution: 'Legacy Institution Must Not Appear'
    }),
    expectedText: [
      'SIBUSISO NKAMBULE',
      'PIN: SDS-LEGACY-0001',
      'as a Professional.'
    ],
    excludedText: [
      'LEGACY INSTITUTION MUST NOT APPEAR',
      'NOT SPECIFIED'
    ]
  })
]);

const renderCertificateFixture = (renderer, fixture) => new Promise((resolve, reject) => {
  const chunks = [];
  const output = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    }
  });

  output.once('finish', () => resolve(Buffer.concat(chunks)));
  output.once('error', reject);

  Promise.resolve(renderer(
    output,
    fixture.assessment,
    SECTION_SCORES,
    ['I', 'A', 'R'],
    `SDS/FIXTURE/2026/${fixture.slug.toUpperCase()}`,
    '10 July 2026'
  )).catch(reject);
});

const countPdfPages = (pdfBuffer) => {
  const matches = pdfBuffer.toString('latin1').match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
};

const decodeLiteralString = (value) => value
  .replace(/\\([nrtbf()\\])/g, (match, escaped) => ({
    n: '\n',
    r: '\r',
    t: '\t',
    b: '\b',
    f: '\f',
    '(': '(',
    ')': ')',
    '\\': '\\'
  })[escaped])
  .replace(/\\([0-7]{1,3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)));

const decodeTextOperand = (operand) => {
  const parts = [];
  const tokenPattern = /<([0-9a-fA-F\s]+)>|\(((?:\\.|[^\\)])*)\)/g;
  let token;

  while ((token = tokenPattern.exec(operand))) {
    if (token[1] !== undefined) {
      parts.push(Buffer.from(token[1].replace(/\s+/g, ''), 'hex').toString('latin1'));
    } else {
      parts.push(decodeLiteralString(token[2]));
    }
  }

  return parts.join('');
};

const extractTextFromContentStream = (content) => {
  const text = [];
  const textBlockPattern = /BT([\s\S]*?)ET/g;
  let textBlock;

  while ((textBlock = textBlockPattern.exec(content))) {
    const operationPattern = /(\[[\s\S]*?\]|<[0-9a-fA-F\s]+>|\((?:\\.|[^\\)])*\))\s*T[Jj]/g;
    let operation;
    while ((operation = operationPattern.exec(textBlock[1]))) {
      text.push(decodeTextOperand(operation[1]));
    }
  }

  return text.join('\n');
};

const extractPdfText = (pdfBuffer) => {
  const source = pdfBuffer.toString('latin1');
  const streamPattern = /stream\r?\n/g;
  const extracted = [];
  let stream;

  while ((stream = streamPattern.exec(source))) {
    const streamEnd = source.indexOf('endstream', stream.index + stream[0].length);
    if (streamEnd < 0) break;

    const dictionaryStart = Math.max(source.lastIndexOf('endobj', stream.index) + 6, stream.index - 2048, 0);
    const dictionary = source.slice(dictionaryStart, stream.index);
    streamPattern.lastIndex = streamEnd + 'endstream'.length;

    if (/\/Subtype\s*\/Image\b/.test(dictionary)) continue;

    let bytes = pdfBuffer.subarray(stream.index + stream[0].length, streamEnd);
    while (bytes.length && (bytes[bytes.length - 1] === 10 || bytes[bytes.length - 1] === 13)) {
      bytes = bytes.subarray(0, bytes.length - 1);
    }

    if (/\/FlateDecode\b/.test(dictionary)) {
      try {
        bytes = zlib.inflateSync(bytes);
      } catch (_) {
        continue;
      }
    }

    const content = bytes.toString('latin1');
    if (content.includes('BT')) extracted.push(extractTextFromContentStream(content));
  }

  return extracted.join('\n').replace(/\s+/g, ' ').trim();
};

const writeFixturePdf = async (fixture, pdfBuffer) => {
  await fs.mkdir(TMP_PDF_DIR, { recursive: true });
  const outputPath = path.join(TMP_PDF_DIR, `certificate-${fixture.slug}.pdf`);
  await fs.writeFile(outputPath, pdfBuffer);
  return outputPath;
};

module.exports = {
  CERTIFICATE_FIXTURES,
  MINISTRY_ADDRESS,
  countPdfPages,
  extractPdfText,
  renderCertificateFixture,
  writeFixturePdf
};
