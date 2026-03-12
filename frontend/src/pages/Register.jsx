import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';
import api from '../services/api';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import WorkplaceSearchInput from '../components/ui/WorkplaceSearchInput';
import { GOV, TYPO } from '../theme/government';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const USER_TYPES = [
  {
    id: 'school_student',
    label: 'High School Student',
    description: 'Discover careers and choose the right subjects for your future.',
    Icon: GraduationCap,
    color: '#1e3a5f'
  },
  {
    id: 'university_student',
    label: 'University Student',
    description: 'Explore specialisations and graduate career pathways.',
    Icon: BookOpen,
    color: '#2563eb'
  },
  {
    id: 'professional',
    label: 'Professional / Career Switcher',
    description: 'Find new opportunities and plan your career transition.',
    Icon: Briefcase,
    color: '#7c3aed'
  }
];

function parseEmailOrPhone(value) {
  const v = (value || '').trim();
  if (!v) return { email: null, phoneNumber: null };
  if (EMAIL_REGEX.test(v)) return { email: v, phoneNumber: undefined };
  const digits = v.replace(/\D/g, '');
  if (digits.length === 8) return { email: undefined, phoneNumber: `+268${digits}` };
  if (v.startsWith('+268') && digits.length === 11) return { email: undefined, phoneNumber: v };
  return { email: null, phoneNumber: null };
}

