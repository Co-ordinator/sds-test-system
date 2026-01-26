import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResendVerification from '../components/auth/ResendVerification';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [showResendModal, setShowResendModal] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const result = await login(data);

      if (result?.success) {
        const userRole = result.data.user.role;
        switch (userRole) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'counselor':
            navigate('/counselor/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else if (result?.requiresVerification || result?.status === 403) {
        setShowResendModal(true);
      } else {
        setServerError(result?.message || 'Login failed');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        setShowResendModal(true);
      } else {
        setServerError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {showResendModal && (
        <ResendVerification onClose={() => setShowResendModal(false)} />
      )}
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-blue-900">
          SDS Test System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ministry of Labour & Social Security - Eswatini
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">National ID (PIN)</label>
              <input
                {...register("nationalId", { 
                  required: "National ID is required",
                  pattern: { value: /^\d{13}$/, message: "Must be a 13-digit number" }
                })}
                className={`mt-1 block w-full border ${errors.nationalId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2`}
                placeholder="920220..."
              />
              {errors.nationalId && <p className="mt-1 text-xs text-red-500">{errors.nationalId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...register("password", { required: "Password is required" })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="bg-red-50 p-2 rounded text-red-700 text-sm">
                {serverError}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Don't have an account? Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
