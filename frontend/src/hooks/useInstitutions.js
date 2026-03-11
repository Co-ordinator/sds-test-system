import { useState, useCallback, useMemo } from 'react';
import { adminService } from '../services/adminService';

export const useInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getInstitutions();
      setInstitutions(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload) => {
    const inst = await adminService.createInstitution(payload);
    setInstitutions(prev => [...prev, inst]);
    return inst;
  }, []);

  const update = useCallback(async (id, payload) => {
    await adminService.updateInstitution(id, payload);
    setInstitutions(prev => prev.map(i => i.id === id ? { ...i, ...payload } : i));
  }, []);

  const remove = useCallback(async (id) => {
    await adminService.deleteInstitution(id);
    setInstitutions(prev => prev.filter(i => i.id !== id));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return institutions;
    return institutions.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [institutions, search]);

  return {
    institutions: filtered,
    allInstitutions: institutions,
    loading,
    error,
    search,
    setSearch,
    load,
    create,
    update,
    remove,
  };
};
