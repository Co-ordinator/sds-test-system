import { useState, useCallback, useMemo } from 'react';
import { counselorService } from '../services/counselorService';

export const useStudentManagement = ({ isAdmin = false, institutionId = '' } = {}) => {
  const [students, setStudents] = useState([]);
  const [institutionStats, setInstitutionStats] = useState(null);
  const [hollandDist, setHollandDist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const instId = isAdmin ? institutionId : '';
      const [studentData, statsData] = await Promise.all([
        counselorService.getStudents(instId),
        counselorService.getInstitutionStats(instId),
      ]);
      setStudents(studentData);
      setInstitutionStats(statsData.stats);
      setHollandDist(statsData.hollandDistribution);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, institutionId]);

  const updateStudent = useCallback(async (id, payload) => {
    await counselorService.updateStudent(id, payload);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...payload } : s));
  }, []);

  const deleteStudent = useCallback(async (id) => {
    await counselorService.deleteStudent(id);
    setStudents(prev => prev.filter(s => s.id !== id));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(s => `${s.firstName} ${s.lastName} ${s.email || ''}`.toLowerCase().includes(q));
  }, [students, search]);

  const completedCount = useMemo(
    () => students.filter(s => s.latestAssessment?.status === 'completed').length,
    [students]
  );
  const completionRate = students.length > 0
    ? Math.round((completedCount / students.length) * 100)
    : 0;

  return {
    students: filtered,
    allStudents: students,
    institutionStats,
    hollandDist,
    loading,
    error,
    search,
    setSearch,
    completedCount,
    completionRate,
    load,
    updateStudent,
    deleteStudent,
  };
};
