import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { clearAllQueuedProgress } from '../services/assessmentProgressQueue';
import { profileNeedsOnboarding } from '../utils/profileOnboarding';
import { isPublicRoute } from '../utils/authRoutes';
import StartupScreen from '../components/ui/StartupScreen';

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
        // Allow the shared interceptor to renew an expired access token from
        // the httpOnly refresh cookie before deciding that the session ended.
        const response = await api.get('/api/v1/auth/me', {
          // A visitor without cookies is anonymous, not an expired session.
          // Still allow refresh so a real returning session is restored.
          suppressSessionExpired: true
        });
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
      if (!isPublicRoute(window.location.pathname)) {
        navigate('/login', { replace: true });
      }
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
      clearAllQueuedProgress();
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
      // Keep the current permission snapshot if the refresh request fails.
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
      {loading ? <StartupScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Require email verification only for self-registered accounts.
  const needsEmailVerification = user?.email && !user?.isEmailVerified && !user?.createdByTestAdministrator;
  const needsOnboarding = user?.role === 'Test Taker' && profileNeedsOnboarding(user);
  const isOnVerifyPage = /\/verify-otp(\/|$)/.test(location.pathname)
    || /\/verify-email(\/|$)/.test(location.pathname);
  const isOnboardingPage = /\/onboarding(\/|$)/.test(location.pathname);
  
  const roleDashboard = (role) => {
    if (role === 'System Administrator') return '/admin';
    if (role === 'Test Administrator') return '/test-administrator';
    if (role === 'Test Taker' && profileNeedsOnboarding(user)) return '/onboarding';
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
      } else if (needsOnboarding && !isOnboardingPage) {
        navigate('/onboarding', {
          replace: true,
          state: { message: 'Complete your profile before continuing.' }
        });
      } else if (allowedRoles && !allowedRoles.includes(user?.role)) {
        navigate(roleDashboard(user?.role));
      }
    }
  }, [
    loading,
    isAuthenticated,
    user,
    allowedRoles,
    navigate,
    needsEmailVerification,
    isOnVerifyPage,
    needsOnboarding,
    isOnboardingPage
  ]);

  if (
    loading ||
    !isAuthenticated ||
    (allowedRoles && !allowedRoles.includes(user?.role)) ||
    (needsEmailVerification && !isOnVerifyPage) ||
    (needsOnboarding && !isOnboardingPage)
  ) {
    return null;
  }

  return children;
};
