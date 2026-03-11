import React, { useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import AdminUsersPanel from '../../features/admin/users/AdminUsersPanel';
import { useInstitutions } from '../../hooks/useInstitutions';

const BREADCRUMBS = [
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Users' },
];

const AdminUsersPage = () => {
  const { allInstitutions, load } = useInstitutions();
  useEffect(() => { load(); }, [load]);

  return (
    <AppShell breadcrumbs={BREADCRUMBS}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <AdminUsersPanel institutions={allInstitutions} />
      </div>
    </AppShell>
  );
};

export default AdminUsersPage;
