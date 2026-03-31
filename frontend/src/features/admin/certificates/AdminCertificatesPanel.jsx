import React, { useEffect, useState, useCallback } from 'react';
import { Download, Award, RefreshCw, Search } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { ErrorBanner } from '../../../components/ui/StatusIndicators';
import { useToast } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';
import { PermissionGate } from '../../../context/PermissionContext';

const AdminCertificatesPanel = () => {
  const { toast, showToast, Toast: ToastComp } = useToast();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCerts(await adminService.getCertificates()); }
    catch { setError('Failed to load certificates'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async (assessmentId) => {
    setGenerating(assessmentId);
    try {
      await adminService.generateCertificate(assessmentId);
      showToast('Certificate generated', 'success');
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Generation failed', 'error'); }
    setGenerating(null);
  };

  const handleDownload = async (assessmentId, certNumber) => {
    try { await adminService.downloadCertificate(assessmentId, certNumber); }
    catch { showToast('Download failed', 'error'); }
  };

  const filtered = certs.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.certificateNumber?.toLowerCase().includes(q) ||
      c.assessment?.user?.email?.toLowerCase().includes(q) ||
      `${c.assessment?.user?.firstName} ${c.assessment?.user?.lastName}`.toLowerCase().includes(q)
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
              key: 'certificateNumber', header: 'Certificate #', sortable: true,
              render: c => (
                <span className="text-xs font-mono font-semibold" style={{ color: GOV.blue }}>
                  {c.certificateNumber || '—'}
                </span>
              )
            },
            {
              key: 'user', header: 'Recipient',
              render: c => {
                const u = c.assessment?.user;
                return u
                  ? <div>
                      <p className="text-xs font-medium" style={{ color: GOV.text }}>
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px]" style={{ color: GOV.textMuted }}>{u.email}</p>
                    </div>
                  : <span className="text-xs" style={{ color: GOV.textMuted }}>—</span>;
              }
            },
            {
              key: 'hollandCode', header: 'Holland Code',
              render: c => (
                <span className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: GOV.blueLightAlt || '#eff6ff', color: GOV.blue }}>
                  {c.assessment?.hollandCode || '—'}
                </span>
              )
            },
            {
              key: 'issuedAt', header: 'Issued', sortable: true,
              render: c => (
                <span className="text-xs" style={{ color: GOV.textMuted }}>
                  {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}
                </span>
              )
            },
            {
              key: 'status', header: 'Status',
              render: c => (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  c.status === 'issued' ? 'bg-green-50 text-green-700' :
                  c.status === 'revoked' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>{c.status || 'issued'}</span>
              )
            },
            {
              key: 'actions', header: '', stopPropagation: true, width: 'w-10', align: 'right',
              render: c => {
                const aid = c.assessmentId || c.assessment?.id;
                return (
                  <ActionMenu actions={[
                    ...(c.certificateNumber
                      ? [{ label: 'Download PDF', Icon: Download, onClick: () => handleDownload(aid, c.certificateNumber) }]
                      : []),
                    ...(!c.certificateNumber
                      ? [{ label: generating === aid ? 'Generating…' : 'Generate', Icon: Award, onClick: () => handleGenerate(aid) }]
                      : []),
                  ]} />
                );
              }
            }
          ]}
          rows={filtered}
          rowKey="id"
          loading={loading}
          emptyTitle="No certificates"
          emptyMessage="Certificates are issued when students complete their assessments."
          pageSize={10}
          toolbar={
            <div className="flex flex-wrap items-center gap-2 w-full">
              <Award className="w-4 h-4" style={{ color: GOV.blue }} />
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Certificates</h3>
              <div className="relative ml-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
                <input className="pl-7 pr-3 py-1.5 border rounded-md text-xs"
                  style={{ borderColor: GOV.border, color: GOV.text, width: 200 }}
                  placeholder="Search by name or cert #…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="ml-auto">
                <button type="button" onClick={load}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs"
                  style={{ borderColor: GOV.border, color: GOV.blue }}>
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
