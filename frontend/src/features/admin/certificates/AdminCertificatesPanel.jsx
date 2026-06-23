import React, { useEffect, useState, useCallback } from 'react';
import { Download, Award, RefreshCw, Search } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { ErrorBanner, useToast } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';

const getHollandDisplayCode = (assessment) =>
  assessment?.hollandCodeDisplay || assessment?.hollandCode || '-';

const AdminCertificatesPanel = () => {
  const { toast, showToast, Toast: ToastComp } = useToast();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCerts(await adminService.getCertificates());
    } catch {
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async (assessmentId, certNumber) => {
    if (!assessmentId || downloading === assessmentId) return;

    setDownloading(assessmentId);
    try {
      await adminService.downloadCertificate(assessmentId, certNumber);
      showToast('Certificate downloaded', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Download failed', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const filtered = certs.filter((cert) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      cert.certificateNumber?.toLowerCase().includes(q) ||
      cert.assessment?.user?.email?.toLowerCase().includes(q) ||
      `${cert.assessment?.user?.firstName} ${cert.assessment?.user?.lastName}`.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <ToastComp toast={toast} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={[
            {
              key: 'certificateNumber',
              header: 'Certificate #',
              sortable: true,
              render: (cert) => (
                <span className="text-xs font-mono font-semibold" style={{ color: GOV.blue }}>
                  {cert.certificateNumber || '-'}
                </span>
              ),
            },
            {
              key: 'user',
              header: 'Recipient',
              render: (cert) => {
                const user = cert.assessment?.user;
                return user ? (
                  <div>
                    <p className="text-xs font-medium" style={{ color: GOV.text }}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px]" style={{ color: GOV.textMuted }}>{user.email}</p>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: GOV.textMuted }}>-</span>
                );
              },
            },
            {
              key: 'hollandCode',
              header: 'Holland Code',
              render: (cert) => (
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: GOV.blueLightAlt || '#eff6ff', color: GOV.blue }}
                >
                  {getHollandDisplayCode(cert.assessment)}
                </span>
              ),
            },
            {
              key: 'issuedAt',
              header: 'Issued',
              sortable: true,
              render: (cert) => (
                <span className="text-xs" style={{ color: GOV.textMuted }}>
                  {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : '-'}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (cert) => (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  cert.status === 'issued' ? 'bg-green-50 text-green-700'
                    : cert.status === 'revoked' ? 'bg-red-50 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
                >
                  {cert.status || 'issued'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              stopPropagation: true,
              width: 'w-10',
              align: 'right',
              render: (cert) => {
                const assessmentId = cert.assessmentId || cert.assessment?.id;
                if (!assessmentId) return null;

                return (
                  <ActionMenu actions={[{
                    label: downloading === assessmentId ? 'Downloading...' : 'Download Certificate',
                    Icon: Download,
                    onClick: () => handleDownload(assessmentId, cert.certificateNumber),
                  }]} />
                );
              },
            },
          ]}
          rows={filtered}
          rowKey="id"
          loading={loading}
          emptyTitle="No certificates"
          emptyMessage="Certificates will appear after completed assessments are downloaded."
          pageSize={10}
          toolbar={
            <div className="flex flex-wrap items-center gap-2 w-full">
              <Award className="w-4 h-4" style={{ color: GOV.blue }} />
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Certificates</h3>
              <div className="relative ml-2">
                <Search
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: GOV.textMuted }}
                />
                <input
                  className="pl-7 pr-3 py-1.5 border rounded-md text-xs"
                  style={{ borderColor: GOV.border, color: GOV.text, width: 200 }}
                  placeholder="Search by name or cert #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={load}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs"
                  style={{ borderColor: GOV.border, color: GOV.blue }}
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
          }
        />
      </div>
    </>
  );
};

export default AdminCertificatesPanel;
