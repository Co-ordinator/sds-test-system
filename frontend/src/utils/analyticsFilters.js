export const compactAnalyticsFilters = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => (
      value !== ''
      && value !== null
      && value !== undefined
    ))
  );

const AGE_GROUP_ORDER = ['Under 15', '15-19', '20-24', '25-34', '35+', 'Unknown'];

export const normalizeAgeGroupDistribution = (rows = []) =>
  rows
    .map((row) => ({
      ageGroup: row.ageGroup || 'Unknown',
      started: Number(row.total || 0),
      completed: Number(row.completed || 0),
    }))
    .sort((left, right) => {
      const leftIndex = AGE_GROUP_ORDER.indexOf(left.ageGroup);
      const rightIndex = AGE_GROUP_ORDER.indexOf(right.ageGroup);
      const safeLeftIndex = leftIndex === -1 ? AGE_GROUP_ORDER.length : leftIndex;
      const safeRightIndex = rightIndex === -1 ? AGE_GROUP_ORDER.length : rightIndex;
      return safeLeftIndex - safeRightIndex || left.ageGroup.localeCompare(right.ageGroup);
    });
