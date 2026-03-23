import React, { useEffect, useState, useCallback } from 'react';
import { X, RefreshCw, Eye, Search, Download, Filter } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { ErrorBanner } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';

const ACTION_TYPES = [
  'USER_CREATED','USER_UPDATED','USER_DELETED',
  'ASSESSMENT_COMPLETED','ASSESSMENT_COMPLETED_NOTIFY',
  'COURSE_CREATED','COURSE_UPDATED','COURSE_DELETED','COURSES_IMPORTED',
  'OCCUPATION_CREATED','OCCUPATION_UPDATED','OCCUPATION_DELETED',
  'EDUCATION_LEVEL_CREATED','EDUCATION_LEVEL_UPDATED','EDUCATION_LEVEL_DELETED',
  'PERMISSIONS_UPDATED','ADMIN_ACTION','ADMIN_ACTION_FAILED',
];

const AdminAuditPanel = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState(new Set());
  const [filters, setFilters] = useState({ actionType: '', search: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await adminService.getAuditLogs({
        ...filters,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      });
      setLogs(result.logs);
      setTotal(result.total);
    } catch { setError('Failed to load audit logs'); }
    setLoading(false);
  }, [filters, page]);

  const viewDetail = async (id) => {
    setLoadingDetail(true);
    try { setSelectedLog(await adminService.getAuditLog(id)); }
    catch { setSelectedLog(null); }
    setLoadingDetail(false);
  };

  const clearDetail = () => setSelectedLog(null);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      {/* Audit Log Detail Modal */}
      {(loadingDetail || selectedLog) && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Audit Log Details</h3>
              <button type="button" onClick={clearDetail}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loadingDetail && (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-8 h-8 animate-spin" style={{ color: GOV.blue }} />
                </div>
              )}
              {!loadingDetail && selectedLog && (
                <div className="space-y-5">
                  <div className="rounded-md p-4" style={{ backgroundColor: GOV.blueLightAlt }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: GOV.text }}>{selectedLog.actionType || 'Audit Event'}</p>
                        <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>{selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : '–'}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border" style={{ backgroundColor: '#ffffff', color: GOV.blue, borderColor: GOV.border }}>
                        {selectedLog.entityType || 'system'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    {[
                      ['Log ID', <span className="font-mono">{selectedLog.id || '–'}</span>],
                      ['User ID', <span className="font-mono">{selectedLog.userId || '–'}</span>],
                      ['IP Address', selectedLog.ipAddress || '–'],
                      ['Entity Type', selectedLog.entityType || '–'],
                      ['Entity ID', <span className="font-mono">{selectedLog.entityId || '–'}</span>],
                      ['Actor', selectedLog.user ? `${selectedLog.user.firstName || ''} ${selectedLog.user.lastName || ''}`.trim() || selectedLog.user.email : '–'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <span className="font-semibold block mb-0.5" style={{ color: GOV.textMuted }}>{label}</span>
                        <span style={{ color: GOV.text }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: GOV.text }}>Description</p>
                    <div className="border rounded-md p-4 text-sm" style={{ borderColor: GOV.border, color: GOV.text }}>
                      {selectedLog.description || 'No description available.'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: GOV.text }}>Metadata</p>
                    <div className="border rounded-md p-4 overflow-x-auto" style={{ borderColor: GOV.border }}>
                      <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: GOV.text }}>
                        {selectedLog.metadata
                          ? (typeof selectedLog.metadata === 'object'
                            ? JSON.stringify(selectedLog.metadata, null, 2)
                            : selectedLog.metadata)
                          : 'No metadata available.'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!loadingDetail && selectedLog && (
              <div className="p-4 border-t flex justify-end" style={{ borderColor: GOV.border }}>
                <button type="button" onClick={clearDetail} className="px-4 py-2 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={[
            {
              key: 'actionType',
              header: 'Action',
              sortable: true,
              render: (log) => <span className="text-xs font-semibold" style={{ color: GOV.text }}>{log.actionType || '–'}</span>,
            },
            {
              key: 'description',
              header: 'Description',
              render: (log) => <span className="text-xs" style={{ color: GOV.text }}>{log.description || '–'}</span>,
            },
            {
              key: 'user',
              header: 'User',
              render: (log) => (
                <span className="text-xs" style={{ color: GOV.textMuted }}>
                  {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email : '–'}
                </span>
              ),
            },
            {
              key: 'ipAddress',
              header: 'IP',
              render: (log) => <span className="text-xs font-mono" style={{ color: GOV.textMuted }}>{log.ipAddress || '–'}</span>,
            },
            {
              key: 'createdAt',
              header: 'Timestamp',
              sortable: true,
              render: (log) => (
                <span className="text-xs" style={{ color: GOV.textMuted }}>
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : '–'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              stopPropagation: true,
              width: 'w-10',
              align: 'right',
              render: (log) => (
                <ActionMenu actions={[
                  { label: 'View Details', Icon: Eye, onClick: () => viewDetail(log.id) },
                ]} />
              ),
            },
          ]}
          rows={logs}
          rowKey="id"
          loading={loading}
          emptyTitle="No audit logs"
          emptyMessage="No audit activity recorded yet."
          toolbar={
            <div className="flex flex-wrap items-center gap-2 w-full">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Audit Logs</h3>
              <span className="text-xs" style={{ color: GOV.textMuted }}>{total} total</span>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
                <input className="pl-7 pr-3 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.text, width: 180 }}
                  placeholder="Search action or description…"
                  value={filters.search}
                  onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(0); }} />
              </div>
              <select className="px-2 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.text }}
                value={filters.actionType}
                onChange={e => { setFilters(f => ({ ...f, actionType: e.target.value })); setPage(0); }}>
                <option value="">All actions</option>
                {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="date" className="px-2 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.text }}
                value={filters.startDate}
                onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(0); }} />
              <input type="date" className="px-2 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.text }}
                value={filters.endDate}
                onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(0); }} />
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => adminService.exportAuditLogs(filters)}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.blue }}>
                  <Download className="w-3 h-3" /> Export CSV
                </button>
                <button type="button" onClick={load}
                  className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.blue }}>
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
          }
          pageSize={7}
          selectable
          selectedIds={selectedLogs}
          onSelectionChange={setSelectedLogs}
        />
      </div>
    </>
  );
};

export default AdminAuditPanel;
