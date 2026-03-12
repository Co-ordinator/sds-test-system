import { createContext, useContext, useEffect, useState } from 'react';
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
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/v1/auth/me');
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

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.data?.user ?? response.data.user);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const setSession = (token, userData) => {
    if (token) localStorage.setItem('token', token);
    setUser(userData ?? null);
    setIsAuthenticated(!!userData);
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    setSession
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

  // Require email verification only when user has an email (phone-only users have no email to verify)
  const needsEmailVerification = user?.email && !user?.isEmailVerified;
  const isOnVerifyPage = window.location.pathname.includes('/verify-email');

  const roleDashboard = (role) => {
    if (role === 'System Administrator') return '/admin';
    if (role === 'Test Administrator') return '/admin/dashboard';
    return '/dashboard';
  };

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (allowedRoles && !allowedRoles.includes(user?.role)) {
        navigate(roleDashboard(user?.role));
      } else if (needsEmailVerification && !isOnVerifyPage) {
        navigate('/unauthorized', { 
          state: { 
            message: 'Please verify your email address to access this page',
            requiresVerification: true
          }
        });
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, navigate, needsEmailVerification, isOnVerifyPage]);

  if (loading || !isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role)) || (needsEmailVerification && !isOnVerifyPage)) {
    return null;
  }

  return children;
};
