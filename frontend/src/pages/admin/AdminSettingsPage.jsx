import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Building2, Briefcase, HelpCircle, FileText,
  Shield, BookOpen, Settings, ChevronRight, GraduationCap, Award,
} from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import AdminUsersPanel from '../../features/admin/users/AdminUsersPanel';
import AdminInstitutionsPanel from '../../features/admin/institutions/AdminInstitutionsPanel';
import AdminOccupationsPanel from '../../features/admin/occupations/AdminOccupationsPanel';
import AdminQuestionsPanel from '../../features/admin/questions/AdminQuestionsPanel';
import AdminAuditPanel from '../../features/admin/audit/AdminAuditPanel';
import AdminSubjectsPanel from '../../features/admin/subjects/AdminSubjectsPanel';
import AdminCoursesPanel from '../../features/admin/courses/AdminCoursesPanel';
import AdminEducationLevelsPanel from '../../features/admin/educationLevels/AdminEducationLevelsPanel';
import AdminCertificatesPanel from '../../features/admin/certificates/AdminCertificatesPanel';
import { useInstitutions } from '../../hooks/useInstitutions';
import { usePermissions, PermissionGate } from '../../context/PermissionContext';
import { GOV } from '../../theme/government';

const SETTINGS_TABS = [
  {
    id: 'users',
    label: 'Users',
    Icon: Users,
    description: 'Manage user accounts, roles and permissions',
    permission: 'users.view',
  },
  {
    id: 'institutions',
    label: 'Institutions',
    Icon: Building2,
    description: 'Schools, colleges and universities',
    permission: 'institutions.view',
  },
  {
    id: 'occupations',
    label: 'Occupations',
    Icon: Briefcase,
    description: 'Career occupations and RIASEC mapping',
    permission: 'occupations.view',
  },
  {
    id: 'questions',
    label: 'Questions',
    Icon: HelpCircle,
    description: 'Assessment question bank',
    permission: 'questions.view',
  },
  {
    id: 'subjects',
    label: 'Subjects',
    Icon: BookOpen,
    description: 'Academic subjects and RIASEC links',
    permission: 'subjects.view',
  },
  {
    id: 'audit',
    label: 'Audit Log',
    Icon: FileText,
    description: 'System activity and security log',
    permission: 'audit.view',
  },
  {
    id: 'courses',
    label: 'Courses',
    Icon: BookOpen,
    description: 'Programme catalogue and career pathway links',
    permission: 'courses.view',
  },
  {
    id: 'education-levels',
    label: 'Education Levels',
    Icon: GraduationCap,
    description: 'Qualification tier definitions (levels 1–20)',
    permission: 'courses.view',
  },
  {
    id: 'certificates',
    label: 'Certificates',
    Icon: Award,
    description: 'Issued assessment certificates',
    permission: 'certificates.view',
  },
];

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Settings' },
];

const SystemConfigPanel = () => (
  <div className="space-y-6">
    <div className="bg-white border rounded-md p-6" style={{ borderColor: GOV.border }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: GOV.blueLightAlt }}>
          <Settings className="w-5 h-5" style={{ color: GOV.blue }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: GOV.text }}>System Configuration</h3>
          <p className="text-xs" style={{ color: GOV.textMuted }}>Global platform settings</p>
        </div>
      </div>
      <p className="text-xs" style={{ color: GOV.textHint }}>
        Advanced system configuration options will be available here in a future release.
      </p>
    </div>
  </div>
);


const AdminSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const { allInstitutions, load: loadInstitutions } = useInstitutions();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeTab = searchParams.get('tab') || 'users';

  useEffect(() => { loadInstitutions(); }, [loadInstitutions]);

  const visibleTabs = SETTINGS_TABS.filter(t => !t.permission || hasPermission(t.permission));

  const setTab = (id) => {
    if (id === activeTab) return;
    setIsTransitioning(true);
    setSearchParams({ tab: id });
    setTimeout(() => setIsTransitioning(false), 50);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <PermissionGate permission="users.view" fallback={<AccessDenied />}>
            <AdminUsersPanel institutions={allInstitutions} />
          </PermissionGate>
        );
      case 'institutions':
        return (
          <PermissionGate permission="institutions.view" fallback={<AccessDenied />}>
            <AdminInstitutionsPanel />
          </PermissionGate>
        );
      case 'occupations':
        return (
          <PermissionGate permission="occupations.view" fallback={<AccessDenied />}>
            <AdminOccupationsPanel />
          </PermissionGate>
        );
      case 'questions':
        return (
          <PermissionGate permission="questions.view" fallback={<AccessDenied />}>
            <AdminQuestionsPanel />
          </PermissionGate>
        );
      case 'subjects':
        return (
          <PermissionGate permission="subjects.view" fallback={<AccessDenied />}>
            <AdminSubjectsPanel />
          </PermissionGate>
        );
      case 'audit':
        return (
          <PermissionGate permission="audit.view" fallback={<AccessDenied />}>
            <AdminAuditPanel />
          </PermissionGate>
        );
      case 'courses':
        return (
          <PermissionGate permission="courses.view" fallback={<AccessDenied />}>
            <AdminCoursesPanel />
          </PermissionGate>
        );
      case 'education-levels':
        return (
          <PermissionGate permission="courses.view" fallback={<AccessDenied />}>
            <AdminEducationLevelsPanel />
          </PermissionGate>
        );
      case 'certificates':
        return (
          <PermissionGate permission="certificates.view" fallback={<AccessDenied />}>
            <AdminCertificatesPanel />
          </PermissionGate>
        );
      default:
        return <SystemConfigPanel />;
    }
  };

  const activeTabMeta = SETTINGS_TABS.find(t => t.id === activeTab);

  return (
    <AppShell breadcrumbs={BREADCRUMBS}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: GOV.text }}>Settings</h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="w-64 flex-shrink-0">
            <div className="bg-white border rounded-md overflow-hidden" style={{ borderColor: GOV.border }}>
              {visibleTabs.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all duration-200 ease-in-out ${idx > 0 ? 'border-t' : ''} ${!isActive ? 'hover:bg-gray-50' : ''}`}
                    style={{
                      borderColor: GOV.borderLight,
                      backgroundColor: isActive ? GOV.blueLightAlt : 'transparent',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200 ease-in-out"
                      style={{
                        backgroundColor: isActive ? GOV.blue : '#f3f4f6',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <tab.Icon
                        className="w-3.5 h-3.5 transition-colors duration-200"
                        style={{ color: isActive ? '#ffffff' : GOV.textMuted }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold leading-none transition-colors duration-200"
                        style={{ color: isActive ? GOV.blue : GOV.text }}
                      >
                        {tab.label}
                      </p>
                      <p className="text-[10px] mt-0.5 leading-tight" style={{ color: GOV.textHint }}>
                        {tab.description}
                      </p>
                    </div>
                    <ChevronRight 
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                      style={{ color: GOV.blue }}
                    />
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div 
              className={`transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
              style={{ minHeight: '400px' }}
            >
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const AccessDenied = () => (
  <div className="bg-white border rounded-md p-8 text-center" style={{ borderColor: GOV.border }}>
    <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: GOV.textHint }} />
    <p className="text-sm font-semibold" style={{ color: GOV.text }}>Access Denied</p>
    <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>
      You don't have permission to view this section.
    </p>
  </div>
);

export default AdminSettingsPage;
