'use strict';

const { fillDailySeries, resolveDailyRange } = require('../src/utils/dailyDateSeries');

describe('daily analytics date series', () => {
  test('defaults to every day of the current calendar month', () => {
    const range = resolveDailyRange({}, new Date('2026-04-18T12:00:00.000Z'));
    const rows = fillDailySeries([{ month: '2026-04-18T00:00:00.000Z', total: '2', completed: '1' }], range);

    expect(rows).toHaveLength(30);
    expect(rows[0].month).toBe('2026-04-01');
    expect(rows[17]).toEqual({ month: '2026-04-18', total: 2, completed: 1 });
    expect(rows[29].month).toBe('2026-04-30');
  });

  test('includes leap day and zero-fills missing dates', () => {
    const range = resolveDailyRange({ startDate: '2024-02-27', endDate: '2024-03-01' });
    const rows = fillDailySeries([{ month: '2024-02-29', total: 3, completed: 2 }], range);

    expect(rows.map((row) => row.month)).toEqual([
      '2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01'
    ]);
    expect(rows[2]).toEqual({ month: '2024-02-29', total: 3, completed: 2 });
    expect(rows[1].total).toBe(0);
  });

  test('rejects reversed date boundaries', () => {
    expect(() => resolveDailyRange({
      startDate: '2026-07-12',
      endDate: '2026-07-01'
    })).toThrow('startDate must be on or before endDate');
  });
});
