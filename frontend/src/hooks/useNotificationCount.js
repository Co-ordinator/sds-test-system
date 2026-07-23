import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export function useNotificationCount(enabled = true) {
  const [count, setCount] = useState(0);
  const requestSequence = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return undefined;
    }

    let active = true;
    let inFlight = false;
    let interval = null;
    const controller = new AbortController();

    const stop = () => {
      active = false;
      requestSequence.current += 1;
      if (interval) clearInterval(interval);
      controller.abort();
    };

    const load = async () => {
      if (!active || inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      const sequence = ++requestSequence.current;
      try {
        const res = await api.get('/api/v1/admin/notifications?limit=1', {
          signal: controller.signal
        });
        if (active && sequence === requestSequence.current) {
          setCount(res.data?.data?.unreadCount || 0);
        }
      } catch (error) {
        const status = error?.status ?? error?.response?.status;
        if (status === 401 || status === 403) stop();
      } finally {
        inFlight = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') load();
    };

    load();
    interval = setInterval(load, 60000);
    window.addEventListener('notifications:changed', load);
    window.addEventListener('auth:session-expired', stop);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stop();
      window.removeEventListener('notifications:changed', load);
      window.removeEventListener('auth:session-expired', stop);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  return count;
}
