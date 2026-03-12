import React, { useEffect, useState, useMemo } from 'react';
import { Users, Activity, FileCheck, BarChart2, CreditCard, Upload, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GOV, TYPO } from '../theme/government';
import AppShell from '../components/layout/AppShell';
import { useStudentManagement } from '../hooks/useStudentManagement';
import { useInstitutions } from '../hooks/useInstitutions';
import CounselorOverviewPanel from '../features/counselor/CounselorOverviewPanel';
import CounselorStudentsPanel from '../features/counselor/CounselorStudentsPanel';
import CounselorImportPanel from '../features/counselor/CounselorImportPanel';
import CounselorLoginCardsPanel from '../features/counselor/CounselorLoginCardsPanel';
import CounselorAnalyticsPanel from '../features/counselor/CounselorAnalyticsPanel';

const TABS = [
  { id: 'overview', label: 'Overview', Icon: Activity },
  { id: 'students', label: 'Students', Icon: Users },
  { id: 'import', label: 'Import', Icon: Upload },
  { id: 'logincards', label: 'Login Cards', Icon: CreditCard },
  { id: 'analytics', label: 'Analytics', Icon: BarChart2 },
];

const TestAdministratorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [instFilter, setInstFilter] = useState('');

  const isAdmin = user?.role === 'System Administrator';
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Counselor';

  const {
    students, allStudents, institutionStats, hollandDist, loading, error,
    search, setSearch, completedCount, completionRate, load,
  } = useStudentManagement({ isAdmin, institutionId: instFilter });

  const { allInstitutions, load: loadInstitutions } = useInstitutions();

  useEffect(() => {
    load();
    loadInstitutions();
  }, [load, loadInstitutions]);

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(s => `${s.firstName} ${s.lastName} ${s.email || ''}`.toLowerCase().includes(q));
  }, [students, search]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Header */}
        <header className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className={TYPO.pageTitle} style={{ color: GOV.text }}>
              {isAdmin ? 'Admin — Student Management' : 'Counselor Dashboard'}
            </h1>
            <p className={TYPO.body} style={{ color: GOV.textMuted }}>
              Welcome, {displayName}.{isAdmin ? ' Full access across all institutions.' : " Manage your institution's students."}
            </p>
          </div>
          {isAdmin && (
            <select
              className="form-control text-sm"
              style={{ borderBottomColor: GOV.border, color: GOV.text }}
              value={instFilter}
              onChange={e => setInstFilter(e.target.value)}
            >
              <option value="">All institutions</option>
              {allInstitutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          )}
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CStatCard title="Total Students" value={allStudents.length} Icon={Users} />
          <CStatCard title="Completed Tests" value={completedCount} Icon={FileCheck} />
          <CStatCard title="Completion Rate" value={`${completionRate}%`} Icon={Activity} />
          <CStatCard title="Avg Completed" value={institutionStats?.completedCount ?? '--'} Icon={BarChart2} />
        </div>

        {/* Search bar (students tab) */}
        {activeTab === 'students' && (
          <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-white max-w-xs" style={{ borderColor: GOV.border }}>
            <Search className="w-4 h-4" style={{ color: GOV.textMuted }} />
            <input
              className="text-sm outline-none flex-1"
              style={{ color: GOV.text }}
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Tab nav */}
        <div className="w-full flex gap-1 p-1 rounded-full" style={{ backgroundColor: GOV.blueLightAlt }}>
          {TABS.map(({ id, label, Icon: TabIcon }) => (
            <button key={id} type="button"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors rounded-full"
              style={activeTab === id ? { backgroundColor: '#ffffff', color: GOV.blue } : { color: GOV.textMuted }}
              onClick={() => setActiveTab(id)}
            >
              <TabIcon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Feature Panels */}
        {activeTab === 'overview' && (
          <CounselorOverviewPanel students={allStudents} institutionStats={institutionStats} />
        )}
        {activeTab === 'students' && (
          <CounselorStudentsPanel
            students={filteredStudents}
            isAdmin={isAdmin}
            loading={loading}
            error={error}
            onRefresh={load}
            onStudentUpdated={load}
            onStudentDeleted={load}
          />
        )}
        {activeTab === 'import' && (
          <CounselorImportPanel
            isAdmin={isAdmin}
            institutions={allInstitutions}
            onImportComplete={load}
          />
        )}
        {activeTab === 'logincards' && (
          <CounselorLoginCardsPanel
            isAdmin={isAdmin}
            institutions={allInstitutions}
            userInstitutionId={user?.institutionId || ''}
          />
        )}
        {activeTab === 'analytics' && (
          <CounselorAnalyticsPanel institutionStats={institutionStats} hollandDist={hollandDist} />
        )}
      </div>
    </AppShell>
  );
};

const CStatCard = ({ title, value, Icon }) => (
  <div className="bg-white rounded-md border p-3" style={{ borderColor: GOV.border }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>{title}</p>
        <p className="text-3xl font-bold mt-0.5" style={{ color: GOV.text }}>{value ?? '--'}</p>
      </div>
      <div className="p-2 rounded-md" style={{ backgroundColor: GOV.blueLightAlt }}>
        <Icon className="w-5 h-5" style={{ color: GOV.blue }} />
      </div>
    </div>
  </div>
);

export default TestAdministratorDashboard;
