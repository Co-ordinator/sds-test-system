import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { StatusBadge, useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';

const AdminResultsPanel = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { toast, showToast, Toast: ToastComp } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssessments(await adminService.getAssessments(200));
    } catch { setError('Failed to load assessments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search) return assessments;
    const q = search.toLowerCase();
    return assessments.filter(a =>
      `${a.user?.firstName} ${a.user?.lastName} ${a.user?.email} ${a.hollandCode || ''} ${a.user?.institution?.name || ''}`
        .toLowerCase().includes(q)
    );
  }, [assessments, search]);

  const columns = [
    {
      key: 'student',
      header: 'Student',
      sortable: false,
      render: (a) => (
        <div>
          <p className="text-sm font-medium" style={{ color: GOV.text }}>{a.user?.firstName} {a.user?.lastName}</p>
          <p className="text-xs" style={{ color: GOV.textMuted }}>{a.user?.email || '–'}</p>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Institution',
      render: (a) => <span className="text-xs" style={{ color: GOV.textMuted }}>{a.user?.institution?.name || '–'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'hollandCode',
      header: 'Holland Code',
      sortable: true,
      render: (a) => <span className="font-mono font-semibold text-sm" style={{ color: GOV.text }}>{a.hollandCode || '–'}</span>,
    },
    {
      key: 'completedAt',
      header: 'Completed',
      sortable: true,
      render: (a) => <span className="text-xs" style={{ color: GOV.textMuted }}>{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : '–'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      stopPropagation: true,
      render: (a) => a.status === 'completed' ? (
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/results', { state: { assessmentId: a.id } })} className="p-1 rounded hover:bg-gray-100" title="View Results">
            <Eye className="w-3.5 h-3.5" style={{ color: GOV.blue }} />
          </button>
          <button type="button" onClick={() => adminService.downloadResultPdf(a.id).catch(() => showToast('PDF download failed', 'error'))} className="p-1 rounded hover:bg-gray-100" title="Download PDF">
            <Download className="w-3.5 h-3.5 text-green-600" />
          </button>
        </div>
      ) : null,
    },
  ];

  const toolbar = (
    <>
      <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>All Assessment Results ({filtered.length})</h3>
      <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 ml-auto" style={{ borderColor: GOV.border }}>
        <Search className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
        <input
          className="text-xs outline-none"
          style={{ color: GOV.text }}
          placeholder="Search student, institution, code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
    </>
  );

  return (
    <>
      <ToastComp toast={toast} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey="id"
          loading={loading}
          emptyTitle="No assessments found"
          emptyMessage="Try adjusting your search."
          toolbar={toolbar}
          pageSize={25}
        />
      </div>
    </>
  );
};

export default AdminResultsPanel;
