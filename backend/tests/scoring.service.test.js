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

  test('shows every letter in a multi-way strongest-rank tie deterministically', () => {
    const totals = { R: 20, I: 20, A: 20, S: 10, E: 8, C: 4 };

    const { primaryCode, displayCode } = scoringService.buildHollandCodes(totals, 0);

    expect(primaryCode).toBe('RIA');
    expect(displayCode).toBe('R/I/A S E');
  });

  test('keeps ordinary ranks separate when there is no tie', () => {
    const totals = { R: 20, I: 18, A: 16, S: 14, E: 12, C: 10 };

    const { primaryCode, displayCode } = scoringService.buildHollandCodes(totals, 0);

    expect(primaryCode).toBe('RIA');
    expect(displayCode).toBe('R I A');
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

  test('builds recommendation variants for a tied strongest rank', () => {
    const variants = scoringService.buildCodeVariants('AER', 'A/E R I');

    expect(variants).toEqual(expect.arrayContaining(['AER', 'EAR', 'ARI', 'ERI']));
    expect(scoringService.getPrimaryLettersForMatching('AER', 'A/E R I')).toEqual(['A', 'E']);
  });

  test('builds recommendation variants for a tied third rank', () => {
    const variants = scoringService.buildCodeVariants('SCA', 'S C A/E');

    expect(variants).toEqual(expect.arrayContaining(['SCA', 'SCE']));
    expect(scoringService.getLettersForMatching('SCA', 'S C A/E')).toEqual(['S', 'C', 'A', 'E']);
  });

  test('gives tied first-rank letters equal fallback weight when scores are unavailable', () => {
    const variants = scoringService.buildCodeVariants('AER', 'A/E R I');
    const weights = scoringService.buildWeightsFromCodeVariants('AER', variants);

    expect(weights.A).toBe(1);
    expect(weights.E).toBe(1);
  });
});
