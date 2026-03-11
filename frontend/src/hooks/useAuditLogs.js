import { useState, useCallback } from 'react';
import { adminService } from '../services/adminService';

export const useAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const viewDetail = useCallback(async (id) => {
    setLoadingDetail(true);
    setSelectedLog(null);
    try {
      const log = await adminService.getAuditLog(id);
      setSelectedLog(log);
    } catch {
      setSelectedLog(logs.find(l => l.id === id) || null);
    } finally {
      setLoadingDetail(false);
    }
  }, [logs]);

  const clearDetail = useCallback(() => {
    setSelectedLog(null);
    setLoadingDetail(false);
  }, []);

  return {
    logs,
    loading,
    error,
    selectedLog,
    loadingDetail,
    load,
    viewDetail,
    clearDetail,
  };
};
