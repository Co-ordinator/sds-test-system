import React from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminCoursesPanel from '../../features/admin/courses/AdminCoursesPanel';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Courses' },
];

const AdminCoursesPage = () => (
  <AppShell breadcrumbs={BREADCRUMBS}>
    <div className="max-w-7xl mx-auto px-6 py-6">
      <AdminCoursesPanel />
    </div>
  </AppShell>
);

export default AdminCoursesPage;
