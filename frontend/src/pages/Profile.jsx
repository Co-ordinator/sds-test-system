import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Joi from 'joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { Save, Download, Trash2, User, GraduationCap, Briefcase, Settings, Shield, Clock, Mail, Key, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GOV, TYPO } from '../theme/government';
import AppShell from '../components/layout/AppShell';
import WorkplaceSearchInput from '../components/ui/WorkplaceSearchInput';
import OccupationSearchInput from '../components/ui/OccupationSearchInput';
import InstitutionSearchInput from '../components/ui/InstitutionSearchInput';
import DistrictSearchInput from '../components/ui/DistrictSearchInput';
import AccessibilityDialog from '../components/ui/AccessibilityDialog';
import { Monitor } from 'lucide-react';
import {
  GENDER_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  educationPairError,
  normalizeGradeLevel,
} from '../data/profileOptions';

const inputStyle = {
  border: '0',
  borderBottom: `1px solid ${GOV.border}`,
  color: GOV.text,
  fontSize: '0.875rem',
};
const inputFocusClass = 'w-full px-0 py-2 rounded-none bg-transparent focus:outline-none focus:ring-0';
const errorInputStyle = { border: '0', borderBottom: `1px solid ${GOV.error}` };

const ROLE_COLORS = {
  'System Administrator': { bg: '#ede9fe', text: '#6d28d9', label: 'System Administrator' },
  'Test Administrator': { bg: '#dbeafe', text: '#1d4ed8', label: 'Test Administrator' },
  'Test Taker': { bg: '#f0fdf4', text: '#15803d', label: 'Test Taker' },
};

const STAFF_ROLES = new Set(['System Administrator', 'Test Administrator']);
const TERTIARY_INSTITUTION_TYPES = 'university,college,tvet,vocational';

const USER_TYPE_LABELS = {
  'High School Student': 'High School Student',
  'University Student': 'Tertiary Student',
  Professional: 'Professional',
};

