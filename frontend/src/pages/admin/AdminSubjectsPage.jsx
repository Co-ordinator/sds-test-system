import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminSubjectsPanel from '../../features/admin/subjects/AdminSubjectsPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Subjects' },
];

const AdminSubjectsPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminSubjectsPanel />
    </div>
  </AppShell>
);

export default AdminSubjectsPage;
