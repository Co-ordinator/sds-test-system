import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegistrationSuccess from './pages/RegistrationSuccess';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Questionnaire from './pages/Questionnaire';
import TestCompletion from './pages/TestCompletion';
import TestResults from './pages/TestResults';
import TestTakerDashboard from './pages/TestTakerDashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminInstitutionsPage from './pages/admin/AdminInstitutionsPage';
import AdminOccupationsPage from './pages/admin/AdminOccupationsPage';
import AdminResultsPage from './pages/admin/AdminResultsPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import Notifications from './pages/Notifications';
import CounsellorDashboard from './pages/CounsellorDashboard';
import Analytics from './pages/Analytics';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
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
          
          {/* Error Pages */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Student Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user']}>
              <TestTakerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/test" element={
            <ProtectedRoute allowedRoles={['user']}>
              <Questionnaire />
            </ProtectedRoute>
          } />
          <Route path="/test-complete" element={
            <ProtectedRoute allowedRoles={['user']}>
              <TestCompletion />
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'counselor']}>
              <TestResults />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'counselor']}>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/institutions" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminInstitutionsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/occupations" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminOccupationsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/results" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminResultsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/questions" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminQuestionsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAuditPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          } />
          {/* Counselor Routes — admin can also access student management */}
          <Route path="/counselor/*" element={
            <ProtectedRoute allowedRoles={['counselor', 'admin']}>
              <CounsellorDashboard />
            </ProtectedRoute>
          } />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
