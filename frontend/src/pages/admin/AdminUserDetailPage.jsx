import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Shield, Mail, User, Building2,
  Calendar, Phone, MapPin, Award, Clock, CheckCircle2, XCircle,
  Activity, FileText, Loader2
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import { GOV, TYPO } from '../../theme/government';
import { RoleBadge, StatusBadge } from '../../components/ui/StatusIndicators';
import { adminService } from '../../services/adminService';
import { PermissionGate } from '../../context/PermissionContext';

const Field = ({ label, value, mono = false }) => (
  <div className="py-3 border-b last:border-b-0" style={{ borderColor: GOV.borderLight }}>
    <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: GOV.textMuted }}>{label}</p>
    <p className={`text-sm ${mono ? 'font-mono' : 'font-medium'}`} style={{ color: value ? GOV.text : GOV.textHint }}>
      {value || '—'}
    </p>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-lg border" style={{ borderColor: GOV.border }}>
    <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: GOV.border }}>
      {Icon && <Icon className="w-4 h-4" style={{ color: GOV.blue }} />}
      <h3 className="text-sm font-bold" style={{ color: GOV.text }}>{title}</h3>
    </div>
    <div className="px-5 divide-y" style={{ divideColor: GOV.borderLight }}>
      {children}
    </div>
  </div>
);

const AdminUserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const u = await adminService.getUser(userId);
        setUser(u);
        const allAssessments = await adminService.getAssessments(1000);
        setAssessments(allAssessments.filter(a => a.userId === userId || a.user?.id === userId));
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const breadcrumbs = [
    { label: 'Admin', to: '/admin/dashboard' },
    { label: 'Settings', to: '/admin/settings' },
    { label: 'Users', to: '/admin/settings?tab=users' },
    { label: user ? `${user.firstName} ${user.lastName}` : 'User Details' },
  ];

  const completedAssessments = assessments.filter(a => a.status === 'completed');
  const inProgressAssessments = assessments.filter(a => a.status === 'in_progress');

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: GOV.blue }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOV.blue }} />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-md text-sm" style={{ backgroundColor: GOV.errorBg, color: GOV.error }}>
            {error}
          </div>
        )}

        {user && !loading && (
          <div className="space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: GOV.border }}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}
                  >
                    {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: GOV.text }}>
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: GOV.textMuted }}>{user.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <RoleBadge role={user.role} />
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          user.isActive !== false
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                      {user.isEmailVerified ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700">
                          <CheckCircle2 className="w-3 h-3" /> Email Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                          <XCircle className="w-3 h-3" /> Email Unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <PermissionGate permission="permissions.manage">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/users/${user.id}/permissions`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white"
                      style={{ backgroundColor: '#7c3aed' }}
                    >
                      <Shield className="w-3.5 h-3.5" /> Permissions
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="users.update">
                    <Link
                      to={`/admin/settings?tab=users&edit=${user.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white"
                      style={{ backgroundColor: GOV.blue }}
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit User
                    </Link>
                  </PermissionGate>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t" style={{ borderColor: GOV.borderLight }}>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: GOV.text }}>{assessments.length}</p>
                  <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>Total Assessments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{completedAssessments.length}</p>
                  <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#d97706' }}>{inProgressAssessments.length}</p>
                  <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono" style={{ color: GOV.blue }}>
                    {completedAssessments[0]?.hollandCode || '—'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>Latest Holland Code</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Section title="Personal Information" icon={User}>
                <Field label="First Name" value={user.firstName} />
                <Field label="Last Name" value={user.lastName} />
                <Field label="Email Address" value={user.email} />
                <Field label="Phone Number" value={user.phoneNumber} />
                <Field label="Gender" value={user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : null} />
                <Field label="Date of Birth" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null} />
                <Field label="National ID" value={user.nationalId} mono />
              </Section>

              {/* Account Information */}
              <Section title="Account Information" icon={Shield}>
                <Field label="User ID" value={user.id} mono />
                <Field label="Student Code" value={user.studentCode} mono />
                <Field label="Role" value={user.role} />
                <Field label="User Type" value={user.userType} />
                <Field label="Region" value={user.region} />
                <Field label="Grade Level" value={user.gradeLevel} />
                <Field label="Username" value={user.username} mono />
              </Section>

              {/* Education & Institution */}
              <Section title="Education & Institution" icon={Building2}>
                <Field label="Institution" value={user.institution?.name || user.institutionName} />
                <Field label="School/University" value={user.institutionId} mono />
                <Field label="Workplace" value={user.workplaceName || user.workplaceInstitution?.name} />
                <Field label="Current Occupation" value={user.currentOccupation} />
              </Section>

              {/* Account Activity */}
              <Section title="Account Activity" icon={Activity}>
                <Field label="Registered" value={user.createdAt ? new Date(user.createdAt).toLocaleString() : null} />
                <Field label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : user.lastLogin ? new Date(user.lastLogin).toLocaleString() : null} />
                <Field label="Email Verified" value={user.isEmailVerified ? 'Yes' : 'No'} />
                <Field label="Consent Given" value={user.isConsentGiven ? `Yes — ${user.consentDate ? new Date(user.consentDate).toLocaleDateString() : ''}` : 'No'} />
                <Field label="Created By Test Administrator" value={user.createdByTestAdministrator ? 'Yes' : 'No'} />
              </Section>
            </div>

            {/* Assessment History */}
            {assessments.length > 0 && (
              <div className="bg-white rounded-lg border" style={{ borderColor: GOV.border }}>
                <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: GOV.border }}>
                  <FileText className="w-4 h-4" style={{ color: GOV.blue }} />
                  <h3 className="text-sm font-bold" style={{ color: GOV.text }}>Assessment History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: GOV.blueLightAlt }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: GOV.textMuted }}>Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: GOV.textMuted }}>Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: GOV.textMuted }}>Holland Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: GOV.textMuted }}>Progress</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: GOV.textMuted }}>Completed</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: GOV.textMuted }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((a) => (
                        <tr key={a.id} className="border-t hover:bg-gray-50" style={{ borderColor: GOV.borderLight }}>
                          <td className="px-4 py-3 text-xs" style={{ color: GOV.textMuted }}>
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-sm" style={{ color: GOV.text }}>
                            {a.hollandCode || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 max-w-[80px]">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${a.progress || 0}%`, backgroundColor: GOV.blue }}
                                />
                              </div>
                              <span className="text-xs" style={{ color: GOV.textMuted }}>{Math.round(a.progress || 0)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: GOV.textMuted }}>
                            {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {a.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => navigate('/results', { state: { assessmentId: a.id } })}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: GOV.blue }}
                              >
                                View Results
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default AdminUserDetailPage;
