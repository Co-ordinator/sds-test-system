import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminInstitutionsPanel from '../../features/admin/institutions/AdminInstitutionsPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Institutions' },
];

const AdminInstitutionsPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminInstitutionsPanel />
    </div>
  </AppShell>
);

export default AdminInstitutionsPage;
