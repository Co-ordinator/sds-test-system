process.env.NODE_ENV = 'test';

const scoringService = require('../src/services/scoring.service');
const { sequelize } = require('../src/models');

afterAll(async () => {
  await sequelize.close();
});

describe('scoringService Holland display codes', () => {
  test('uses slash notation for a tie within the third displayed rank', () => {
    const totals = { R: 19, I: 18, A: 26, S: 30, E: 26, C: 28 };

    const { primaryCode, displayCode } = scoringService.buildHollandCodes(totals, 0);

    expect(primaryCode).toBe('SCA');
    expect(displayCode).toBe('S C A/E');
  });

  test('uses slash notation for a tie in the strongest rank', () => {
    const totals = { R: 12, I: 11, A: 26, S: 10, E: 26, C: 4 };

    const { primaryCode, displayCode } = scoringService.buildHollandCodes(totals, 0);

    expect(primaryCode).toBe('AER');
    expect(displayCode).toBe('A/E R I');
  });

  test('derives user-facing display code from scores instead of stored compact code', () => {
    const assessment = {
      hollandCode: 'SCA',
      scoreR: 19,
      scoreI: 18,
      scoreA: 26,
      scoreS: 30,
      scoreE: 26,
      scoreC: 28
    };

    expect(scoringService.getAssessmentDisplayCode(assessment)).toBe('S C A/E');
  });
});
