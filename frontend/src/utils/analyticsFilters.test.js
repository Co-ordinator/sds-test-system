import { compactAnalyticsFilters, normalizeAgeGroupDistribution } from './analyticsFilters';

describe('analytics filter parameters', () => {
  test('keeps active filters when applying or changing a filter', () => {
    expect(compactAnalyticsFilters({
      region: 'hhohho',
      userType: 'Professional',
      institutionId: ''
    })).toEqual({
      region: 'hhohho',
      userType: 'Professional'
    });
  });

  test('clearing one filter does not send a restrictive empty parameter', () => {
    expect(compactAnalyticsFilters({
      region: '',
      startDate: '2026-01-01',
      endDate: '2026-01-31'
    })).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-01-31'
    });
  });

  test('resetting all filters restores the unfiltered request', () => {
    expect(compactAnalyticsFilters({
      institutionId: '',
      institutionType: '',
      region: '',
      userType: '',
      startDate: '',
      endDate: ''
    })).toEqual({});
  });

  test('normalizes and orders age-group chart data chronologically', () => {
    expect(normalizeAgeGroupDistribution([
      { ageGroup: 'Unknown', total: '2', completed: '1' },
      { ageGroup: '25-34', total: '4', completed: '3' },
      { ageGroup: 'Under 15', total: '5', completed: '4' },
      { ageGroup: '15-19', total: '8', completed: '7' }
    ])).toEqual([
      { ageGroup: 'Under 15', started: 5, completed: 4 },
      { ageGroup: '15-19', started: 8, completed: 7 },
      { ageGroup: '25-34', started: 4, completed: 3 },
      { ageGroup: 'Unknown', started: 2, completed: 1 }
    ]);
  });
});
