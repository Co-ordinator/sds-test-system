import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';
import ResendVerification from '../components/auth/ResendVerification';

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showResendModal, setShowResendModal] = useState(false);
  const email = location.state?.email || '';

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {showResendModal && (
        <ResendVerification 
          onClose={() => setShowResendModal(false)} 
          defaultEmail={email}
        />
      )}
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-blue-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to <span className="font-medium">{email}</span>.
            Please check your inbox to complete registration.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => setShowResendModal(true)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800"
            >
              Resend Verification Link
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
