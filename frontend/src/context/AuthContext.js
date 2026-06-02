import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for active session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/v1/auth/me', { skipAuthRetry: true });
        const userData = response.data?.data?.user ?? response.data?.user;
        setUser(userData || null);
        setIsAuthenticated(!!userData);
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [navigate]);

  const login = useCallback(async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login', credentials);
      setUser(response.data.data?.user ?? response.data.user);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const setSession = useCallback((token, userData) => {
    setUser(userData ?? null);
    setIsAuthenticated(!!userData);
  }, []);

  const logout = useCallback(async () => {
    // Explicit user-initiated sign-out drops them back on the public landing
    // page (involuntary session expiry still routes to /login — see the
    // auth:session-expired handler above).
    try {
      await api.post('/api/v1/auth/logout');
    } catch (_) {
      // Network/API error is non-fatal — clear local session anyway so the
      // user isn't trapped on an authenticated screen.
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const refreshPermissions = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      const userData = response.data?.data?.user ?? response.data?.user;
      setUser(userData || null);
      return userData;
    } catch (err) {
      console.error('Failed to refresh permissions:', err);
      throw err;
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    setSession,
    refreshPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Require email verification only for self-registered accounts.
  const needsEmailVerification = user?.email && !user?.isEmailVerified && !user?.createdByTestAdministrator;
  const isOnVerifyPage = /\/verify-otp(\/|$)/.test(window.location.pathname)
    || /\/verify-email(\/|$)/.test(window.location.pathname);
  
  const roleDashboard = (role) => {
    if (role === 'System Administrator') return '/admin';
    if (role === 'Test Administrator') return '/test-administrator';
    return '/dashboard';
  };

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (needsEmailVerification && !isOnVerifyPage) {
        navigate('/unauthorized', {
          state: {
            message: 'Please verify your email address to access this page',
            requiresVerification: true
          }
        });
      } else if (allowedRoles && !allowedRoles.includes(user?.role)) {
        navigate(roleDashboard(user?.role));
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, navigate, needsEmailVerification, isOnVerifyPage]);

  if (
    loading ||
    !isAuthenticated ||
    (allowedRoles && !allowedRoles.includes(user?.role)) ||
    (needsEmailVerification && !isOnVerifyPage)
  ) {
    return null;
  }

  return children;
};
