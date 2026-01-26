import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegistrationSuccess from './pages/RegistrationSuccess';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import SdsTest from './pages/SdsTest';
import TestCompletion from './pages/TestCompletion';
import TestResults from './pages/TestResults';
import AdminDashboard from './pages/admin/Dashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registration-success" element={<RegistrationSuccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          
          {/* Error Pages */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Student Routes */}
          <Route path="/test" element={
            <ProtectedRoute allowedRoles={['user']}>
              <SdsTest />
            </ProtectedRoute>
          } />
          <Route path="/test-complete" element={
            <ProtectedRoute allowedRoles={['user']}>
              <TestCompletion />
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute allowedRoles={['user']}>
              <TestResults />
            </ProtectedRoute>
          } />

          {/* Admin/Counselor Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin', 'counselor']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
