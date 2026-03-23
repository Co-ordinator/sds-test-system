import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminEducationLevelsPanel from '../../features/admin/educationLevels/AdminEducationLevelsPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Education Levels' },
];

const AdminEducationLevelsPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminEducationLevelsPanel />
    </div>
  </AppShell>
);

export default AdminEducationLevelsPage;
