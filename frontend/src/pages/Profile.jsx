import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Joi from 'joi';
import { joiResolver } from '@hookform/resolvers/joi';
import api from '../services/api';

export default function Profile() {
  const [userData, setUserData] = useState(null);

  // Extended schema for profile fields
  const schema = Joi.object({
    phoneNumber: Joi.string().pattern(/^\+268\d{8}$/).allow('').label('Phone Number'),
    region: Joi.string().valid('hhohho', 'manzini', 'lubombo', 'shiselweni').allow('').label('Region'),
    district: Joi.string().allow('').label('District'),
    address: Joi.string().allow('').label('Address'),
    educationLevel: Joi.string().valid(
      'primary', 'junior_secondary', 'senior_secondary', 'tvet',
      'diploma', 'undergraduate', 'postgraduate', 'other'
    ).allow('').label('Education Level'),
    currentInstitution: Joi.string().allow('').label('Current Institution'),
    employmentStatus: Joi.string().valid(
      'student', 'employed', 'unemployed', 'self_employed', 'other'
    ).allow('').label('Employment Status'),
    currentOccupation: Joi.string().allow('').label('Current Occupation'),
    preferredLanguage: Joi.string().valid('en', 'ss').label('Preferred Language'),
    requiresAccessibility: Joi.boolean().label('Requires Accessibility'),
    accessibilityNeeds: Joi.object().pattern(/.*/, Joi.any()).label('Accessibility Needs')
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: joiResolver(schema)
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/v1/auth/me');
        const user = response.data?.data?.user || response.data?.user;
        if (user) {
          setUserData(user);
          reset(user);
        }
      } catch (err) {
        setUserData({});
      }
    };

    fetchUserData();
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      await api.patch('/api/v1/auth/me', data);
      setUserData((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/api/v1/auth/users/me/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-sds-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err.response?.data?.message || 'Export failed');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await api.delete('/api/v1/auth/users/me/account');
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err) {
      console.error(err.response?.data?.message || 'Deletion failed');
      setIsDeleting(false);
    }
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                {...register('phoneNumber')}
                placeholder="+268XXXXXXXX"
                className={`w-full px-4 py-2 border rounded-md ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select
                {...register('region')}
                className={`w-full px-4 py-2 border rounded-md ${errors.region ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Region</option>
                <option value="hhohho">Hhohho</option>
                <option value="manzini">Manzini</option>
                <option value="lubombo">Lubombo</option>
                <option value="shiselweni">Shiselweni</option>
              </select>
              {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                {...register('district')}
                className={`w-full px-4 py-2 border rounded-md ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                {...register('address')}
                className={`w-full px-4 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Education Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Education</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
              <select
                {...register('educationLevel')}
                className={`w-full px-4 py-2 border rounded-md ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Education Level</option>
                <option value="primary">Primary</option>
                <option value="junior_secondary">Junior Secondary</option>
                <option value="senior_secondary">Senior Secondary</option>
                <option value="tvet">TVET</option>
                <option value="diploma">Diploma</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="postgraduate">Postgraduate</option>
                <option value="other">Other</option>
              </select>
              {errors.educationLevel && <p className="mt-1 text-sm text-red-600">{errors.educationLevel.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Institution</label>
              <input
                {...register('currentInstitution')}
                className={`w-full px-4 py-2 border rounded-md ${errors.currentInstitution ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.currentInstitution && <p className="mt-1 text-sm text-red-600">{errors.currentInstitution.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Employment Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Employment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
              <select
                {...register('employmentStatus')}
                className={`w-full px-4 py-2 border rounded-md ${errors.employmentStatus ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Employment Status</option>
                <option value="student">Student</option>
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="other">Other</option>
              </select>
              {errors.employmentStatus && <p className="mt-1 text-sm text-red-600">{errors.employmentStatus.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Occupation</label>
              <input
                {...register('currentOccupation')}
                className={`w-full px-4 py-2 border rounded-md ${errors.currentOccupation ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.currentOccupation && <p className="mt-1 text-sm text-red-600">{errors.currentOccupation.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Preferences Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
              <select
                {...register('preferredLanguage')}
                className={`w-full px-4 py-2 border rounded-md ${errors.preferredLanguage ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="en">English</option>
                <option value="ss">SiSwati</option>
              </select>
              {errors.preferredLanguage && <p className="mt-1 text-sm text-red-600">{errors.preferredLanguage.message}</p>}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiresAccessibility"
                {...register('requiresAccessibility')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requiresAccessibility" className="ml-2 block text-sm text-gray-700">
                I require accessibility accommodations
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Data subject rights */}
      <div className="mt-10 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-lg font-medium text-gray-800 mb-2">Your data rights</h2>
        <p className="text-sm text-gray-600 mb-4">
          Under data protection law you can request a copy of your data or request account deletion.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Export my data
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
            />
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || isDeleting}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
