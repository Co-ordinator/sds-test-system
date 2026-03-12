import React, { useState } from 'react';
import { LayoutDashboard, Users, Building2, FileQuestion, Briefcase, FileText, Shield, UserCog } from 'lucide-react';
import { GOV } from '../theme/government';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';

// Import existing panels
import AdminUsersPanel from '../features/admin/users/AdminUsersPanel';
import AdminInstitutionsPanel from '../features/admin/institutions/AdminInstitutionsPanel';
import AdminQuestionsPanel from '../features/admin/questions/AdminQuestionsPanel';
import AdminOccupationsPanel from '../features/admin/occupations/AdminOccupationsPanel';
import AdminAuditPanel from '../features/admin/audit/AdminAuditPanel';
import AdminResultsPanel from '../features/admin/results/AdminResultsPanel';
import AdminTestAdministratorsPanel from '../features/admin/test-administrators/AdminTestAdministratorsPanel';

// Import the original dashboard as overview
import OriginalDashboard from './AdminDashboard';

const TABS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'test-takers', label: 'Test Takers', icon: Users },
  { id: 'test-administrators', label: 'Test Administrators', icon: UserCog },
  { id: 'institutions', label: 'Institutions', icon: Building2 },
  { id: 'questions', label: 'Questions', icon: FileQuestion },
  { id: 'occupations', label: 'Occupations', icon: Briefcase },
  { id: 'results', label: 'Results', icon: FileText },
  { id: 'audit', label: 'Audit Logs', icon: Shield },
];

const AdminDashboardNew = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Administrator';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OriginalDashboard />;
      case 'test-takers':
        return <AdminUsersPanel />;
      case 'test-administrators':
        return <AdminTestAdministratorsPanel />;
      case 'institutions':
        return <AdminInstitutionsPanel />;
      case 'questions':
        return <AdminQuestionsPanel />;
      case 'occupations':
        return <AdminOccupationsPanel />;
      case 'results':
        return <AdminResultsPanel />;
      case 'audit':
        return <AdminAuditPanel />;
      default:
        return <OriginalDashboard />;
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: GOV.text }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: GOV.textMuted }}>
            Welcome back, {displayName}. Manage your system here.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6" style={{ borderColor: GOV.border }}>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors border-b-2"
                  style={{
                    color: isActive ? GOV.blue : GOV.textMuted,
                    borderColor: isActive ? GOV.blue : 'transparent',
                    backgroundColor: isActive ? GOV.blueLightAlt : 'transparent'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>{renderTabContent()}</div>
      </div>
    </AppShell>
  );
};

export default AdminDashboardNew;
