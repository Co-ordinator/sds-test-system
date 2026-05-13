import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Globe, User, Building2, Pencil, Check, Search, GraduationCap, BookOpen, Briefcase, ChevronLeft } from 'lucide-react';
import { GOV, TYPO } from '../theme/government';
import WorkplaceSearchInput from '../components/ui/WorkplaceSearchInput';
import OccupationSearchInput from '../components/ui/OccupationSearchInput';
import InstitutionSearchInput from '../components/ui/InstitutionSearchInput';
import { profileNeedsOnboarding } from '../utils/profileOnboarding';

const USER_TYPE_META = {
  school_student: { label: 'High School Student', Icon: GraduationCap, color: '#F44336', step2Label: 'Your School', step3Label: 'Academic Details', description: 'Discover careers and choose the right subjects for your future.' },
  university_student: { label: 'University Student', Icon: BookOpen, color: '#7FBEEB', iconColor: '#2D8BC4', step2Label: 'Your University', step3Label: 'Programme Details', description: 'Explore specialisations and graduate career pathways.' },
  professional: { label: 'Professional', Icon: Briefcase, color: '#FFEB3B', iconColor: '#111827', step2Label: 'Your Organisation', step3Label: 'Career Background', description: 'Find new opportunities and plan your career transition.' },
};

const USER_TYPE_OPTIONS = [
  { id: 'school_student', ...USER_TYPE_META.school_student },
  { id: 'university_student', ...USER_TYPE_META.university_student },
  { id: 'professional', ...USER_TYPE_META.professional }
];

const BACKEND_TO_FRONTEND_USER_TYPE = {
  'High School Student': 'school_student',
  'University Student': 'university_student',
  Professional: 'professional',
  school_student: 'school_student',
  university_student: 'university_student',
  professional: 'professional',
};

const normalizeUserType = (value) => BACKEND_TO_FRONTEND_USER_TYPE[value] || '';

const GENDERS = ['Male', 'Female'];
const LANGUAGES = ['English', 'SiSwati'];
const GRADES = [
  'Form 3 (Junior Secondary)',
  'Form 5 / O-Level (Senior Secondary)',
  'A-Level',
  'Certificate / Diploma',
  "Bachelor's degree",
  'Postgraduate',
];

const ESWATINI_REGIONS = ['Hhohho', 'Manzini', 'Lubombo', 'Shiselweni'];
const REGION_TO_BACKEND = { Hhohho: 'hhohho', Manzini: 'manzini', Lubombo: 'lubombo', Shiselweni: 'shiselweni' };
const REGION_FROM_BACKEND = { hhohho: 'Hhohho', manzini: 'Manzini', lubombo: 'Lubombo', shiselweni: 'Shiselweni' };
const LANGUAGE_TO_BACKEND = { English: 'en', SiSwati: 'ss' };
const LANGUAGE_FROM_BACKEND = { en: 'English', ss: 'SiSwati' };
const GENDER_FROM_BACKEND = { male: 'Male', female: 'Female' };
const DEFAULT_GRADE = 'Form 5 / O-Level (Senior Secondary)';
const ESWATINI_TOWNS = [
  'Big Bend',
  'Bhunya',
  'Bulembu',
  'Ezulwini',
  'Hlatikulu',
  'Hluti',
  'Kubuta',
  'Kwaluseni',
  'Lavumisa',
  'Lobamba',
  'Malkerns',
  'Mankayane',
  'Manzini',
  'Matsapha',
  'Mbabane',
  'Mhlambanyatsi',
  'Mhlume',
  'Mondi',
  'Mpaka',
  'Ngwenya',
  'Ngomane',
  'Nhlangano',
  'Nsoko',
  'Piggs Peak',
  'Sidvokodvo',
  'Simunye',
  'Siteki',
  'Tabankulu',
  'Tjaneni',
  'Vuvulane',
  'Other',
];

