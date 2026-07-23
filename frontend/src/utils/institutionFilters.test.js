import { filterInstitutions, summarizeInstitutions } from './institutionFilters';

const fixtures = [
  { id: '1', name: 'Hhohho University', type: 'university', region: 'hhohho', status: 'approved' },
  { id: '2', name: 'Hhohho High School', type: 'school', region: 'hhohho', status: 'pending_review' },
  { id: '3', name: 'Lubombo College', type: 'college', region: 'lubombo', status: 'approved' }
];

describe('institution list filters and summary', () => {
  test('region and classification filters drive the list and summary together', () => {
    const filtered = filterInstitutions(fixtures, { region: 'hhohho', type: 'school' });
    expect(filtered.map((row) => row.id)).toEqual(['2']);
    expect(summarizeInstitutions(filtered, fixtures)).toEqual({ filtered: 1, total: 3, pending: 1 });
  });

  test('search and status filters are included in the same count', () => {
    const filtered = filterInstitutions(fixtures, { search: 'hhohho', status: 'approved' });
    expect(filtered.map((row) => row.id)).toEqual(['1']);
    expect(summarizeInstitutions(filtered, fixtures)).toEqual({ filtered: 1, total: 3, pending: 0 });
  });

  test('clearing filters restores the complete baseline', () => {
    const filtered = filterInstitutions(fixtures);
    expect(summarizeInstitutions(filtered, fixtures)).toEqual({ filtered: 3, total: 3, pending: 1 });
  });
});
