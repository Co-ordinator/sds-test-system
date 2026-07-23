export const filterInstitutions = (
  institutions,
  { search = '', type = '', region = '', status = '' } = {}
) => {
  const normalizedSearch = String(search).trim().toLowerCase();
  return (institutions || []).filter((institution) => {
    if (normalizedSearch && !String(institution.name || '').toLowerCase().includes(normalizedSearch)) return false;
    if (type && institution.type !== type) return false;
    if (region && institution.region !== region) return false;
    if (status === 'pending' && institution.status !== 'pending_review') return false;
    if (status === 'approved' && institution.status !== 'approved') return false;
    return true;
  });
};

export const summarizeInstitutions = (filteredInstitutions, allInstitutions) => ({
  filtered: filteredInstitutions.length,
  total: allInstitutions.length,
  pending: filteredInstitutions.filter((institution) => institution.status === 'pending_review').length
});
