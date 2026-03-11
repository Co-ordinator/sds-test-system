import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, X, RefreshCw } from 'lucide-react';
import { GOV, TYPO } from '../../../theme/government';
import { LoadingState, EmptyState, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { useAuditLogs } from '../../../hooks/useAuditLogs';

const AdminAuditPanel = () => {
  const { logs, loading, error, selectedLog, loadingDetail, load, viewDetail, clearDetail } = useAuditLogs();
  const [expandedLog, setExpandedLog] = useState(null);

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
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: GOV.border }}>
          <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Audit Logs (latest 100)</h3>
          <button type="button" onClick={load} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.blue }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading ? <LoadingState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead style={{ backgroundColor: GOV.blueLightAlt, color: GOV.textMuted }}>
                <tr>
                  <th className="px-4 py-3 text-xs uppercase w-6"></th>
                  <th className="px-4 py-3 text-xs uppercase">Time</th>
                  <th className="px-4 py-3 text-xs uppercase">Action</th>
                  <th className="px-4 py-3 text-xs uppercase">Actor</th>
                  <th className="px-4 py-3 text-xs uppercase">Description</th>
                  <th className="px-4 py-3 text-xs uppercase">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState title="No audit logs" /></td></tr>
                ) : logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="border-b cursor-pointer hover:bg-gray-50"
                      style={{ borderColor: GOV.borderLight }}
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="pl-4 py-2">
                        {expandedLog === log.id
                          ? <ChevronDown className="w-3 h-3" style={{ color: GOV.textMuted }} />
                          : <ChevronRight className="w-3 h-3" style={{ color: GOV.textMuted }} />}
                      </td>
                      <td className="px-4 py-2 text-xs" style={{ color: GOV.textMuted }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '–'}</td>
                      <td className="px-4 py-2 text-xs font-mono font-semibold" style={{ color: GOV.text }}>{log.actionType}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: GOV.textMuted }}>{log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email : '–'}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: GOV.textMuted }}>{log.description || '–'}</td>
                      <td className="px-4 py-2 text-xs">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); viewDetail(log.id); }}
                          className="px-2 py-1 border rounded text-[11px] font-semibold"
                          style={{ borderColor: GOV.border, color: GOV.blue }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr style={{ backgroundColor: GOV.blueLightAlt }}>
                        <td colSpan={6} className="px-8 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div><span className="font-semibold" style={{ color: GOV.textMuted }}>Log ID: </span><span className="font-mono" style={{ color: GOV.text }}>{log.id}</span></div>
                            <div><span className="font-semibold" style={{ color: GOV.textMuted }}>IP Address: </span><span style={{ color: GOV.text }}>{log.ipAddress || '–'}</span></div>
                            <div><span className="font-semibold" style={{ color: GOV.textMuted }}>User ID: </span><span className="font-mono" style={{ color: GOV.text }}>{log.userId || '–'}</span></div>
                            <div><span className="font-semibold" style={{ color: GOV.textMuted }}>Entity: </span><span style={{ color: GOV.text }}>{log.entityType ? `${log.entityType} #${log.entityId}` : '–'}</span></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminAuditPanel;
