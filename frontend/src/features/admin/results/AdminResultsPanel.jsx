import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Eye, Download, Award, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { StatusBadge, useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import ActionMenu from '../../../components/ui/ActionMenu';
import { adminService } from '../../../services/adminService';
import { usePermissions } from '../../../context/PermissionContext';

const AdminResultsPanel = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [generatingCert, setGeneratingCert] = useState(null);
  const [generatedCerts, setGeneratedCerts] = useState({});
  const { toast, showToast, Toast: ToastComp } = useToast();
  const { hasPermission } = usePermissions();
  const [selectedResults, setSelectedResults] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssessments(await adminService.getAssessments(200));
    } catch { setError('Failed to load assessments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerateCert = async (a) => {
    setGeneratingCert(a.id);
    try {
      const result = await adminService.generateCertificate(a.id);
      setGeneratedCerts(prev => ({ ...prev, [a.id]: result?.data }));
      showToast(`Certificate ${result?.data?.certNumber || ''} generated — student notified`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate certificate', 'error');
    } finally {
      setGeneratingCert(null);
    }
  };

  const handleDownloadCert = async (a) => {
    const certData = generatedCerts[a.id];
    try {
      await adminService.downloadCertificate(a.id, certData?.certNumber);
    } catch {
      showToast('Certificate download failed', 'error');
    }
  };

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
      key: 'actions', header: '', stopPropagation: true, width: 'w-10', align: 'right',
      render: (a) => a.status !== 'completed' ? null : (
        <ActionMenu actions={[
          { label: 'View Results', Icon: Eye, onClick: () => navigate('/results', { state: { assessmentId: a.id } }) },
          hasPermission('results.download_pdf') && { label: 'Download PDF', Icon: Download, onClick: () => adminService.downloadResultPdf(a.id).catch(() => showToast('PDF download failed', 'error')) },
          hasPermission('certificates.generate') && generatedCerts[a.id]
            ? { label: `Download Certificate`, Icon: CheckCircle, onClick: () => handleDownloadCert(a) }
            : hasPermission('certificates.generate') && { label: generatingCert === a.id ? 'Generating…' : 'Generate Certificate', Icon: Award, onClick: () => handleGenerateCert(a) },
        ]} />
      ),
    },
  ];

  const toolbar = (
    <>
      <span className="text-xs" style={{ color: GOV.textMuted }}>{filtered.length} results</span>
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
          emptyTitle="No assessments"
          emptyMessage="No completed assessments found."
          toolbar={toolbar}
          pageSize={7}
          selectable
          selectedIds={selectedResults}
          onSelectionChange={setSelectedResults}
        />
      </div>
    </>
  );
};

export default AdminResultsPanel;
