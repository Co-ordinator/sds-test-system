import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOtp from './pages/VerifyOtp';
import Questionnaire from './pages/Questionnaire';
import QuestionnaireIntro from './pages/QuestionnaireIntro';
import TestCompletion from './pages/TestCompletion';
import TestResults from './pages/TestResults';
import TestTakerDashboard from './pages/TestTakerDashboard';
import Profile from './pages/Profile';
import AccessibilityPage from './pages/AccessibilityPage';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminInstitutionsPage from './pages/admin/AdminInstitutionsPage';
import AdminOccupationsPage from './pages/admin/AdminOccupationsPage';
import AdminResultsPage from './pages/admin/AdminResultsPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminSubjectsPage from './pages/admin/AdminSubjectsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminEducationLevelsPage from './pages/admin/AdminEducationLevelsPage';
import AdminCertificatesPage from './pages/admin/AdminCertificatesPage';
import Notifications from './pages/Notifications';
import TestAdministratorDashboard from './pages/TestAdministratorDashboard';
import EditUserPermissions from './pages/EditUserPermissions';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import Help from './pages/Help';
import GlossaryPage from './pages/GlossaryPage';
import './index.css';

const ROUTE_LABELS = [
  { match: (path) => path === '/', label: 'Home' },
  { match: (path) => path === '/about', label: 'About SDS' },
  { match: (path) => path === '/help', label: 'Help center' },
  { match: (path) => path === '/login', label: 'Login' },
  { match: (path) => path === '/register', label: 'Registration' },
  { match: (path) => path === '/registration-success', label: 'Email verification' },
  { match: (path) => path === '/forgot-password', label: 'Forgot password' },
  { match: (path) => path.startsWith('/reset-password'), label: 'Reset password' },
  { match: (path) => path.startsWith('/verify-email'), label: 'Verify email' },
  { match: (path) => path === '/onboarding', label: 'Onboarding' },
  { match: (path) => path === '/change-password', label: 'Change password' },
  { match: (path) => path === '/dashboard', label: 'Test taker dashboard' },
  { match: (path) => path === '/questionnaire-intro', label: 'Questionnaire introduction' },
  { match: (path) => path === '/questionnaire', label: 'Questionnaire' },
  { match: (path) => path === '/test-complete', label: 'Test completion' },
  { match: (path) => path === '/results', label: 'Results' },
  { match: (path) => path === '/profile', label: 'Profile' },
  { match: (path) => path === '/glossary', label: 'Glossary' },
  { match: (path) => path === '/accessibility', label: 'Accessibility settings' },
  { match: (path) => path === '/admin/dashboard' || path === '/admin', label: 'Admin dashboard' },
  { match: (path) => path.startsWith('/admin/results'), label: 'Admin results' },
  { match: (path) => path.startsWith('/admin/reports'), label: 'Admin reports' },
  { match: (path) => path.startsWith('/admin/audit'), label: 'Admin audit log' },
  { match: (path) => path.startsWith('/admin/notifications'), label: 'Admin notifications' },
  { match: (path) => path.startsWith('/admin/settings'), label: 'Admin settings' },
  { match: (path) => path.startsWith('/admin/users'), label: 'Admin users' },
  { match: (path) => path.startsWith('/admin/institutions'), label: 'Admin institutions' },
  { match: (path) => path.startsWith('/admin/occupations'), label: 'Admin occupations' },
  { match: (path) => path.startsWith('/test-administrator') || path.startsWith('/counselor'), label: 'Test administrator dashboard' },
];

const resolveRouteLabel = (pathname) => {
  const match = ROUTE_LABELS.find((route) => route.match(pathname));
  return match?.label || 'Page';
};

function AccessibilityRouteAnnouncer() {
  const location = useLocation();
  const { screenReaderMode, announce } = useAccessibility();

  useEffect(() => {
    if (!screenReaderMode) return;
    const label = resolveRouteLabel(location.pathname);
    announce(`Navigated to ${label}`);
  }, [announce, location.pathname, screenReaderMode]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
      <PermissionProvider>
      <AccessibilityProvider>
        <AccessibilityRouteAnnouncer />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/verify-email" element={<Navigate to="/verify-otp" replace />} />
          <Route path="/verify-email/:token" element={<Navigate to="/verify-otp" replace />} />
          <Route path="/onboarding" element={
            <ProtectedRoute allowedRoles={['Test Taker']}>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/change-password" element={
            <ProtectedRoute allowedRoles={['Test Taker', 'System Administrator', 'Test Administrator']}>
              <ChangePassword />
            </ProtectedRoute>
          } />
          
          {/* Error Pages */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Test Taker Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Test Taker']}>
              <TestTakerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/questionnaire-intro" element={
            <ProtectedRoute allowedRoles={['Test Taker']}>
              <QuestionnaireIntro />
            </ProtectedRoute>
          } />
          <Route path="/questionnaire" element={
            <ProtectedRoute allowedRoles={['Test Taker']}>
              <Questionnaire />
            </ProtectedRoute>
          } />
          <Route path="/test" element={
            <ProtectedRoute allowedRoles={['Test Taker']}>
              <QuestionnaireIntro />
            </ProtectedRoute>
          } />
          <Route path="/test-complete" element={
            <ProtectedRoute allowedRoles={['Test Taker']}>
              <TestCompletion />
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute allowedRoles={['Test Taker', 'System Administrator', 'Test Administrator']}>
              <TestResults />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['Test Taker', 'System Administrator', 'Test Administrator']}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/glossary" element={
            <ProtectedRoute allowedRoles={['Test Taker', 'System Administrator', 'Test Administrator']}>
              <GlossaryPage />
            </ProtectedRoute>
          } />
          <Route path="/accessibility" element={
            <ProtectedRoute allowedRoles={['Test Taker', 'System Administrator', 'Test Administrator']}>
              <AccessibilityPage />
            </ProtectedRoute>
          } />

          {/* Admin & Test Administrator Routes — permissions control actual access */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:userId" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminUserDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:userId/permissions" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <EditUserPermissions />
            </ProtectedRoute>
          } />
          <Route path="/admin/institutions" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminInstitutionsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/subjects" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminSubjectsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/occupations" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminOccupationsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/results" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminResultsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminAuditPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/courses" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminCoursesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/education-levels" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminEducationLevelsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/certificates" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminCertificatesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          } />
          {/* Test Administrator Routes — admin can also access test taker management */}
          <Route path="/test-administrator/*" element={
            <ProtectedRoute allowedRoles={['Test Administrator', 'System Administrator']}>
              <TestAdministratorDashboard />
            </ProtectedRoute>
          } />
          {/* Legacy route redirect */}
          <Route path="/counselor/*" element={
            <ProtectedRoute allowedRoles={['Test Administrator', 'System Administrator']}>
              <TestAdministratorDashboard />
            </ProtectedRoute>
          } />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AccessibilityProvider>
      </PermissionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
