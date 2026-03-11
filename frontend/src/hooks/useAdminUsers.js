import { useState, useCallback, useMemo } from 'react';
import { adminService } from '../services/adminService';

export const useAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers({ search, role: roleFilter });
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  const deleteUser = useCallback(async (id) => {
    await adminService.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const updateUserLocal = useCallback((updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q));
  }, [users, search]);

  return {
    users: filtered,
    allUsers: users,
    loading,
    error,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    load,
    deleteUser,
    updateUserLocal,
  };
};
