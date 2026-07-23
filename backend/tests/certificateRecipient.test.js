'use strict';

const {
  USER_TYPES,
  buildCertificateRecipientContext,
  buildCertificateStatement
} = require('../src/utils/certificateRecipient');

describe('certificate recipient context', () => {
  test('prefers a high school association over stale scalar profile values', () => {
    const user = {
      firstName: 'Nomsa',
      lastName: 'Dlamini',
      nationalId: '123456789',
      userType: 'High School Student',
      currentInstitution: 'Old School',
      region: 'Manzini',
      institution: {
        name: 'Mbabane Central High School',
        region: 'Hhohho'
      }
    };

    expect(buildCertificateRecipientContext({ user })).toEqual(expect.objectContaining({
      recipientName: 'NOMSA DLAMINI',
      pin: '123456789',
      userType: USER_TYPES.HIGH_SCHOOL,
      institutionName: 'MBABANE CENTRAL HIGH SCHOOL',
      regionName: 'HHOHHO'
    }));
    expect(buildCertificateStatement({ user, testDate: 'July 2026' })).toBe(
      'This is to certify that NOMSA DLAMINI, PIN: 123456789, completed a Self-Directed Search test in JULY 2026 at MBABANE CENTRAL HIGH SCHOOL, located in the HHOHHO Region.'
    );
  });

  test('uses university-specific wording', () => {
    const user = {
      firstName: 'Sabelo',
      lastName: 'Maseko',
      studentCode: 'UNI-100',
      userType: 'University Student',
      institution: {
        name: 'University of Eswatini',
        region: 'Manzini Region'
      }
    };

    expect(buildCertificateStatement({ user, testDate: 'July 2026' })).toBe(
      'This is to certify that SABELO MASEKO, PIN: UNI-100, completed a Self-Directed Search test in JULY 2026 while registered at UNIVERSITY OF ESWATINI, located in the MANZINI Region.'
    );
  });

  test('uses professional associations and excludes student and residential fields', () => {
    const user = {
      firstName: 'Thando',
      lastName: 'Baartjes',
      nationalId: '0001207100591',
      userType: 'Professional',
      currentInstitution: 'Mbabane Dr Dlorosa High School',
      currentOccupation: 'Old occupation',
      workplaceName: 'Old workplace',
      district: 'Live district',
      region: 'Live region',
      employmentStatus: 'Employed',
      physicalAddress: '10 Residential Street',
      occupation: { name: 'Director \u2013 Strategy' },
      workplace: {
        name: "King's Advisory Services",
        district: 'Mbabane',
        region: 'Hhohho'
      }
    };

    const statement = buildCertificateStatement({ user, testDate: 'July 2026' });

    expect(statement).toBe(
      "This is to certify that THANDO BAARTJES, PIN: 0001207100591, completed a Self-Directed Search test in JULY 2026 as a Professional working as DIRECTOR - STRATEGY at KING'S ADVISORY SERVICES, based in MBABANE, HHOHHO Region."
    );
    expect(statement).not.toContain('DR DLOROSA');
    expect(statement).not.toContain('Residential');
    expect(statement).not.toContain('Employed');
  });

  test('omits unavailable legacy professional clauses without placeholders', () => {
    const user = {
      firstName: 'Legacy',
      lastName: 'Professional',
      userType: 'professional',
      workplaceName: 'NOT SPECIFIED',
      currentOccupation: 'not specified',
      district: 'N/A',
      region: null
    };

    const statement = buildCertificateStatement({ user, testDate: 'July 2026' });

    expect(statement).toBe(
      'This is to certify that LEGACY PROFESSIONAL completed a Self-Directed Search test in JULY 2026 as a Professional.'
    );
    expect(statement).not.toMatch(/not specified/i);
  });

  test('uses scalar professional fields when associations are unavailable', () => {
    const user = {
      firstName: 'Lindiwe',
      lastName: 'Simelane',
      nationalId: 'PIN-7',
      userType: 'Professional',
      currentOccupation: 'Accountant',
      workplaceName: 'Eswatini Revenue Service',
      district: 'Matsapha',
      region: 'Manzini'
    };

    expect(buildCertificateStatement({ user, testDate: 'July 2026' })).toBe(
      'This is to certify that LINDIWE SIMELANE, PIN: PIN-7, completed a Self-Directed Search test in JULY 2026 as a Professional working as ACCOUNTANT at ESWATINI REVENUE SERVICE, based in MATSAPHA, MANZINI Region.'
    );
  });

  test('treats a non-null snapshot as authoritative while keeping identity live', () => {
    const user = {
      firstName: 'Current',
      lastName: 'Name',
      nationalId: 'CURRENT-PIN',
      userType: 'High School Student',
      currentInstitution: 'New School',
      currentOccupation: 'New Occupation',
      workplaceName: 'New Workplace',
      district: 'New District',
      region: 'New Region'
    };
    const snapshot = {
      firstName: 'Ignored',
      pin: 'IGNORED-PIN',
      userType: 'Professional',
      institutionName: null,
      occupationName: 'Assessment Occupation',
      workplaceName: null,
      district: 'Lobamba',
      region: 'Hhohho'
    };

    const context = buildCertificateRecipientContext({ user, snapshot });
    expect(context).toEqual(expect.objectContaining({
      recipientName: 'CURRENT NAME',
      pin: 'CURRENT-PIN',
      userType: USER_TYPES.PROFESSIONAL,
      institutionName: '',
      occupationName: 'ASSESSMENT OCCUPATION',
      workplaceName: '',
      districtName: 'LOBAMBA',
      regionName: 'HHOHHO'
    }));
    expect(buildCertificateStatement({ user, snapshot, testDate: 'July 2026' })).toBe(
      'This is to certify that CURRENT NAME, PIN: CURRENT-PIN, completed a Self-Directed Search test in JULY 2026 as a Professional working as ASSESSMENT OCCUPATION, based in LOBAMBA, HHOHHO Region.'
    );
  });

  test('does not merge live role data into an empty authoritative snapshot', () => {
    const user = {
      firstName: 'Snapshot',
      lastName: 'Only',
      nationalId: 'PIN-8',
      userType: 'Professional',
      currentOccupation: 'Live Occupation',
      workplaceName: 'Live Workplace',
      district: 'Live District',
      region: 'Hhohho'
    };

    const statement = buildCertificateStatement({ user, snapshot: {}, testDate: 'July 2026' });

    expect(statement).toBe(
      'This is to certify that SNAPSHOT ONLY, PIN: PIN-8, completed a Self-Directed Search test in JULY 2026.'
    );
    expect(statement).not.toContain('LIVE');
  });
});