export default function Profile() {
  const { user: authUser, setSession } = useAuth();
  const [userData, setUserData] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [workplace, setWorkplace] = useState({ name: '', institutionId: null });
  const [occupation, setOccupation] = useState({ name: '', occupationId: null });
  const [institution, setInstitution] = useState({ name: '', institutionId: null });
  const [district, setDistrict] = useState('');
  const [educationLevels, setEducationLevels] = useState([]);
  const [educationLevelsLoading, setEducationLevelsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const phoneInputRef = useRef(null);
  const phoneDigitsRef = useRef('');
  const [showAccessibilityDialog, setShowAccessibilityDialog] = useState(false);

  // Role-dependent required fields are checked against both controlled search
  // inputs and react-hook-form values immediately before submission.
  const schema = Joi.object({
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional().allow('', null).label('Gender'),
    region: Joi.string().valid('hhohho', 'manzini', 'lubombo', 'shiselweni').optional().allow('', null).label('Region'),
    district: Joi.string().optional().allow('', null).label('District'),
    address: Joi.string().optional().allow('', null).label('Address'),
    // Keep this flexible to avoid blocking profile saves for legacy UUID-based values.
    educationLevel: Joi.string().optional().allow('', null).label('Education Level'),
    currentInstitution: Joi.string().optional().allow('', null).label('Current Institution'),
    gradeLevel: Joi.string().optional().allow('', null).label('Current or Highest Grade'),
    degreeProgram: Joi.string().optional().allow('', null).label('Degree Programme'),
    yearOfStudy: Joi.number().integer().min(0).max(20).optional().allow('', null).label('Year of Study'),
    employmentStatus: Joi.string().valid(
      'student', 'employed', 'unemployed', 'self_employed', 'other'
    ).optional().allow('', null).label('Employment Status'),
    currentOccupation: Joi.string().optional().allow('', null).label('Current Occupation'),
    yearsExperience: Joi.number().integer().min(0).max(80).optional().allow('', null).label('Years of Experience'),
    preferredLanguage: Joi.string().valid('en', 'ss').optional().allow('', null).label('Preferred Language')
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setError, clearErrors } = useForm({
    resolver: joiResolver(schema)
  });
  const selectedRegion = watch('region');
  const role = authUser?.role || userData?.role || 'Test Taker';
  const userType = userData?.userType || authUser?.userType || '';
  const isTestTaker = role === 'Test Taker';
  const isStaff = STAFF_ROLES.has(role);
  const isHighSchoolTaker = isTestTaker && userType === 'High School Student';
  const isUniversityTaker = isTestTaker && userType === 'University Student';
  const isProfessionalTaker = isTestTaker && userType === 'Professional';
  const institutionTypeFilter = isHighSchoolTaker ? 'school' : isUniversityTaker ? TERTIARY_INSTITUTION_TYPES : '';
  const institutionUserTypeFilter = isHighSchoolTaker ? 'school_student' : isUniversityTaker ? 'university_student' : '';
  const canEditInstitution = isTestTaker && !isProfessionalTaker;
  const canDeleteAccount = isTestTaker;

  const handlePhoneNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (e.target.value !== digits) {
      e.target.value = digits;
    }
    phoneDigitsRef.current = digits;
    if (phoneError) setPhoneError('');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/v1/auth/me');
        const user = response.data?.data?.user || response.data?.user;
        if (user) {
          setUserData(user);
          reset({
            gender: user.gender || '',
            region: user.region || '',
            district: user.district || '',
            address: user.address || '',
            educationLevel: user.educationLevel || '',
            currentInstitution: user.currentInstitution || '',
            gradeLevel: normalizeGradeLevel(user.gradeLevel),
            degreeProgram: user.degreeProgram || '',
            yearOfStudy: user.yearOfStudy ?? '',
            employmentStatus: user.employmentStatus || '',
            currentOccupation: user.currentOccupation || '',
            yearsExperience: user.yearsExperience ?? '',
            preferredLanguage: user.preferredLanguage || 'en',
          });
          const rawPhone = (user.phoneNumber || '').toString();
          const parsedPhoneDigits = rawPhone.startsWith('+268')
            ? rawPhone.slice(4).replace(/\D/g, '').slice(0, 8)
            : rawPhone.replace(/\D/g, '').slice(0, 8);
          phoneDigitsRef.current = parsedPhoneDigits;
          if (phoneInputRef.current) phoneInputRef.current.value = parsedPhoneDigits;
          setWorkplace({
            name: user.workplaceName || '',
            institutionId: user.workplaceInstitutionId || null,
          });
          setOccupation({
            name: user.currentOccupation || '',
            occupationId: user.currentOccupationId || null,
          });
          setInstitution({
            name: user.currentInstitution || user.institution?.name || '',
            institutionId: user.institutionId || null,
          });
          setDistrict(user.district || '');
        }
      } catch (err) {
        setUserData({});
      }
    };
    fetchUserData();
  }, [reset]);

  useEffect(() => {
    const fetchEducationLevels = async () => {
      setEducationLevelsLoading(true);
      try {
        const res = await api.get('/api/v1/education-levels');
        setEducationLevels(res.data?.data?.educationLevels || []);
      } catch { /* silent */ }
      finally { setEducationLevelsLoading(false); }
    };
    fetchEducationLevels();
  }, []);

  const onSubmit = async (data) => {
    setIsSavingProfile(true);
    setSaveStatus(null);
    const normalizedPhone = phoneDigitsRef.current ? `+268${phoneDigitsRef.current}` : null;
    const normalizeText = (value) => {
      if (value === null || value === undefined) return null;
      const txt = String(value).trim();
      return txt.length > 0 ? txt : null;
    };
    const requiredFieldNames = [
      'gender', 'region', 'district', 'address', 'educationLevel', 'gradeLevel',
      'preferredLanguage', 'currentInstitution', 'degreeProgram', 'yearOfStudy',
      'currentOccupation', 'workplaceName', 'yearsExperience'
    ];
    clearErrors(requiredFieldNames);

    if (isTestTaker) {
      const validationErrors = {};
      const requireValue = (name, value, label) => {
        if (value === null || value === undefined || String(value).trim() === '') {
          validationErrors[name] = `${label} is required.`;
        }
      };

      requireValue('gender', data.gender, 'Gender');
      requireValue('region', data.region, 'Region');
      requireValue('district', district, 'District or town');
      requireValue('address', data.address, 'Address');
      requireValue('educationLevel', data.educationLevel, 'Education level');
      requireValue('gradeLevel', data.gradeLevel, 'Current or highest grade');
      requireValue('preferredLanguage', data.preferredLanguage, 'Preferred language');

      if (canEditInstitution) {
        requireValue('currentInstitution', institution.name, isHighSchoolTaker ? 'Current school' : 'Current institution');
      }
      if (isUniversityTaker) {
        requireValue('degreeProgram', data.degreeProgram, 'Degree programme');
        requireValue('yearOfStudy', data.yearOfStudy, 'Year of study');
      }
      if (isProfessionalTaker) {
        requireValue('currentOccupation', occupation.name, 'Current occupation');
        requireValue('workplaceName', workplace.name, 'Workplace or employer');
        requireValue('yearsExperience', data.yearsExperience, 'Years of experience');
      }

      const pairMessage = educationPairError({
        educationLevelId: data.educationLevel,
        gradeLevel: data.gradeLevel,
        educationLevels,
      });
      if (pairMessage) {
        validationErrors.educationLevel = pairMessage;
        validationErrors.gradeLevel = pairMessage;
      }

      if (Object.keys(validationErrors).length > 0) {
        Object.entries(validationErrors).forEach(([name, message]) => {
          setError(name, { type: 'manual', message });
        });
        setSaveStatus({
          type: 'error',
          message: 'Could not save profile. Complete the highlighted required fields.'
        });
        setIsSavingProfile(false);
        requestAnimationFrame(() => {
          document.querySelector('[aria-invalid="true"]')?.focus();
        });
        return;
      }
    }

    if (phoneDigitsRef.current && phoneDigitsRef.current.length !== 8) {
      setPhoneError('Phone number must have 8 digits after +268.');
      setSaveStatus({ type: 'error', message: 'Could not save: phone number must have 8 digits after +268.' });
      setIsSavingProfile(false);
      return;
    }
    const payload = {
      phoneNumber: normalizedPhone,
      region: data.region || null,
      district: normalizeText(district),
      address: normalizeText(data.address),
      preferredLanguage: data.preferredLanguage || 'en',
    };

    if (isTestTaker) {
      Object.assign(payload, {
        gender: data.gender,
        educationLevel: data.educationLevel || null,
        gradeLevel: normalizeText(data.gradeLevel),
        employmentStatus: data.employmentStatus || null,
      });

      if (canEditInstitution) {
        Object.assign(payload, {
          currentInstitution: normalizeText(institution.name),
          institutionId: institution.institutionId || null,
        });
      }

      if (isUniversityTaker) {
        Object.assign(payload, {
          degreeProgram: normalizeText(data.degreeProgram),
          yearOfStudy: data.yearOfStudy === '' || data.yearOfStudy === null || data.yearOfStudy === undefined
            ? null
            : Number(data.yearOfStudy),
        });
      }

      if (isProfessionalTaker) {
        Object.assign(payload, {
          currentOccupation: normalizeText(occupation.name),
          currentOccupationId: occupation.occupationId || null,
          yearsExperience: data.yearsExperience === '' || data.yearsExperience === null || data.yearsExperience === undefined
            ? null
            : Number(data.yearsExperience),
          workplaceName: normalizeText(workplace.name),
          workplaceInstitutionId: workplace.institutionId || null,
        });
      }
    }
    try {
      const res = await api.patch('/api/v1/auth/me', payload);
      const updatedUser = res.data?.data?.user || res.data?.user || null;
      if (updatedUser) {
        setUserData(updatedUser);
        if (setSession) setSession(null, updatedUser);
      } else {
        setUserData((prev) => ({ ...prev, ...payload }));
      }
      const savedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSaveStatus({ type: 'success', message: `Profile saved successfully at ${savedAt}.` });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: err.uiMessage || 'Failed to save changes. Please try again.'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onInvalidProfile = (formErrors) => {
    const firstError = Object.values(formErrors || {})[0];
    const message = firstError?.message || 'Could not save profile. Please review highlighted fields.';
    setSaveStatus({ type: 'error', message });
    setIsSavingProfile(false);
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
      setSaveStatus({
        type: 'error',
        message: err.uiMessage || 'Export failed'
      });
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const pwRefs = useRef({ current: null, newPw: null, confirm: null });
  const [pwStatus, setPwStatus] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const currentPw = pwRefs.current.current?.value || '';
    const newPw = pwRefs.current.newPw?.value || '';
    const confirmPw = pwRefs.current.confirm?.value || '';

    if (!currentPw || !newPw || !confirmPw) {
      setPwStatus({ type: 'error', msg: 'All fields are required.' }); return;
    }
    if (newPw.length < 6) {
      setPwStatus({ type: 'error', msg: 'New password must be at least 6 characters.' }); return;
    }
    if (newPw !== confirmPw) {
      setPwStatus({ type: 'error', msg: 'New passwords do not match.' }); return;
    }
    setPwSaving(true); setPwStatus(null);
    try {
      await api.post('/api/v1/auth/change-password', {
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: confirmPw
      });
      setPwStatus({ type: 'success', msg: 'Password changed successfully.' });
      if (pwRefs.current.current) pwRefs.current.current.value = '';
      if (pwRefs.current.newPw) pwRefs.current.newPw.value = '';
      if (pwRefs.current.confirm) pwRefs.current.confirm.value = '';
    } catch (err) {
      setPwStatus({ type: 'error', msg: err.uiMessage || 'Failed to change password.' });
    } finally { setPwSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await api.delete('/api/v1/auth/users/me/account');
      window.location.href = '/';
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: err.uiMessage || 'Deletion failed'
      });
      setIsDeleting(false);
    }
  };

  const displayName = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ').trim()
    || userData?.firstName
    || userData?.email
    || userData?.phoneNumber
    || 'User';
  const initials = (displayName || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const SectionCard = ({ icon: Icon, title, children }) => (
    <div className="rounded-md border p-5" style={{ borderColor: GOV.border, backgroundColor: 'white' }}>
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: `1px solid ${GOV.borderLight}` }}>
        {Icon && <Icon size={16} style={{ color: GOV.blue }} />}
        <h2 className={TYPO.sectionTitle} style={{ color: GOV.text }}>{title}</h2>
      </div>
      {children}
    </div>
  );

  const FieldLabel = ({ children }) => (
    <label className={`block mb-1 ${TYPO.label}`} style={{ color: GOV.text }}>{children}</label>
  );

  const FieldError = ({ error }) =>
    error ? <p className="mt-1" style={{ color: GOV.error, fontSize: '0.75rem' }}>{error.message}</p> : null;

  const regionField = register('region');
  const rc = ROLE_COLORS[role] || ROLE_COLORS['Test Taker'];
  const backTo = role === 'System Administrator' || role === 'Test Administrator' ? '/admin/dashboard' : '/dashboard';
  const displayUserType = USER_TYPE_LABELS[userType] || userType;
  const assignedInstitutionName = userData?.institution?.name || userData?.currentInstitution || '';
  const workplaceDisplayName = userData?.workplace?.name || userData?.workplaceName || '';

  if (!userData) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center" style={{ color: GOV.textMuted }}>
          Loading profile...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard', to: backTo }, { label: 'Profile' }]}>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Profile header */}
        <div className="bg-white rounded-md border p-5" style={{ borderColor: GOV.border }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={TYPO.pageTitle} style={{ color: GOV.text }}>Profile Information</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                  {displayName} {userData?.email ? `· ${userData.email}` : ''}
                </p>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                  style={{ backgroundColor: rc.bg, color: rc.text }}
                >
                  {rc.label}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}>
              {initials}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalidProfile)} className="space-y-5">
          {saveStatus?.message && (
            <div
              className="rounded-md border px-3 py-2 text-sm"
              style={
                saveStatus.type === 'success'
                  ? { borderColor: '#86efac', backgroundColor: '#f0fdf4', color: '#166534' }
                  : { borderColor: '#fecaca', backgroundColor: '#fef2f2', color: '#b91c1c' }
              }
            >
              {saveStatus.message}
            </div>
          )}
          {/* Personal Information Section */}
          <SectionCard icon={User} title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {isTestTaker && (
                <div>
                  <FieldLabel>Gender *</FieldLabel>
                  <select
                    {...register('gender')}
                    className={inputFocusClass}
                    style={{ ...inputStyle, ...(errors.gender ? errorInputStyle : {}) }}
                    aria-invalid={errors.gender ? 'true' : 'false'}
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <FieldError error={errors.gender} />
                </div>
              )}

              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <div
                  className="w-full py-2 flex items-center gap-1.5"
                  style={{ ...inputStyle, ...(phoneError ? errorInputStyle : {}) }}
                >
                  <span className="text-sm font-medium" style={{ color: GOV.textMuted }}>+268</span>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="numeric"
                    onChange={handlePhoneNumberChange}
                    placeholder="XXXXXXXX"
                    autoComplete="tel-national"
                    className="flex-1 bg-transparent focus:outline-none focus:ring-0 text-sm"
                    style={{ color: GOV.text }}
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1" style={{ color: GOV.error, fontSize: '0.75rem' }}>{phoneError}</p>
                ) : null}
              </div>

              <div>
                <FieldLabel>Region</FieldLabel>
                <select
                  {...regionField}
                  onChange={(e) => {
                    regionField.onChange(e);
                    setDistrict('');
                    if (isHighSchoolTaker) {
                      setInstitution({ name: '', institutionId: null });
                    }
                  }}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.region ? errorInputStyle : {}) }}
                  aria-invalid={errors.region ? 'true' : 'false'}
                >
                  <option value="">Select Region</option>
                  <option value="hhohho">Hhohho</option>
                  <option value="manzini">Manzini</option>
                  <option value="lubombo">Lubombo</option>
                  <option value="shiselweni">Shiselweni</option>
                </select>
                <FieldError error={errors.region} />
              </div>

              <div>
                <FieldLabel>District / Town</FieldLabel>
                  <DistrictSearchInput
                    value={district}
                    onChange={(name) => setDistrict(name)}
                  region={selectedRegion}
                  placeholder="Search for district or town..."
                    error={!!errors.district}
                    inputId="profile-district"
                    errorId={errors.district ? 'profile-district-error' : undefined}
                  />
                <div id="profile-district-error"><FieldError error={errors.district} /></div>
              </div>

              <div>
                <FieldLabel>Address</FieldLabel>
                <input
                  {...register('address')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.address ? errorInputStyle : {}) }}
                  aria-invalid={errors.address ? 'true' : 'false'}
                />
                <FieldError error={errors.address} />
              </div>
            </div>
          </SectionCard>

          {isTestTaker && (
            <SectionCard icon={GraduationCap} title={isProfessionalTaker ? 'Education & Qualifications' : 'Education'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Education Level</FieldLabel>
                  <select
                    {...register('educationLevel')}
                    className={inputFocusClass}
                    style={{ ...inputStyle, ...(errors.educationLevel ? errorInputStyle : {}) }}
                    disabled={educationLevelsLoading}
                    aria-invalid={errors.educationLevel ? 'true' : 'false'}
                  >
                    <option value="">Select Education Level</option>
                    {educationLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.description}
                      </option>
                    ))}
                  </select>
                  <FieldError error={errors.educationLevel} />
                </div>

                <div>
                  <FieldLabel>Current or Highest Grade</FieldLabel>
                  <select
                    {...register('gradeLevel')}
                    className={inputFocusClass}
                    style={{ ...inputStyle, ...(errors.gradeLevel ? errorInputStyle : {}) }}
                    aria-invalid={errors.gradeLevel ? 'true' : 'false'}
                  >
                    <option value="">Select grade or qualification</option>
                    {GRADE_LEVEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <FieldError error={errors.gradeLevel} />
                </div>

                {canEditInstitution && (
                  <div className="md:col-span-2">
                    <FieldLabel>{isHighSchoolTaker ? 'Current School' : 'Current Institution'}</FieldLabel>
                    <InstitutionSearchInput
                      value={institution.name}
                      institutionId={institution.institutionId}
                      onChange={(name, id) => setInstitution({ name, institutionId: id })}
                      placeholder={isHighSchoolTaker ? 'Search for your high school...' : 'Search for your tertiary institution...'}
                      region=""
                      type={institutionTypeFilter}
                      userType={institutionUserTypeFilter}
                      error={!!errors.currentInstitution}
                      inputId="profile-institution"
                      errorId={errors.currentInstitution ? 'profile-institution-error' : undefined}
                    />
                    <div id="profile-institution-error"><FieldError error={errors.currentInstitution} /></div>
                  </div>
                )}

                {isUniversityTaker && (
                  <>
                    <div>
                      <FieldLabel>Degree / Programme</FieldLabel>
                      <input
                        {...register('degreeProgram')}
                        className={inputFocusClass}
                        style={{ ...inputStyle, ...(errors.degreeProgram ? errorInputStyle : {}) }}
                        aria-invalid={errors.degreeProgram ? 'true' : 'false'}
                        placeholder="e.g. BSc Computer Science"
                      />
                      <FieldError error={errors.degreeProgram} />
                    </div>
                    <div>
                      <FieldLabel>Year of Study</FieldLabel>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        {...register('yearOfStudy')}
                        className={inputFocusClass}
                        style={{ ...inputStyle, ...(errors.yearOfStudy ? errorInputStyle : {}) }}
                        aria-invalid={errors.yearOfStudy ? 'true' : 'false'}
                      />
                      <FieldError error={errors.yearOfStudy} />
                    </div>
                  </>
                )}
              </div>
            </SectionCard>
          )}

          {isProfessionalTaker && (
            <SectionCard icon={Briefcase} title="Career Background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Employment Status</FieldLabel>
                  <select
                    {...register('employmentStatus')}
                    className={inputFocusClass}
                    style={{ ...inputStyle, ...(errors.employmentStatus ? errorInputStyle : {}) }}
                  >
                    <option value="">Select Employment Status</option>
                    <option value="student">Student</option>
                    <option value="employed">Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="self_employed">Self-Employed</option>
                    <option value="other">Other</option>
                  </select>
                  <FieldError error={errors.employmentStatus} />
                </div>

                <div>
                  <FieldLabel>Years of Experience</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    {...register('yearsExperience')}
                    className={inputFocusClass}
                    style={{ ...inputStyle, ...(errors.yearsExperience ? errorInputStyle : {}) }}
                    aria-invalid={errors.yearsExperience ? 'true' : 'false'}
                  />
                  <FieldError error={errors.yearsExperience} />
                </div>

                <div>
                  <FieldLabel>Current Occupation</FieldLabel>
                  <OccupationSearchInput
                    value={occupation.name}
                    occupationId={occupation.occupationId}
                    onChange={(name, id) => setOccupation({ name, occupationId: id })}
                    placeholder="Search for your occupation..."
                    error={!!errors.currentOccupation}
                    inputId="profile-occupation"
                    errorId={errors.currentOccupation ? 'profile-occupation-error' : undefined}
                  />
                  <div id="profile-occupation-error"><FieldError error={errors.currentOccupation} /></div>
                </div>

                <div>
                  <FieldLabel>Workplace / Employer</FieldLabel>
                  <WorkplaceSearchInput
                    value={workplace.name}
                    institutionId={workplace.institutionId}
                    onChange={(name, id) => setWorkplace({ name, institutionId: id })}
                    placeholder="Search for your employer or organisation..."
                    error={!!errors.workplaceName}
                    inputId="profile-workplace"
                    errorId={errors.workplaceName ? 'profile-workplace-error' : undefined}
                  />
                  <div id="profile-workplace-error"><FieldError error={errors.workplaceName} /></div>
                  <p className="mt-1" style={{ color: GOV.textHint, fontSize: '0.75rem' }}>
                    Type to search registered organisations, or enter your workplace name.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {isStaff && role === 'Test Administrator' && (
            <SectionCard icon={GraduationCap} title="Assigned Institution">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Institution</p>
                  <p className="text-sm font-semibold" style={{ color: GOV.text }}>
                    {assignedInstitutionName || 'Not assigned'}
                  </p>
                  <p className={TYPO.hint} style={{ color: GOV.textHint }}>
                    This assignment controls student imports, login cards, and counselor reporting scope.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Preferences Section */}
          <SectionCard icon={Settings} title="Preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Preferred Language</FieldLabel>
                <select
                  {...register('preferredLanguage')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.preferredLanguage ? errorInputStyle : {}) }}
                  aria-invalid={errors.preferredLanguage ? 'true' : 'false'}
                >
                  <option value="en">English</option>
                  <option value="ss">SiSwati</option>
                </select>
                <FieldError error={errors.preferredLanguage} />
              </div>
            </div>
          </SectionCard>

          {/* Accessibility Settings Section */}
          <SectionCard icon={Settings} title="Accessibility Settings">
            <p className={`${TYPO.bodySmall} mb-4`} style={{ color: GOV.textMuted }}>
              Customize your experience with accessibility options. These settings apply across pages and sync to your profile.
            </p>
            <button
              type="button"
              onClick={() => setShowAccessibilityDialog(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors hover:scale-[1.02] active:scale-[0.98]"
              style={{
                borderColor: GOV.border,
                backgroundColor: 'transparent',
                color: GOV.text
              }}
            >
              <Monitor className="w-5 h-5" style={{ color: GOV.blue }} />
              <span className="font-medium">Configure Accessibility Settings</span>
            </button>
            <p className={`${TYPO.bodySmall} mt-2`} style={{ color: GOV.textMuted }}>
              Or visit the dedicated <a href="/accessibility" className="underline" style={{ color: GOV.blue }}>Accessibility page</a> for more options.
            </p>
          </SectionCard>

          {/* Save button */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: GOV.blue }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = GOV.blueHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = GOV.blue}
            >
              <Save size={14} /> {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Account & Security Section */}
        <SectionCard icon={Shield} title="Account & Security">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Role</p>
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                style={{ backgroundColor: rc.bg, color: rc.text }}
              >
                {rc.label}
              </span>
            </div>
            {displayUserType && (
              <div>
                <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Profile Type</p>
                <p className="text-sm" style={{ color: GOV.text }}>{displayUserType}</p>
              </div>
            )}
            <div>
              <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Email Verified</p>
              <p className="text-sm flex items-center gap-1" style={{ color: GOV.text }}>
                <Mail size={12} style={{ color: userData?.isEmailVerified ? '#059669' : GOV.error }} />
                {userData?.isEmailVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
            <div>
              <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Account Status</p>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                userData?.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                {userData?.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Member Since</p>
              <p className="text-sm flex items-center gap-1" style={{ color: GOV.text }}>
                <Clock size={12} style={{ color: GOV.textMuted }} />
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '–'}
              </p>
            </div>
            {assignedInstitutionName && !isProfessionalTaker && (
              <div>
                <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>
                  {role === 'Test Administrator' ? 'Assigned Institution' : 'Institution'}
                </p>
                <p className="text-sm" style={{ color: GOV.text }}>{assignedInstitutionName}</p>
              </div>
            )}
            {workplaceDisplayName && isProfessionalTaker && (
              <div>
                <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Workplace</p>
                <p className="text-sm" style={{ color: GOV.text }}>{workplaceDisplayName}</p>
              </div>
            )}
            {userData?.lastLogin && (
              <div>
                <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Last Login</p>
                <p className="text-sm" style={{ color: GOV.text }}>{new Date(userData.lastLogin).toLocaleString()}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Change Password Section */}
        <SectionCard icon={Key} title="Change Password">
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            {(['current', 'newPw', 'confirm']).map((field) => {
              const labels = { current: 'Current Password', newPw: 'New Password', confirm: 'Confirm New Password' };
              return (
                <div key={field}>
                  <FieldLabel>{labels[field]}</FieldLabel>
                  <div className="relative">
                    <input
                      type={showPw[field] ? 'text' : 'password'}
                      ref={(el) => { pwRefs.current[field] = el; }}
                      className={inputFocusClass + ' pr-9'}
                      style={inputStyle}
                      autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      aria-label={`${showPw[field] ? 'Hide' : 'Show'} ${labels[field].toLowerCase()}`}
                      aria-pressed={showPw[field]}
                    >
                      {showPw[field]
                        ? <EyeOff className="w-4 h-4" style={{ color: GOV.textMuted }} />
                        : <Eye className="w-4 h-4" style={{ color: GOV.textMuted }} />}
                    </button>
                  </div>
                </div>
              );
            })}
            {pwStatus && (
              <p className="text-xs font-medium" style={{ color: pwStatus.type === 'error' ? GOV.error : '#059669' }}>
                {pwStatus.msg}
              </p>
            )}
            <button type="submit" disabled={pwSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: GOV.blue }}>
              <Key size={13} /> {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </SectionCard>

        {/* Data subject rights */}
        <div className="rounded-md border p-5" style={{ borderColor: GOV.border, backgroundColor: 'white' }}>
          <h2 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Your data rights</h2>
          <p className={`mt-1 mb-4 ${TYPO.body}`} style={{ color: GOV.textMuted }}>
            Under data protection law you can request a copy of your data{canDeleteAccount ? ' or request account deletion' : ''}.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 bg-white"
              style={{ color: GOV.text }}
            >
              <Download size={14} /> Export my data
            </button>
            {canDeleteAccount && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="form-control w-48"
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || isDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ backgroundColor: GOV.error }}
                >
                  <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete account'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Accessibility Dialog */}
      <AccessibilityDialog 
        isOpen={showAccessibilityDialog}
        onClose={() => setShowAccessibilityDialog(false)}
      />
    </AppShell>
  );
}