function validateEmailOrPhone(value) {
  const v = (value || '').trim();
  if (!v) return 'Email or phone is required';
  if (EMAIL_REGEX.test(v)) return true;
  const digits = v.replace(/\D/g, '');
  if (digits.length === 8 || (v.startsWith('+268') && digits.length === 11)) return true;
  return 'Enter a valid email or Eswatini phone (+268 followed by 8 digits)';
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [serverError, setServerError] = useState('');
  const [workplace, setWorkplace] = useState({ name: '', institutionId: null });

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();

  const selectedType = USER_TYPES.find(t => t.id === userType);

  const onSubmit = async (data) => {
    setServerError('');
    const { email, phoneNumber } = parseEmailOrPhone(data.emailOrPhone);
    const payload = {
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      password: data.password,
      consent: true,
      userType: userType || undefined,
      degreeProgram: data.degreeProgram || undefined,
      yearOfStudy: data.yearOfStudy || undefined,
      yearsExperience: data.yearsExperience || undefined,
      currentOccupation: data.currentOccupation || undefined,
      workplaceName: userType === 'professional' ? (workplace.name || undefined) : undefined,
      workplaceInstitutionId: userType === 'professional' ? (workplace.institutionId || undefined) : undefined,
    };
    try {
      await api.post('/api/v1/auth/register', payload);
      navigate('/registration-success', {
        state: { email: email || phoneNumber || data.emailOrPhone }
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  const inputClass = (hasError) =>
    `form-control ${hasError ? '' : ''}`;

  return (
    <OnboardingLayout>
      <div className="w-full max-w-[440px] mx-auto">

        <div className="w-full bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>

          {/* ── STEP 1: User Type Selection ── */}
          {step === 1 && (
            <div className="p-6">
              <h1 className={`${TYPO.pageTitle} text-center mb-1`} style={{ color: GOV.text }}>Get career guidance</h1>
              <p className="text-xs text-center mb-5" style={{ color: GOV.textMuted }}>
                Select the option that best describes you.
              </p>
              <div className="space-y-3">
                {USER_TYPES.map(({ id, label, description, Icon, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setUserType(id)}
                    className="w-full flex items-center gap-4 p-4 rounded-md border-2 text-left transition-all"
                    style={{
                      borderColor: userType === id ? color : GOV.border,
                      backgroundColor: userType === id ? `${color}08` : 'white'
                    }}
                  >
                    <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: GOV.text }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: GOV.textMuted }}>{description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!userType}
                onClick={() => setStep(2)}
                className="w-full mt-5 py-2.5 rounded-md font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ backgroundColor: GOV.blue }}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-center mt-4" style={{ color: GOV.textMuted }}>
                Already have an account?{' '}
                <Link to="/login" className="font-medium hover:underline" style={{ color: GOV.blue }}>Sign in</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: Account Details ── */}
          {step === 2 && (
            <form className="p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex items-center gap-3 mb-2">
                <button type="button" onClick={() => setStep(1)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Create your account</h1>
                  <p className="text-xs mt-0.5" style={{ color: GOV.textMuted }}>
                    Enter your details to continue.
                  </p>
                </div>
              </div>

              {/* Email / Phone */}
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Email or phone *</label>
                <input
                  {...register('emailOrPhone', { required: 'Required', validate: validateEmailOrPhone })}
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com or +268 7612 3456"
                  className={inputClass(!!errors.emailOrPhone)}
                  style={{ borderBottomColor: errors.emailOrPhone ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.emailOrPhone && <p className="mt-1 text-xs" style={{ color: GOV.error }}>{errors.emailOrPhone.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Password *</label>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    pattern: { value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, message: 'Use letters and numbers' }
                  })}
                  autoComplete="new-password"
                  className={inputClass(!!errors.password)}
                  style={{ borderBottomColor: errors.password ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.password && <p className="mt-1 text-xs" style={{ color: GOV.error }}>{errors.password.message}</p>}
              </div>

              {/* University-specific fields */}
              {userType === 'university_student' && (
                <div className="space-y-3 pt-1">
                  <div className="h-px" style={{ backgroundColor: GOV.borderLight }} />
                  <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>University details (optional)</p>
                  <div>
                    <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Degree programme</label>
                    <input
                      {...register('degreeProgram')}
                      type="text"
                      placeholder="e.g. Bachelor of Commerce"
                      className={inputClass(false)}
                      style={{ borderBottomColor: GOV.border, color: GOV.text }}
                    />
                  </div>
                  <div>
                    <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Year of study</label>
                    <select {...register('yearOfStudy')} className={inputClass(false)} style={{ borderBottomColor: GOV.border, color: GOV.text }}>
                      <option value="">— Select —</option>
                      {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Professional-specific fields */}
              {userType === 'professional' && (
                <div className="space-y-3 pt-1">
                  <div className="h-px" style={{ backgroundColor: GOV.borderLight }} />
                  <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>Career details (optional)</p>
                  <div>
                    <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current occupation</label>
                    <input
                      {...register('currentOccupation')}
                      type="text"
                      placeholder="e.g. Secondary School Teacher"
                      className={inputClass(false)}
                      style={{ borderBottomColor: GOV.border, color: GOV.text }}
                    />
                  </div>
                  <div>
                    <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Workplace / Employer</label>
                    <WorkplaceSearchInput
                      value={workplace.name}
                      institutionId={workplace.institutionId}
                      onChange={(name, id) => setWorkplace({ name, institutionId: id })}
                      placeholder="Search for your employer or organisation..."
                    />
                  </div>
                  <div>
                    <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Years of experience</label>
                    <select {...register('yearsExperience')} className={inputClass(false)} style={{ borderBottomColor: GOV.border, color: GOV.text }}>
                      <option value="">— Select —</option>
                      {['0-1','2-3','4-6','7-10','10+'].map(v => <option key={v} value={v}>{v} years</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Consent */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="reg-consent"
                  type="checkbox"
                  {...register('consent', { required: 'You must accept the terms' })}
                  className="h-4 w-4 mt-0.5 rounded shrink-0"
                  style={{ accentColor: GOV.blue }}
                />
                <label htmlFor="reg-consent" className="text-xs" style={{ color: GOV.text }}>
                  I consent to the processing of my data under the Eswatini Data Protection Act 2022
                </label>
              </div>
              {errors.consent && <p className="text-xs" style={{ color: GOV.error }}>{errors.consent.message}</p>}

              {serverError && (
                <div className="rounded-md px-3 py-2 text-xs" style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder}` }}>
                  {serverError}
                </div>
              )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
              style={{ backgroundColor: GOV.blue }}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-xs text-center" style={{ color: GOV.textMuted }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium hover:underline" style={{ color: GOV.blue }}>Sign in</Link>
            </p>
          </form>
        )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
