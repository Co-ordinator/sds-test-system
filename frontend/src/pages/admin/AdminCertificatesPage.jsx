import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminCertificatesPanel from '../../features/admin/certificates/AdminCertificatesPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Certificates' },
];

const AdminCertificatesPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminCertificatesPanel />
    </div>
  </AppShell>
);

export default AdminCertificatesPage;
