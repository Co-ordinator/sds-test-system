import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Joi from 'joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { useNavigate } from 'react-router-dom';
import { Save, Download, Trash2, User, GraduationCap, Briefcase, Settings, Shield, Clock, Mail, Key, Eye, EyeOff, Upload, FileText, X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GOV, TYPO } from '../theme/government';
import AppShell from '../components/layout/AppShell';
import WorkplaceSearchInput from '../components/ui/WorkplaceSearchInput';

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

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [workplace, setWorkplace] = useState({ name: '', institutionId: null });

  // Qualifications state
  const [qualifications, setQualifications] = useState([]);
  const [qualLoading, setQualLoading] = useState(false);
  const [qualUploading, setQualUploading] = useState(false);
  const [qualError, setQualError] = useState('');
  const [qualSuccess, setQualSuccess] = useState('');
  const [qualForm, setQualForm] = useState({
    title: '', documentType: 'certificate', issuedBy: '', issueDate: '', file: null
  });
  const [dragOver, setDragOver] = useState(false);

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
          setWorkplace({
            name: user.workplaceName || '',
            institutionId: user.workplaceInstitutionId || null,
          });
        }
      } catch (err) {
        setUserData({});
      }
    };
    fetchUserData();
  }, [reset]);

  useEffect(() => {
    const fetchQualifications = async () => {
      setQualLoading(true);
      try {
        const res = await api.get('/api/v1/qualifications');
        setQualifications(res.data?.data?.qualifications || []);
      } catch { /* silent */ }
      finally { setQualLoading(false); }
    };
    fetchQualifications();
  }, []);

  const handleQualFileSelect = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setQualError('Only PDF, JPEG, PNG or WebP files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setQualError('File must be under 5 MB.');
      return;
    }
    setQualError('');
    setQualForm(p => ({ ...p, file }));
  };

  const handleQualUpload = async (e) => {
    e.preventDefault();
    if (!qualForm.title.trim()) { setQualError('Title is required.'); return; }
    if (!qualForm.file) { setQualError('Please select a file.'); return; }
    setQualError(''); setQualSuccess(''); setQualUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', qualForm.file);
      fd.append('title', qualForm.title.trim());
      fd.append('documentType', qualForm.documentType);
      if (qualForm.issuedBy) fd.append('issuedBy', qualForm.issuedBy.trim());
      if (qualForm.issueDate) fd.append('issueDate', qualForm.issueDate);
      const res = await api.post('/api/v1/qualifications', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setQualifications(p => [res.data.data.qualification, ...p]);
      setQualForm({ title: '', documentType: 'certificate', issuedBy: '', issueDate: '', file: null });
      setQualSuccess('Document uploaded successfully.');
      setTimeout(() => setQualSuccess(''), 4000);
    } catch (err) {
      setQualError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally { setQualUploading(false); }
  };

  const handleQualDelete = async (id) => {
    if (!window.confirm('Delete this qualification document?')) return;
    try {
      await api.delete(`/api/v1/qualifications/${id}`);
      setQualifications(p => p.filter(q => q.id !== id));
    } catch (err) {
      setQualError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const getQualIcon = (mime) => {
    if (mime === 'application/pdf') return '📄';
    return '🖼️';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const DOC_TYPE_LABELS = {
    certificate: 'Certificate',
    degree: 'Degree',
    diploma: 'Diploma',
    transcript: 'Transcript',
    professional_licence: 'Professional Licence',
    other: 'Other'
  };

  const onSubmit = async (data) => {
    const isProfessional = (userData?.userType === 'Professional') ||
      (authUser?.userType === 'Professional') ||
      (userData?.userType === 'professional');
    const payload = {
      ...data,
      ...(isProfessional ? {
        workplaceName: workplace.name || null,
        workplaceInstitutionId: workplace.institutionId || null,
      } : {}),
    };
    try {
      await api.patch('/api/v1/auth/me', payload);
      setUserData((prev) => ({ ...prev, ...payload }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
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

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwStatus({ type: 'error', msg: 'All fields are required.' }); return;
    }
    if (pwForm.newPw.length < 8) {
      setPwStatus({ type: 'error', msg: 'New password must be at least 8 characters.' }); return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwStatus({ type: 'error', msg: 'New passwords do not match.' }); return;
    }
    setPwSaving(true); setPwStatus(null);
    try {
      await api.post('/api/v1/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwStatus({ type: 'success', msg: 'Password changed successfully.' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      setPwStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to change password.' });
    } finally { setPwSaving(false); }
  };

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

  const role = authUser?.role || userData?.role || 'Test Taker';
  const rc = ROLE_COLORS[role] || ROLE_COLORS['Test Taker'];
  const backTo = role === 'System Administrator' || role === 'Test Administrator' ? '/admin/dashboard' : '/dashboard';

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Personal Information Section */}
          <SectionCard icon={User} title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <input
                  {...register('phoneNumber')}
                  placeholder="+268XXXXXXXX"
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.phoneNumber ? errorInputStyle : {}), focusRingColor: GOV.blue }}
                />
                <FieldError error={errors.phoneNumber} />
              </div>

              <div>
                <FieldLabel>Region</FieldLabel>
                <select
                  {...register('region')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.region ? errorInputStyle : {}) }}
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
                <FieldLabel>District</FieldLabel>
                <input
                  {...register('district')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.district ? errorInputStyle : {}) }}
                />
                <FieldError error={errors.district} />
              </div>

              <div>
                <FieldLabel>Address</FieldLabel>
                <input
                  {...register('address')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.address ? errorInputStyle : {}) }}
                />
                <FieldError error={errors.address} />
              </div>
            </div>
          </SectionCard>

          {/* Education Section */}
          <SectionCard icon={GraduationCap} title="Education">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Education Level</FieldLabel>
                <select
                  {...register('educationLevel')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.educationLevel ? errorInputStyle : {}) }}
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
                <FieldError error={errors.educationLevel} />
              </div>

              <div>
                <FieldLabel>Current Institution</FieldLabel>
                <input
                  {...register('currentInstitution')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.currentInstitution ? errorInputStyle : {}) }}
                />
                <FieldError error={errors.currentInstitution} />
              </div>
            </div>
          </SectionCard>

          {/* Employment Section */}
          <SectionCard icon={Briefcase} title="Employment">
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
                <FieldLabel>Current Occupation</FieldLabel>
                <input
                  {...register('currentOccupation')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.currentOccupation ? errorInputStyle : {}) }}
                />
                <FieldError error={errors.currentOccupation} />
              </div>

              {((userData?.userType === 'Professional') || (authUser?.userType === 'Professional') || (userData?.userType === 'professional')) && (
                <div className="md:col-span-2">
                  <FieldLabel>Workplace / Employer</FieldLabel>
                  <WorkplaceSearchInput
                    value={workplace.name}
                    institutionId={workplace.institutionId}
                    onChange={(name, id) => setWorkplace({ name, institutionId: id })}
                    placeholder="Search for your employer or organisation..."
                  />
                  <p className="mt-1" style={{ color: GOV.textHint, fontSize: '0.75rem' }}>
                    Type to search registered organisations, or enter your workplace name.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Preferences Section */}
          <SectionCard icon={Settings} title="Preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Preferred Language</FieldLabel>
                <select
                  {...register('preferredLanguage')}
                  className={inputFocusClass}
                  style={{ ...inputStyle, ...(errors.preferredLanguage ? errorInputStyle : {}) }}
                >
                  <option value="en">English</option>
                  <option value="ss">SiSwati</option>
                </select>
                <FieldError error={errors.preferredLanguage} />
              </div>

              <div className="flex items-center pt-5">
                <input
                  type="checkbox"
                  id="requiresAccessibility"
                  {...register('requiresAccessibility')}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: GOV.blue }}
                />
                <label htmlFor="requiresAccessibility" className={`ml-2 ${TYPO.body}`} style={{ color: GOV.textMuted }}>
                  I require accessibility accommodations
                </label>
              </div>
            </div>
          </SectionCard>

          {/* Save button */}
          <div className="flex items-center justify-end gap-3">
            {saveStatus === 'saved' && (
              <span className={TYPO.bodySmall} style={{ color: '#059669' }}>Changes saved successfully</span>
            )}
            {saveStatus === 'error' && (
              <span className={TYPO.bodySmall} style={{ color: GOV.error }}>Failed to save changes</span>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: GOV.blue }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = GOV.blueHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = GOV.blue}
            >
              <Save size={14} /> Save Changes
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
            {userData?.institution?.name && (
              <div>
                <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Institution</p>
                <p className="text-sm" style={{ color: GOV.text }}>{userData.institution.name}</p>
              </div>
            )}
            {userData?.lastLoginAt && (
              <div>
                <p className={`${TYPO.label} mb-1`} style={{ color: GOV.textMuted }}>Last Login</p>
                <p className="text-sm" style={{ color: GOV.text }}>{new Date(userData.lastLoginAt).toLocaleString()}</p>
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
                      value={pwForm[field]}
                      onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                      className={inputFocusClass + ' pr-9'}
                      style={inputStyle}
                      autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2" tabIndex={-1}>
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

        {/* Academic Qualifications / Certificates Section */}
        <div className="rounded-md border overflow-hidden" style={{ borderColor: GOV.border, backgroundColor: 'white' }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${GOV.borderLight}` }}>
            <GraduationCap size={16} style={{ color: GOV.blue }} />
            <h2 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Academic Qualifications &amp; Certificates</h2>
          </div>

          {/* Upload form */}
          <form onSubmit={handleQualUpload} className="p-5 space-y-4" style={{ borderBottom: `1px solid ${GOV.borderLight}` }}>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              Upload certificates, degrees, diplomas or transcripts (PDF, JPEG, PNG or WebP · max 5 MB each).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block mb-1 ${TYPO.label}`} style={{ color: GOV.text }}>Document title *</label>
                <input
                  type="text"
                  value={qualForm.title}
                  onChange={e => setQualForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. IGCSE Certificate 2022"
                  className={inputFocusClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={`block mb-1 ${TYPO.label}`} style={{ color: GOV.text }}>Document type</label>
                <select
                  value={qualForm.documentType}
                  onChange={e => setQualForm(p => ({ ...p, documentType: e.target.value }))}
                  className={inputFocusClass}
                  style={inputStyle}
                >
                  <option value="certificate">Certificate</option>
                  <option value="degree">Degree</option>
                  <option value="diploma">Diploma</option>
                  <option value="transcript">Transcript</option>
                  <option value="professional_licence">Professional Licence</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${TYPO.label}`} style={{ color: GOV.text }}>Issued by</label>
                <input
                  type="text"
                  value={qualForm.issuedBy}
                  onChange={e => setQualForm(p => ({ ...p, issuedBy: e.target.value }))}
                  placeholder="e.g. University of Eswatini"
                  className={inputFocusClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={`block mb-1 ${TYPO.label}`} style={{ color: GOV.text }}>Issue date</label>
                <input
                  type="date"
                  value={qualForm.issueDate}
                  onChange={e => setQualForm(p => ({ ...p, issueDate: e.target.value }))}
                  className={inputFocusClass}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleQualFileSelect(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('qual-file-input').click()}
              className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed cursor-pointer transition-colors py-6 px-4"
              style={{
                borderColor: dragOver ? GOV.blue : GOV.border,
                backgroundColor: dragOver ? GOV.blueLight : '#fafafa'
              }}
            >
              <input
                id="qual-file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={e => handleQualFileSelect(e.target.files[0])}
              />
              <Upload className="w-6 h-6" style={{ color: GOV.textHint }} />
              {qualForm.file ? (
                <div className="text-center">
                  <p className={`font-medium ${TYPO.bodySmall}`} style={{ color: GOV.text }}>{qualForm.file.name}</p>
                  <p className={TYPO.hint} style={{ color: GOV.textMuted }}>{formatFileSize(qualForm.file.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className={TYPO.bodySmall} style={{ color: GOV.text }}>Drag & drop or <span style={{ color: GOV.blue }}>click to browse</span></p>
                  <p className={TYPO.hint} style={{ color: GOV.textMuted }}>PDF, JPEG, PNG, WebP · max 5 MB</p>
                </div>
              )}
            </div>

            {qualError && (
              <div className="flex items-center gap-2 rounded-md px-3 py-2" style={{ backgroundColor: '#fef2f2', border: `1px solid #fecaca` }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: GOV.error }} />
                <p className={TYPO.hint} style={{ color: GOV.error }}>{qualError}</p>
              </div>
            )}
            {qualSuccess && (
              <div className="flex items-center gap-2 rounded-md px-3 py-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
                <p className={TYPO.hint} style={{ color: '#059669' }}>{qualSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={qualUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: GOV.blue }}
            >
              <Upload size={14} /> {qualUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>

          {/* Uploaded list */}
          <div className="p-5">
            {qualLoading ? (
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>Loading documents...</p>
            ) : qualifications.length === 0 ? (
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>No qualification documents uploaded yet.</p>
            ) : (
              <ul className="space-y-3">
                {qualifications.map(q => (
                  <li key={q.id} className="flex items-start gap-3 rounded-md border p-3" style={{ borderColor: GOV.borderLight }}>
                    <span className="text-xl flex-shrink-0">{getQualIcon(q.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${TYPO.bodySmall}`} style={{ color: GOV.text }}>{q.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}
                        >
                          {DOC_TYPE_LABELS[q.documentType] || q.documentType}
                        </span>
                        {q.issuedBy && <span className={TYPO.hint} style={{ color: GOV.textMuted }}>{q.issuedBy}</span>}
                        {q.issueDate && <span className={TYPO.hint} style={{ color: GOV.textMuted }}>{new Date(q.issueDate).toLocaleDateString()}</span>}
                        <span className={TYPO.hint} style={{ color: GOV.textHint }}>{formatFileSize(q.fileSize)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`${process.env.REACT_APP_API_URL || ''}/api/v1/qualifications/${q.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const res = await api.get(`/api/v1/qualifications/${q.id}/file`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([res.data], { type: q.mimeType }));
                            window.open(url, '_blank');
                          } catch { setQualError('Could not open file.'); }
                        }}
                        className="flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                        style={{ color: GOV.blue }}
                        title="View document"
                      >
                        <ExternalLink size={13} /> View
                      </a>
                      <button
                        type="button"
                        onClick={() => handleQualDelete(q.id)}
                        className="flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                        style={{ color: GOV.error }}
                        title="Delete document"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Data subject rights */}
        <div className="rounded-md border p-5" style={{ borderColor: GOV.border, backgroundColor: 'white' }}>
          <h2 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Your data rights</h2>
          <p className={`mt-1 mb-4 ${TYPO.body}`} style={{ color: GOV.textMuted }}>
            Under data protection law you can request a copy of your data or request account deletion.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 bg-white"
              style={{ borderColor: GOV.border, color: GOV.text }}
            >
              <Download size={14} /> Export my data
            </button>
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
