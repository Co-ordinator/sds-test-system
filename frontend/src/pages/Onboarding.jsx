import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, Info, Globe, User, Building2, Pencil, Check, Search, GraduationCap, BookOpen, Briefcase } from 'lucide-react';
import { GOV, TYPO } from '../theme/government';

const USER_TYPE_META = {
  school_student: { label: 'High School Student', Icon: GraduationCap, color: '#1e3a5f', step2Label: 'Your School', step3Label: 'Academic Details' },
  university_student: { label: 'University Student', Icon: BookOpen, color: '#2563eb', step2Label: 'Your University', step3Label: 'Programme Details' },
  professional: { label: 'Professional', Icon: Briefcase, color: '#7c3aed', step2Label: 'Your Organisation', step3Label: 'Career Background' },
};

const GENDERS = ['Male', 'Female'];
const LANGUAGES = ['English', 'SiSwati'];
const GRADES = [
  'Form 3 (Junior Secondary)',
  'Form 5 / O-Level (Senior Secondary)',
  'A-Level',
  'Certificate / Diploma',
  'Bachelor’s degree',
  'Postgraduate',
];

const ESWATINI_REGIONS = ['Hhohho', 'Manzini', 'Lubombo', 'Shiselweni'];
const REGION_TO_BACKEND = { Hhohho: 'hhohho', Manzini: 'manzini', Lubombo: 'lubombo', Shiselweni: 'shiselweni' };
const LANGUAGE_TO_BACKEND = { English: 'en', SiSwati: 'ss' };
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
const ESWATINI_INSTITUTIONS = [
  'University of Eswatini (UNESWA)',
  'Southern Africa Nazarene University (SANU)',
  'Limkokwing University of Creative Technology',
  'Eswatini College of Technology',
  'William Pitcher College',
  'Ngwane Teacher Training College',
  'Other',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setSession, user } = useAuth();
  const userType = user?.userType || null;
  const typeMeta = USER_TYPE_META[userType] || null;
  const [step, setStep] = useState(1);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);
  const [townQuery, setTownQuery] = useState('');
  const [townDropdownOpen, setTownDropdownOpen] = useState(false);
  const townDropdownRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    nationalId: '',
    gender: '',
    region: 'Hhohho',
    townCity: '',
    areaNeighborhood: '',
    schoolUniversity: '',
    preferredLanguage: 'English',
    highestGrade: 'Form 5 / O-Level (Senior Secondary)',
    degreeProgram: '',
    yearOfStudy: '',
    currentOccupation: '',
    yearsExperience: '',
  });

  const [step1Errors, setStep1Errors] = useState({});

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const filteredSchools = ESWATINI_INSTITUTIONS.filter((inst) =>
    inst.toLowerCase().includes(schoolQuery.toLowerCase())
  );
  const filteredTowns = ESWATINI_TOWNS.filter((t) =>
    t.toLowerCase().includes(townQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(e.target)) {
        setSchoolDropdownOpen(false);
      }
      if (townDropdownRef.current && !townDropdownRef.current.contains(e.target)) {
        setTownDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigate('/');
  };

  const buildProfilePayload = () => {
    const fullName = (form.fullName || '').trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return {
      firstName: firstName || null,
      lastName: lastName || null,
      nationalId: (form.nationalId || '').trim() || null,
      gender: form.gender === 'Male' ? 'male' : form.gender === 'Female' ? 'female' : null,
      region: REGION_TO_BACKEND[form.region] || (form.region ? form.region.toLowerCase() : null),
      district: (form.townCity || '').trim() || null,
      address: (form.areaNeighborhood || '').trim() || null,
      currentInstitution: (form.schoolUniversity || '').trim() || null,
      preferredLanguage: LANGUAGE_TO_BACKEND[form.preferredLanguage] ?? (form.preferredLanguage === 'SiSwati' ? 'ss' : 'en'),
      gradeLevel: (form.highestGrade || '').trim() || null,
      degreeProgram: (form.degreeProgram || '').trim() || null,
      yearOfStudy: form.yearOfStudy ? parseInt(form.yearOfStudy, 10) : null,
      currentOccupation: (form.currentOccupation || '').trim() || null,
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience, 10) : null,
    };
  };

  const handleSubmitProfile = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const payload = buildProfilePayload();
      const res = await api.patch('/api/v1/auth/me', payload);
      const updatedUser = res.data?.data?.user ?? res.data?.user;
      if (updatedUser && setSession) {
        setSession(null, updatedUser);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { message: 'Please sign in to complete your profile.' } });
        return;
      }
      setSubmitError(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (step === 1) {
      const errors = {};
      if (!form.fullName.trim()) errors.fullName = 'Full name is required';
      if (!form.nationalId.trim()) {
        errors.nationalId = 'National ID / PIN is required';
      } else if (!/^\d{13}$/.test(form.nationalId.trim())) {
        errors.nationalId = 'National ID must be exactly 13 digits';
      }
      if (Object.keys(errors).length > 0) {
        setStep1Errors(errors);
        return;
      }
      setStep1Errors({});
    }
    if (step < 4) setStep((s) => s + 1);
    else handleSubmitProfile();
  };

  const goToStep = (s) => setStep(s);

  return (
    <OnboardingLayout>
      {/* Step 1: Tell us about yourself */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            {typeMeta && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md" style={{ backgroundColor: `${typeMeta.color}10`, border: `1px solid ${typeMeta.color}30` }}>
                <typeMeta.Icon className="w-4 h-4" style={{ color: typeMeta.color }} />
                <span className="text-xs font-medium" style={{ color: typeMeta.color }}>{typeMeta.label}</span>
              </div>
            )}
            <h1 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              Tell us about yourself
            </h1>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              We need a few basic details to set up your profile for the career assessment.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                Full Legal Name *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => { update('fullName', e.target.value); setStep1Errors(p => ({ ...p, fullName: '' })); }}
                placeholder="e.g. Thabo Dlamini"
                className={`form-control ${TYPO.body}`}
                style={{ borderBottomColor: step1Errors.fullName ? GOV.error : GOV.border, color: GOV.text }}
              />
              {step1Errors.fullName
                ? <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{step1Errors.fullName}</p>
                : <p className={`mt-1 flex items-center gap-1.5 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                    <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ borderColor: GOV.textHint, color: GOV.textHint }}>i</span>
                    Use the name exactly as it appears on your national ID.
                  </p>
              }
            </div>

            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                National ID / PIN *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={13}
                value={form.nationalId}
                onChange={(e) => { update('nationalId', e.target.value.replace(/\D/g, '')); setStep1Errors(p => ({ ...p, nationalId: '' })); }}
                placeholder="13-digit national ID number"
                className={`form-control font-mono ${TYPO.body}`}
                style={{ borderBottomColor: step1Errors.nationalId ? GOV.error : GOV.border, color: GOV.text }}
              />
              {step1Errors.nationalId
                ? <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{step1Errors.nationalId}</p>
                : <p className={`mt-1 flex items-center gap-1.5 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                    <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ borderColor: GOV.textHint, color: GOV.textHint }}>i</span>
                    Found on your national ID card. Used to link your account across life stages.
                  </p>
              }
              {form.nationalId.length > 0 && (
                <p className={`mt-1 ${TYPO.hint}`} style={{ color: form.nationalId.length === 13 ? '#16a34a' : GOV.textMuted }}>
                  {form.nationalId.length}/13 digits
                </p>
              )}
            </div>

            <div>
              <label className={`block ${TYPO.label} mb-1.5`} style={{ color: GOV.text }}>
                Gender Identity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update('gender', g)}
                    className={`py-2.5 px-3 rounded-md border ${TYPO.bodySmall} font-medium transition-colors`}
                    style={{
                      borderColor: form.gender === g ? GOV.blue : GOV.border,
                      backgroundColor: form.gender === g ? GOV.blueLight : '#fff',
                      color: GOV.text,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
              Your information is secure and used only by the Ministry for the SDS career assessment in Eswatini.
            </p>
            <p className={TYPO.hint}>
              Need help? <a href="#" className="font-medium hover:underline" style={{ color: GOV.blue }}>Contact Support</a>
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white`}
                style={{ backgroundColor: GOV.blue }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Tell us where you study */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              Tell us where you study
            </h1>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              Provide your region and educational institution in Eswatini for the career assessment.
            </p>
          </div>

          <div className="rounded-md border overflow-hidden bg-white" style={{ borderColor: GOV.borderLight }}>
            <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: GOV.borderLight }}>
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: GOV.blue }} />
              <span className={`${TYPO.caption} font-semibold`} style={{ color: GOV.text }}>
                Location &amp; Institution
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Region *</label>
                <select
                  value={form.region}
                  onChange={(e) => update('region', e.target.value)}
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                >
                  {ESWATINI_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
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
                      setTownDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setTownQuery(form.townCity);
                      setTownDropdownOpen(true);
                    }}
                    placeholder="Search or select town..."
                    className={`form-control-with-icon pl-8 ${TYPO.body}`}
                    style={{ borderBottomColor: GOV.border, color: GOV.text }}
                    autoComplete="off"
                  />
                </div>
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
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Area / Neighborhood</label>
                <input
                  type="text"
                  value={form.areaNeighborhood}
                  onChange={(e) => update('areaNeighborhood', e.target.value)}
                  placeholder="e.g. Msunduza, Fonteyn"
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                />
              </div>
              <div className="sm:col-span-2 relative" ref={schoolDropdownRef}>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current School / University *</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: GOV.textHint }} aria-hidden />
                  <input
                    type="text"
                    value={schoolDropdownOpen ? schoolQuery : form.schoolUniversity}
                    onChange={(e) => {
                      setSchoolQuery(e.target.value);
                      setSchoolDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setSchoolQuery(form.schoolUniversity);
                      setSchoolDropdownOpen(true);
                    }}
                    placeholder="Search or select school..."
                    className={`form-control-with-icon pl-8 ${TYPO.body}`}
                    style={{ borderBottomColor: GOV.border, color: GOV.text }}
                    autoComplete="off"
                  />
                </div>
                {schoolDropdownOpen && (
                  <ul
                    className="absolute z-10 left-0 right-0 mt-0.5 py-0.5 rounded-md border overflow-auto max-h-40 bg-white"
                    style={{ borderColor: GOV.border }}
                  >
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((inst) => (
                        <li key={inst}>
                          <button
                            type="button"
                            className={`w-full text-left px-3 py-1.5 ${TYPO.bodySmall} hover:bg-gray-100 transition-colors`}
                            style={{ color: GOV.text }}
                            onClick={() => {
                              update('schoolUniversity', inst);
                              setSchoolQuery(inst);
                              setSchoolDropdownOpen(false);
                            }}
                          >
                            {inst}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className={`px-3 py-2 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                        No school found. Type to search.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="rounded-md border p-3 flex gap-2.5" style={{ backgroundColor: GOV.blueLightAlt, borderColor: GOV.blueLight }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOV.blue }}>
                  <Info className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className={`font-semibold ${TYPO.hint} mb-0.5`} style={{ color: GOV.text }}>Why do we need this?</p>
                  <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
                    Your region and institution help the Ministry tailor career guidance and SDS reporting.
                  </p>
                </div>
              </div>
              <p className={`mt-2 flex items-center gap-1.5 ${TYPO.hint}`} style={{ color: GOV.textMuted }}>
                <span className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: GOV.border }}>
                  <Check className="w-2.5 h-2.5" style={{ color: GOV.blue }} />
                </span>
                Your data is stored securely by the Ministry in Eswatini.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white`}
              style={{ backgroundColor: GOV.blue }}
            >
              Continue &gt;
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Academic / Language / Career Background */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              {typeMeta?.step3Label || 'Academic & Language'}
            </h1>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              {userType === 'professional'
                ? 'Tell us about your career background to personalise your recommendations.'
                : 'Final details to tailor your career assessment and recommendations.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Preferred Language</label>
              <select
                value={form.preferredLanguage}
                onChange={(e) => update('preferredLanguage', e.target.value)}
                className={`form-control ${TYPO.body}`}
                style={{ borderBottomColor: GOV.border, color: GOV.text }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textHint }}>Default interface language.</p>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current/Highest Grade Passed</label>
              <select
                value={form.highestGrade}
                onChange={(e) => update('highestGrade', e.target.value)}
                className={`form-control ${TYPO.body}`}
                style={{ borderBottomColor: GOV.border, color: GOV.text }}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
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
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Degree Programme</label>
                <input
                  type="text"
                  value={form.degreeProgram}
                  onChange={(e) => update('degreeProgram', e.target.value)}
                  placeholder="e.g. Bachelor of Commerce in Accounting"
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                />
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Year of Study</label>
                <select
                  value={form.yearOfStudy}
                  onChange={(e) => update('yearOfStudy', e.target.value)}
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                >
                  <option value="">— Select —</option>
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
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
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current Occupation</label>
                <input
                  type="text"
                  value={form.currentOccupation}
                  onChange={(e) => update('currentOccupation', e.target.value)}
                  placeholder="e.g. Secondary School Teacher"
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                />
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Years of Experience</label>
                <select
                  value={form.yearsExperience}
                  onChange={(e) => update('yearsExperience', e.target.value)}
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                >
                  <option value="">— Select —</option>
                  {[1,2,3,4,5,6,7,8,9,10,15,20].map(y => <option key={y} value={y}>{y}{y === 20 ? '+' : ''} year{y !== 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="rounded-md border p-3 flex gap-2.5" style={{ backgroundColor: GOV.blueLightAlt, borderColor: GOV.borderLight }}>
            <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: GOV.blue }} />
            <div>
              <p className={`font-semibold ${TYPO.hint} mb-0.5`} style={{ color: GOV.text }}>Language &amp; grade</p>
              <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
                You can change these later in account settings.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white`}
              style={{ backgroundColor: GOV.blue }}
            >
              Continue &gt;
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary Review only – table-like, clean, white, flat */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              Review Your Profile
            </h1>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              Ensure all details are correct before submitting.
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
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.fullName || '—'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>National ID / PIN</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium font-mono`} style={{ color: form.nationalId ? GOV.text : GOV.error }}>
                      {form.nationalId || '⚠ Required — please go back and enter'}
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Gender</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.gender || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-b" style={{ borderColor: GOV.border }}>
              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <h2 className={TYPO.label} style={{ color: GOV.text }}>Location &amp; Institution</h2>
                <button type="button" onClick={() => goToStep(2)} className={`${TYPO.hint} font-medium hover:underline transition-colors duration-150`} style={{ color: GOV.blue }}>
                  Edit
                </button>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} w-1/3`} style={{ color: GOV.textHint }}>Region</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.region || '—'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Town / City</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.townCity || '—'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>School / University</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.schoolUniversity || '—'}</td>
                  </tr>
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
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.preferredLanguage || '—'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Highest grade passed</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.highestGrade || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className={TYPO.hint} style={{ color: GOV.textHint }}>
            By submitting, you agree to the Ministry&apos;s data use policy.
          </p>

          {submitError && (
            <div
              className={`rounded-md px-3 py-2 ${TYPO.hint}`}
              style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder || '#fecaca'}` }}
            >
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={submitting}
              className={`px-5 py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
              style={{ backgroundColor: GOV.blue }}
            >
              {submitting ? 'Saving…' : 'Submit & Complete Profile'}
            </button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
