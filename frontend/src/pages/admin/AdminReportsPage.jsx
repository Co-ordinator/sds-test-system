import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminReportsPanel from '../../features/admin/reports/AdminReportsPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Reports' },
];

const AdminReportsPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminReportsPanel />
    </div>
  </AppShell>
);

export default AdminReportsPage;
