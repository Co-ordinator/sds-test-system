import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminQuestionsPanel from '../../features/admin/questions/AdminQuestionsPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Questions' },
];

const AdminQuestionsPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminQuestionsPanel />
    </div>
  </AppShell>
);

export default AdminQuestionsPage;
