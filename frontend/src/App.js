import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegistrationSuccess from './pages/RegistrationSuccess';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Questionnaire from './pages/Questionnaire';
import QuestionnaireIntro from './pages/QuestionnaireIntro';
import TestCompletion from './pages/TestCompletion';
import TestResults from './pages/TestResults';
import TestTakerDashboard from './pages/TestTakerDashboard';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminInstitutionsPage from './pages/admin/AdminInstitutionsPage';
import AdminOccupationsPage from './pages/admin/AdminOccupationsPage';
import AdminResultsPage from './pages/admin/AdminResultsPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminSubjectsPage from './pages/admin/AdminSubjectsPage';
import Notifications from './pages/Notifications';
import TestAdministratorDashboard from './pages/TestAdministratorDashboard';
import Analytics from './pages/Analytics';
import EditUserPermissions from './pages/EditUserPermissions';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
      <PermissionProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registration-success" element={<RegistrationSuccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/onboarding" element={<Onboarding />} />
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
              <Questionnaire />
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
          <Route path="/admin/questions" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminQuestionsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <AdminAuditPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['System Administrator', 'Test Administrator']}>
              <Analytics />
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
      </PermissionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
