import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminResultsPanel from '../../features/admin/results/AdminResultsPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Results' },
];

const AdminResultsPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminResultsPanel />
    </div>
  </AppShell>
);

export default AdminResultsPage;
