import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminOccupationsPanel from '../../features/admin/occupations/AdminOccupationsPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Occupations' },
];

const AdminOccupationsPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminOccupationsPanel />
    </div>
  </AppShell>
);

export default AdminOccupationsPage;
