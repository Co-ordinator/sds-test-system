import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useNotificationCount(enabled = true) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await api.get('/api/v1/admin/notifications?limit=1');
      setCount(res.data?.data?.unreadCount || 0);
    } catch { /* silent */ }
  }, [enabled]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return count;
}
