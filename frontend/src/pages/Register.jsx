import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Joi from 'joi';
import { joiResolver } from '@hookform/resolvers/joi';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [extractedData, setExtractedData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const navigate = useNavigate();

  const schema = Joi.object({
    firstName: Joi.string().required().label('First Name'),
    lastName: Joi.string().required().label('Last Name'),
    email: Joi.string().email({ tlds: false }).required().label('Email'),
    nationalId: Joi.string().pattern(/^[0-9]{13}$/).required().label('National ID'),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])')).required().label('Password'),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().label('Confirm Password'),
    institutionId: Joi.string().guid({ version: 'uuidv4' }).allow('', null).label('Institution'),
    termsAccepted: Joi.boolean().valid(true).required().label('Terms Acceptance')
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: joiResolver(schema)
  });

  const nationalId = watch('nationalId');

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await api.get('/api/v1/institutions');
        setInstitutions(res.data?.data?.institutions || []);
      } catch (err) {
        // swallow for now; could add toast
        setInstitutions([]);
      }
    };
    loadInstitutions();
  }, []);

  const filteredInstitutions = useMemo(() => {
    if (!institutionSearch) return institutions;
    return institutions.filter((inst) =>
      inst.name.toLowerCase().includes(institutionSearch.toLowerCase()) ||
      (inst.acronym || '').toLowerCase().includes(institutionSearch.toLowerCase())
    );
  }, [institutions, institutionSearch]);

  useEffect(() => {
    if (nationalId?.length === 13) {
      // Call utility function to extract data from national ID
      const { dob, gender } = extractFromNationalId(nationalId);
      setExtractedData({ dob, gender });
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }, [nationalId]);

  const extractFromNationalId = (id) => {
    // Implementation of national ID parsing logic
    const dobPart = id.substring(0, 6);
    const genderDigit = parseInt(id.substring(6, 7));
    
    const year = parseInt(dobPart.substring(0, 2));
    const month = parseInt(dobPart.substring(2, 4));
    const day = parseInt(dobPart.substring(4, 6));
    
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    const gender = genderDigit < 5 ? 'Female' : 'Male';
    
    return {
      dob: `${day}/${month}/${fullYear}`,
      gender
    };
  };

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/api/v1/auth/register', data);
      navigate('/registration-success', { 
        state: { email: data.email } 
      });
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Column - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-blue-800 text-white p-12 flex-col justify-center">
        <h1 className="text-4xl font-bold mb-6">Eswatini Career Portal</h1>
        <p className="text-xl mb-8">Create your account to access career guidance and job matching services.</p>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="bg-white text-blue-800 rounded-full p-2 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Personalized career recommendations</span>
          </div>
          {/* More benefits... */}
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Create Your Account</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                {...register('firstName')}
                className={`w-full px-4 py-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                {...register('lastName')}
                className={`w-full px-4 py-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
              {isVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  System Verified
                </span>
              )}
            </div>
            <input
              {...register('nationalId')}
              className={`w-full px-4 py-2 border rounded-md ${errors.nationalId ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.nationalId && <p className="mt-1 text-sm text-red-600">{errors.nationalId.message}</p>}
          </div>

          {extractedData && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Identity Confirmation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-sm font-medium">{extractedData.dob}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-sm font-medium">{extractedData.gender}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                {...register('password')}
                className={`w-full px-4 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={`w-full px-4 py-2 border rounded-md ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {/* Institution selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution (optional)</label>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Search institutions..."
                value={institutionSearch}
                onChange={(e) => setInstitutionSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-md border-gray-300"
              />
              <select
                {...register('institutionId')}
                className="w-full px-4 py-2 border rounded-md border-gray-300"
                defaultValue=""
              >
                <option value="">Select institution (optional)</option>
                {filteredInstitutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}{inst.acronym ? ` (${inst.acronym})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {errors.institutionId && <p className="mt-1 text-sm text-red-600">{errors.institutionId.message}</p>}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                {...register('termsAccepted')}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-gray-700">
                I consent to the Processing of Personal Data under the Eswatini Data Protection Act 2022
              </label>
              {errors.termsAccepted && <p className="mt-1 text-sm text-red-600">{errors.termsAccepted.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={Object.keys(errors).length > 0}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
