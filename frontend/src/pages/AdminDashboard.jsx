import React from 'react';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/layout/AppShell';
import { GOV } from '../theme/government';
import { AnalyticsPanel } from './Analytics';
import AdminDashboardOverviewTab from '../features/admin/dashboard/AdminDashboardOverviewTab';

const AdminDashboard = () => {
  const { user } = useAuth();
  const firstName = user?.firstName?.trim() || 'User';

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-1 border-b pb-4" style={{ borderColor: GOV.border }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: GOV.blue }}>
            System Administrator Dashboard
          </p>
          <h1 className="text-2xl font-bold" style={{ color: GOV.text }}>
            Welcome back, {firstName}
          </h1>
          <p className="text-sm" style={{ color: GOV.textMuted }}>
            National SDS usage, career outcomes, regional participation, trends, and funding alignment are now managed from this dashboard.
          </p>
        </div>

        <AnalyticsPanel
          embedded
          dashboardOverview={(props) => <AdminDashboardOverviewTab {...props} />}
        />
      </div>
    </AppShell>
  );
};

export default AdminDashboard;
