import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'counselor') {
      navigate('/counselor');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
