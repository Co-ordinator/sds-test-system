import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GOV } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { StatusBadge, useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import ActionMenu from '../../../components/ui/ActionMenu';
import { adminService } from '../../../services/adminService';
import { usePermissions } from '../../../context/PermissionContext';

const getHollandDisplayCode = (assessment) =>
  assessment?.hollandCodeDisplay || assessment?.hollandCode || '-';

const getInstitutionLabel = (assessment) => {
  const user = assessment?.user || {};
  return user.institution?.name || user.currentInstitution || user.workplaceName || '';
};

const AdminResultsPanel = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [downloadingCert, setDownloadingCert] = useState(null);
  const { toast, showToast, Toast: ToastComp } = useToast();
  const { hasPermission } = usePermissions();
  const [selectedResults, setSelectedResults] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssessments(await adminService.getAssessments(200));
    } catch {
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDownloadCert = async (assessment) => {
    if (downloadingCert === assessment.id) return;

    setDownloadingCert(assessment.id);
    try {
      await adminService.downloadCertificate(assessment.id);
      showToast('Certificate downloaded');
    } catch (err) {
      showToast(err.response?.data?.message || 'Certificate download failed', 'error');
    } finally {
      setDownloadingCert(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return assessments;
    const q = search.toLowerCase();
    return assessments.filter((assessment) =>
      `${assessment.user?.firstName} ${assessment.user?.lastName} ${assessment.user?.email} ${getHollandDisplayCode(assessment)} ${getInstitutionLabel(assessment)}`
        .toLowerCase()
        .includes(q)
    );
  }, [assessments, search]);

  const columns = [
    {
      key: 'student',
      header: 'Student',
      sortable: false,
      render: (assessment) => (
        <div>
          <p className="text-sm font-medium" style={{ color: GOV.text }}>
            {assessment.user?.firstName} {assessment.user?.lastName}
          </p>
          <p className="text-xs" style={{ color: GOV.textMuted }}>
            {assessment.user?.email || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Institution / Workplace',
      render: (assessment) => {
        const label = getInstitutionLabel(assessment);
        const isWorkplace = !assessment.user?.institution?.name
          && !assessment.user?.currentInstitution
          && Boolean(assessment.user?.workplaceName);

        return (
          <span className="text-xs" style={{ color: label ? GOV.textMuted : GOV.textHint }}>
            {label || 'Not specified'}{isWorkplace ? ' (workplace)' : ''}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (assessment) => <StatusBadge status={assessment.status} />,
    },
    {
      key: 'hollandCode',
      header: 'Holland Code',
      sortable: true,
      render: (assessment) => (
        <span className="font-mono font-semibold text-sm" style={{ color: GOV.text }}>
          {getHollandDisplayCode(assessment)}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Completed',
      sortable: true,
      render: (assessment) => (
        <span className="text-xs" style={{ color: GOV.textMuted }}>
          {assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      stopPropagation: true,
      width: 'w-10',
      align: 'right',
      render: (assessment) => assessment.status !== 'completed' ? null : (
        <ActionMenu actions={[
          {
            label: 'View Results',
            Icon: Eye,
            onClick: () => navigate('/results', { state: { assessmentId: assessment.id } }),
          },
          hasPermission('results.download_pdf') && {
            label: 'Download PDF',
            Icon: Download,
            onClick: () => adminService.downloadResultPdf(assessment.id)
              .catch(() => showToast('PDF download failed', 'error')),
          },
          hasPermission('certificates.download') && {
            label: downloadingCert === assessment.id ? 'Downloading...' : 'Download Certificate',
            Icon: Download,
            onClick: () => handleDownloadCert(assessment),
          },
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
          placeholder="Search student, institution, code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
