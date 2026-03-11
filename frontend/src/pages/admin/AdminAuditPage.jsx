import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminAuditPanel from '../../features/admin/audit/AdminAuditPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Audit Log' },
];

const AdminAuditPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminAuditPanel />
    </div>
  </AppShell>
);

export default AdminAuditPage;