const isBlank = (value) => String(value ?? '').trim() === '';
const hasSelectionValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const buildInitialForm = (user = {}) => ({
  fullName: [user.firstName, user.lastName].filter((part) => !isBlank(part)).join(' '),
  gender: GENDER_FROM_BACKEND[user.gender] || '',
  region: REGION_FROM_BACKEND[user.region] || 'Hhohho',
  townCity: user.district || '',
  areaNeighborhood: user.address || '',
  schoolUniversity: user.currentInstitution || '',
  institutionId: user.institutionId || null,
  workplaceName: user.workplaceName || '',
  workplaceInstitutionId: user.workplaceInstitutionId || null,
  preferredLanguage: LANGUAGE_FROM_BACKEND[user.preferredLanguage] || 'English',
  highestGrade: user.gradeLevel || DEFAULT_GRADE,
  degreeProgram: user.degreeProgram || '',
  yearOfStudy: hasSelectionValue(user.yearOfStudy) ? String(user.yearOfStudy) : '',
  currentOccupation: user.currentOccupation || '',
  currentOccupationId: user.currentOccupationId || null,
  yearsExperience: hasSelectionValue(user.yearsExperience) ? String(user.yearsExperience) : '',
});

export default function Onboarding() {
  const navigate = useNavigate();
  const { setSession, user } = useAuth();
  const [selectedUserType, setSelectedUserType] = useState(() => normalizeUserType(user?.userType));
  const userType = selectedUserType;
  const typeMeta = USER_TYPE_META[userType] || null;
  const [step, setStep] = useState(0);
  const [townQuery, setTownQuery] = useState('');
  const [townDropdownOpen, setTownDropdownOpen] = useState(false);
  const townDropdownRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState(() => buildInitialForm(user || {}));
  const [errors, setErrors] = useState({});
  const institutionTypeFilter = userType === 'school_student'
    ? 'school'
    : userType === 'university_student'
      ? 'university,college,tvet,vocational'
      : '';

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (submitError) setSubmitError('');
  };

  const filteredTowns = ESWATINI_TOWNS.filter((t) =>
    t.toLowerCase().includes(townQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (townDropdownRef.current && !townDropdownRef.current.contains(e.target)) {
        setTownDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectUserType = (id) => {
    setSelectedUserType(id);
    setSubmitError('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.userType;
      return next;
    });
  };

  const addRequired = (target, key, label) => {
    if (isBlank(form[key])) target[key] = `${label} is required.`;
  };

  const getStepErrors = (stepNumber) => {
    const next = {};

    if (stepNumber === 0) {
      if (!selectedUserType) next.userType = 'Select whether you are a high school student, tertiary student, or professional.';
      return next;
    }

    if (stepNumber === 1) {
      addRequired(next, 'fullName', 'Full legal name');
      if (!next.fullName && form.fullName.trim().split(/\s+/).length < 2) {
        next.fullName = 'Enter both first name and surname.';
      }
      addRequired(next, 'gender', 'Gender');
      return next;
    }

    if (stepNumber === 2) {
      addRequired(next, 'region', 'Region');
      addRequired(next, 'townCity', 'Town or city');
      addRequired(next, 'areaNeighborhood', 'Area or neighborhood');

      if (userType === 'professional') {
        addRequired(next, 'workplaceName', 'Workplace or employer');
      } else {
        addRequired(next, 'schoolUniversity', 'Institution');
        if (!next.schoolUniversity && !form.institutionId) {
          next.schoolUniversity = 'Select your institution from the search results.';
        }
      }
      return next;
    }

    if (stepNumber === 3) {
      addRequired(next, 'preferredLanguage', 'Preferred language');
      addRequired(next, 'highestGrade', 'Current or highest grade');

      if (userType === 'university_student') {
        addRequired(next, 'degreeProgram', 'Degree programme');
        addRequired(next, 'yearOfStudy', 'Year of study');
      }

      if (userType === 'professional') {
        addRequired(next, 'currentOccupation', 'Current occupation');
        addRequired(next, 'yearsExperience', 'Years of experience');
      }

      return next;
    }

    return next;
  };

  const validateStep = (stepNumber = step) => {
    const next = getStepErrors(stepNumber);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setSubmitError('Please complete the required fields before continuing.');
      return false;
    }
    setSubmitError('');
    return true;
  };

  const validateAllSteps = () => {
    const allErrors = {};
    let firstInvalidStep = null;

    [0, 1, 2, 3].forEach((stepNumber) => {
      const stepErrors = getStepErrors(stepNumber);
      if (Object.keys(stepErrors).length > 0 && firstInvalidStep === null) {
        firstInvalidStep = stepNumber;
      }
      Object.assign(allErrors, stepErrors);
    });

    setErrors(allErrors);
    if (firstInvalidStep !== null) {
      setStep(firstInvalidStep);
      setSubmitError('Complete all required fields before submitting your profile.');
      return false;
    }
    setSubmitError('');
    return true;
  };

  const fieldError = (name) => errors[name]
    ? <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors[name]}</p>
    : null;

  const fieldBorder = (name) => errors[name] ? GOV.error : GOV.border;

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigate('/');
  };

  const buildProfilePayload = () => {
    const fullName = (form.fullName || '').trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    
    // Map userType to backend enum values
    const userTypeMap = {
      'school_student': 'High School Student',
      'university_student': 'University Student',
      'professional': 'Professional'
    };
    
    return {
      firstName: firstName || null,
      lastName: lastName || null,
      gender: form.gender === 'Male' ? 'male' : form.gender === 'Female' ? 'female' : null,
      region: REGION_TO_BACKEND[form.region] || (form.region ? form.region.toLowerCase() : null),
      district: (form.townCity || '').trim() || null,
      address: (form.areaNeighborhood || '').trim() || null,
      currentInstitution: userType !== 'professional' ? ((form.schoolUniversity || '').trim() || null) : null,
      institutionId: userType !== 'professional' ? (form.institutionId || null) : null,
      workplaceName: userType === 'professional' ? ((form.workplaceName || '').trim() || null) : null,
      workplaceInstitutionId: userType === 'professional' ? (form.workplaceInstitutionId || null) : null,
      preferredLanguage: LANGUAGE_TO_BACKEND[form.preferredLanguage] ?? (form.preferredLanguage === 'SiSwati' ? 'ss' : 'en'),
      gradeLevel: (form.highestGrade || '').trim() || null,
      degreeProgram: (form.degreeProgram || '').trim() || null,
      yearOfStudy: form.yearOfStudy ? parseInt(form.yearOfStudy, 10) : null,
      currentOccupation: (form.currentOccupation || '').trim() || null,
      currentOccupationId: form.currentOccupationId || null,
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience, 10) : null,
      userType: userTypeMap[userType] || null,
    };
  };

  const handleSubmitProfile = async () => {
    if (!validateAllSteps()) return;

    setSubmitError('');
    setSubmitting(true);
    try {
      const payload = buildProfilePayload();
      const res = await api.patch('/api/v1/auth/me', payload);
      const updatedUser = res.data?.data?.user ?? res.data?.user;
      if (updatedUser && setSession) {
        setSession(null, updatedUser);
      }

      if (!updatedUser || profileNeedsOnboarding(updatedUser)) {
        setSubmitError('Your profile is still incomplete. Please check the required fields and submit again.');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { message: 'Please Login to complete your profile.' } });
        return;
      }
      setSubmitError(err?.uiMessage || err?.raw?.response?.data?.message || err?.response?.data?.message || 'Unable to save your profile. Please review the required fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (!validateStep(step)) return;
    if (step < 4) setStep((s) => s + 1);
    else handleSubmitProfile();
  };

  const goToStep = (s) => setStep(s);

  return (
    <OnboardingLayout>
      {/* Step 0: User Type Selection */}
      {step === 0 && (
        <div className="w-full max-w-[440px] mx-auto">
          <div className="w-full bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
            <div className="p-6 space-y-6">
              <div className="mb-2">
                <h1 className={`${TYPO.pageTitle} text-center mb-1`} style={{ color: GOV.text }}>
                  Complete Your Profile
                </h1>
                <p className="text-xs text-center" style={{ color: GOV.textMuted }}>
                  Please select your current status to continue.
                </p>
              </div>

              <div className="space-y-3">
                {USER_TYPE_OPTIONS.map(({ id, label, description, Icon, color, iconColor }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectUserType(id)}
                    className="w-full flex items-center gap-4 p-4 rounded-md border-2 text-left transition-all"
                    style={{
                      borderColor: selectedUserType === id ? color : GOV.border,
                      backgroundColor: selectedUserType === id ? `${color}08` : 'white'
                    }}
                  >
                    <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: iconColor || color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: GOV.text }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: GOV.textMuted }}>{description}</p>
                    </div>
                  </button>
                ))}
              </div>
              {fieldError('userType')}

              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedUserType}
                className={`w-full py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white disabled:opacity-40 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:hover:scale-100`}
                style={{ backgroundColor: GOV.blue }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Tell us about yourself */}
      {step === 1 && (
        <div className="w-full max-w-[440px] mx-auto">
          <div className="w-full bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
            <div className="p-6 space-y-6">
              <div className="mb-2">
                <h1 className={`${TYPO.pageTitle} text-center mb-1`} style={{ color: GOV.text }}>
                  Personal Information
                </h1>
                <p className="text-xs text-center" style={{ color: GOV.textMuted }}>
                  Please provide your personal details as they appear on your national ID.
                </p>
              </div>

          <div className="space-y-6">
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                Full Legal Name *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="e.g. Thabo Dlamini"
                className={`form-control ${TYPO.body}`}
                style={{ borderBottomColor: fieldBorder('fullName'), color: GOV.text }}
              />
              {errors.fullName
                ? fieldError('fullName')
                : <p className={`mt-1 flex items-center gap-1.5 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                    <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ borderColor: GOV.textHint, color: GOV.textHint }}>i</span>
                    Use the name exactly as it appears on your national ID.
                  </p>
              }
            </div>


            <div>
              <label className={`block ${TYPO.label} mb-1.5`} style={{ color: GOV.text }}>
                Gender *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update('gender', g)}
                    className={`py-2.5 px-3 rounded-md border ${TYPO.bodySmall} font-medium transition-colors`}
                    style={{
                      borderColor: form.gender === g ? GOV.blue : fieldBorder('gender'),
                      backgroundColor: form.gender === g ? GOV.blueLight : '#fff',
                      color: GOV.text,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {fieldError('gender')}
            </div>
          </div>

              <p className={`${TYPO.hint} text-center mt-2`} style={{ color: GOV.textMuted }}>
                Your information is secure and used only by the Ministry of Labour and Social Security.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{ borderColor: GOV.border, color: GOV.text }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  className={`flex-1 py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Location & Institution */}
      {step === 2 && (
        <div className="w-full max-w-[440px] mx-auto">
          <div className="w-full bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
            <div className="p-6 space-y-6">
              <div className="mb-2">
                <h1 className={`${TYPO.pageTitle} text-center mb-1`} style={{ color: GOV.text }}>
                  {typeMeta?.step2Label || 'Region and institution'}
                </h1>
                <p className="text-xs text-center" style={{ color: GOV.textMuted }}>
                  Please provide your region and current institution.
                </p>
              </div>

          <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: GOV.borderLight }}>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Region *</label>
                <select
                  value={form.region}
                  onChange={(e) => {
                    update('region', e.target.value);
                    if (userType === 'school_student') {
                      update('schoolUniversity', '');
                      update('institutionId', null);
                    }
                  }}
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: fieldBorder('region'), color: GOV.text }}
                >
                  {ESWATINI_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {fieldError('region')}
              </div>
              <div className="relative" ref={townDropdownRef}>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Town / City *</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: GOV.textHint }} aria-hidden />
                  <input
                    type="text"
                    value={townDropdownOpen ? townQuery : form.townCity}
                    onChange={(e) => {
                      setTownQuery(e.target.value);
                      update('townCity', e.target.value);
                      setTownDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setTownQuery(form.townCity);
                      setTownDropdownOpen(true);
                    }}
                    placeholder="Search or select town..."
                    className={`form-control-with-icon pl-8 ${TYPO.body}`}
                    style={{ borderBottomColor: fieldBorder('townCity'), color: GOV.text }}
                    autoComplete="off"
                  />
                </div>
                {fieldError('townCity')}
                {townDropdownOpen && (
                  <ul
                    className="absolute z-10 left-0 right-0 mt-0.5 py-0.5 rounded-md border overflow-auto max-h-40 bg-white"
                    style={{ borderColor: GOV.border }}
                  >
                    {filteredTowns.length > 0 ? (
                      filteredTowns.map((t) => (
                        <li key={t}>
                          <button
                            type="button"
                            className={`w-full text-left px-3 py-1.5 ${TYPO.bodySmall} hover:bg-gray-100 transition-colors`}
                            style={{ color: GOV.text }}
                            onClick={() => {
                              update('townCity', t);
                              setTownQuery(t);
                              setTownDropdownOpen(false);
                            }}
                          >
                            {t}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className={`px-3 py-2 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                        No town found. Type to search.
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Area / Neighborhood *</label>
                <input
                  type="text"
                  value={form.areaNeighborhood}
                  onChange={(e) => update('areaNeighborhood', e.target.value)}
                  placeholder="e.g. Msunduza, Fonteyn"
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: fieldBorder('areaNeighborhood'), color: GOV.text }}
                />
                {fieldError('areaNeighborhood')}
              </div>
              {userType === 'professional' ? (
                <div className="sm:col-span-2">
                  <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Workplace / Employer *</label>
                  <WorkplaceSearchInput
                    value={form.workplaceName}
                    institutionId={form.workplaceInstitutionId}
                    onChange={(name, id) => {
                      update('workplaceName', name);
                      update('workplaceInstitutionId', id);
                    }}
                    placeholder="Search for your employer or organisation..."
                    error={!!errors.workplaceName}
                  />
                  {fieldError('workplaceName')}
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                    Type to search registered organisations, or enter your workplace name.
                  </p>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current School / University *</label>
                  <InstitutionSearchInput
                    value={form.schoolUniversity}
                    institutionId={form.institutionId}
                    onChange={(name, id) => {
                      update('schoolUniversity', name);
                      update('institutionId', id);
                    }}
                    placeholder={userType === 'school_student'
                      ? 'Search for your high school...'
                      : 'Search for your school or university...'}
                    inputClassName={TYPO.body}
                    region={userType === 'school_student' ? REGION_TO_BACKEND[form.region] : ''}
                    type={institutionTypeFilter}
                    userType={userType}
                    error={!!errors.schoolUniversity}
                  />
                  {fieldError('schoolUniversity')}
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                    Select your institution from the filtered search results.
                  </p>
                </div>
              )}
            </div>
            <div className="px-4 pb-4 pt-1">
              <p className={`flex items-center gap-1.5 ${TYPO.hint}`} style={{ color: GOV.textMuted }}>
                <span className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: GOV.border }}>
                  <Check className="w-2.5 h-2.5" style={{ color: GOV.blue }} />
                </span>
                Your data is stored securely by the Ministry in Eswatini.
              </p>
            </div>
          </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{ borderColor: GOV.border, color: GOV.text }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  className={`flex-1 py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Academic / Language / Career Background */}
      {step === 3 && (
        <div className="w-full max-w-[440px] mx-auto">
          <div className="w-full bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
            <div className="p-6 space-y-6">
              <div className="mb-2">
                <h1 className={`${TYPO.pageTitle} text-center mb-1`} style={{ color: GOV.text }}>
                  {typeMeta?.step3Label || 'Academic & Language'}
                </h1>
                <p className="text-xs text-center" style={{ color: GOV.textMuted }}>
                  {userType === 'professional'
                    ? 'Please provide your career background information.'
                    : 'Please provide your academic and language preferences.'}
                </p>
              </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Preferred Language *</label>
              <select
                value={form.preferredLanguage}
                onChange={(e) => update('preferredLanguage', e.target.value)}
                className={`form-control ${TYPO.body}`}
                style={{ borderBottomColor: fieldBorder('preferredLanguage'), color: GOV.text }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {fieldError('preferredLanguage')}
              <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textHint }}>Default interface language.</p>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current/Highest Grade Passed *</label>
              <select
                value={form.highestGrade}
                onChange={(e) => update('highestGrade', e.target.value)}
                className={`form-control ${TYPO.body}`}
                style={{ borderBottomColor: fieldBorder('highestGrade'), color: GOV.text }}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {fieldError('highestGrade')}
              <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textHint }}>Used for career recommendations.</p>
            </div>
          </div>

          {/* University-specific fields */}
          {userType === 'university_student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: GOV.borderLight }}>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold mb-3" style={{ color: GOV.textMuted }}>Programme details</p>
              </div>
              <div className="sm:col-span-2">
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Degree Programme *</label>
                <input
                  type="text"
                  value={form.degreeProgram}
                  onChange={(e) => update('degreeProgram', e.target.value)}
                  placeholder="e.g. Bachelor of Commerce in Accounting"
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: fieldBorder('degreeProgram'), color: GOV.text }}
                />
                {fieldError('degreeProgram')}
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Year of Study *</label>
                <select
                  value={form.yearOfStudy}
                  onChange={(e) => update('yearOfStudy', e.target.value)}
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: fieldBorder('yearOfStudy'), color: GOV.text }}
                >
                  <option value="">-- Select --</option>
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
                {fieldError('yearOfStudy')}
              </div>
            </div>
          )}

          {/* Professional-specific fields */}
          {userType === 'professional' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: GOV.borderLight }}>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold mb-3" style={{ color: GOV.textMuted }}>Career background</p>
              </div>
              <div className="sm:col-span-2">
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current Occupation *</label>
                <OccupationSearchInput
                  value={form.currentOccupation}
                  occupationId={form.currentOccupationId}
                  onChange={(name, id) => {
                    update('currentOccupation', name);
                    update('currentOccupationId', id);
                  }}
                  placeholder="Search for your occupation..."
                  inputClassName={TYPO.body}
                  error={!!errors.currentOccupation}
                />
                {fieldError('currentOccupation')}
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Years of Experience *</label>
                <select
                  value={form.yearsExperience}
                  onChange={(e) => update('yearsExperience', e.target.value)}
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: fieldBorder('yearsExperience'), color: GOV.text }}
                >
                  <option value="">-- Select --</option>
                  {[1,2,3,4,5,6,7,8,9,10,15,20].map(y => <option key={y} value={y}>{y}{y === 20 ? '+' : ''} year{y !== 1 ? 's' : ''}</option>)}
                </select>
                {fieldError('yearsExperience')}
              </div>
            </div>
          )}

              <p className={`${TYPO.hint} text-center mt-2`} style={{ color: GOV.textMuted }}>
                You can update these details later in your account settings.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{ borderColor: GOV.border, color: GOV.text }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  className={`flex-1 py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Summary Review */}
      {step === 4 && (
        <div className="w-full max-w-[440px] mx-auto">
          <div className="w-full bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
            <div className="p-6 space-y-6">
              <div className="mb-2">
                <h1 className={`${TYPO.pageTitle} text-center mb-1`} style={{ color: GOV.text }}>
                  Review Your Profile
                </h1>
                <p className="text-xs text-center" style={{ color: GOV.textMuted }}>
                  Please review your information before submitting.
                </p>
              </div>

          <div className="bg-white border rounded-md overflow-hidden" style={{ borderColor: GOV.border }}>
            <div className="border-b" style={{ borderColor: GOV.border }}>
              <div className="flex items-center justify-between px-4 py-2.5 bg-white" style={{ borderColor: GOV.border }}>
                <h2 className={TYPO.label} style={{ color: GOV.text }}>Personal Details</h2>
                <button type="button" onClick={() => goToStep(1)} className={`${TYPO.bodySmall} font-medium hover:underline transition-colors duration-150`} style={{ color: GOV.blue }}>
                  Edit
                </button>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} w-1/3`} style={{ color: GOV.textHint }}>Full name</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.fullName || '-'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Gender</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.gender || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-b" style={{ borderColor: GOV.border }}>
              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <h2 className={TYPO.label} style={{ color: GOV.text }}>{typeMeta?.step2Label || 'Region and institution'}</h2>
                <button type="button" onClick={() => goToStep(2)} className={`${TYPO.hint} font-medium hover:underline transition-colors duration-150`} style={{ color: GOV.blue }}>
                  Edit
                </button>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} w-1/3`} style={{ color: GOV.textHint }}>Region</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.region || '-'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Town / City</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.townCity || '-'}</td>
                  </tr>
                  {userType === 'professional' ? (
                    <tr className="border-b" style={{ borderColor: GOV.border }}>
                      <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Workplace</td>
                      <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.workplaceName || '-'}</td>
                    </tr>
                  ) : (
                    <tr className="border-b" style={{ borderColor: GOV.border }}>
                      <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>School / University</td>
                      <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.schoolUniversity || '-'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-white" style={{ borderColor: GOV.border }}>
                <h2 className={TYPO.label} style={{ color: GOV.text }}>Academic</h2>
                <button type="button" onClick={() => goToStep(3)} className={`${TYPO.hint} font-medium hover:underline transition-colors duration-150`} style={{ color: GOV.blue }}>
                  Edit
                </button>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} w-1/3`} style={{ color: GOV.textHint }}>Preferred language</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.preferredLanguage || '-'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Highest grade passed</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.highestGrade || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

              <p className={`${TYPO.hint} text-center mt-2`} style={{ color: GOV.textMuted }}>
                By submitting, you agree to the Ministry of Labour and Social Security&apos;s data use policy.
              </p>

              {submitError && (
                <div
                  className={`rounded-md px-3 py-2 ${TYPO.hint}`}
                  style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder || '#fecaca'}` }}
                >
                  {submitError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  style={{ borderColor: GOV.border, color: GOV.text }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  {submitting ? 'Submitting...' : 'Submit Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
