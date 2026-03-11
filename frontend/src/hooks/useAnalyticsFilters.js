import { useState, useCallback } from 'react';

export const useAnalyticsFilters = (defaults = {}) => {
  const [period, setPeriod] = useState(defaults.period || '30d');
  const [institutionId, setInstitutionId] = useState(defaults.institutionId || '');
  const [region, setRegion] = useState(defaults.region || '');
  const [userType, setUserType] = useState(defaults.userType || '');

  const reset = useCallback(() => {
    setPeriod(defaults.period || '30d');
    setInstitutionId(defaults.institutionId || '');
    setRegion(defaults.region || '');
    setUserType(defaults.userType || '');
  }, [defaults]);

  return {
    filters: { period, institutionId, region, userType },
    period, setPeriod,
    institutionId, setInstitutionId,
    region, setRegion,
    userType, setUserType,
    reset,
  };
};
