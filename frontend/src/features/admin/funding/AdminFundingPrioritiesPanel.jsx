import React, { useEffect, useState, useCallback } from 'react';
import { Search, Landmark, ExternalLink } from 'lucide-react';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { ErrorBanner, useToast } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';
import { usePermissions } from '../../../context/PermissionContext';

const SLAS_INFO_URL = 'https://slas.gov.sz/LoanProcess/ApplicationRequirements.aspx';

const FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Priority programme' },
  { value: 'false', label: 'Not priority' },
];

/** API returns boolean; avoid Boolean() on strings (e.g. "false" is truthy). */
const isPriorityProgramme = (fp) => fp === true || fp === 1;

const AdminFundingPrioritiesPanel = () => {
  const { toast, showToast, Toast: ToastComp } = useToast();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('courses.update');

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getCourses({
        search,
        fundingPriority: priorityFilter === '' ? undefined : priorityFilter,
        limit: 2000,
      });
      setCourses(data);
    } catch {
      setError('Failed to load courses');
    }
    setLoading(false);
  }, [search, priorityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePriorityChange = async (courseId, fundingPriority) => {
    setSavingId(courseId);
    try {
      await adminService.updateCourse(courseId, { fundingPriority });
      showToast('Funding priority updated', 'success');
      setCourses(prev => prev.map(c => (c.id === courseId ? { ...c, fundingPriority } : c)));
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    }
    setSavingId(null);
  };

  const handlePriorityToggle = (courseId, enabled) => {
    handlePriorityChange(courseId, enabled);
  };

  return (
    <div className="space-y-4">
      <ToastComp toast={toast} />
      <div className="bg-white border rounded-md p-4" style={{ borderColor: GOV.border }}>
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: GOV.blueLightAlt }}
          >
            <Landmark className="w-5 h-5" style={{ color: GOV.blue }} />
          </div>
          <div className="min-w-0">
            <h3 className={`${TYPO.sectionTitle} text-sm`} style={{ color: GOV.text }}>
              Government funding priority (SLAS)
            </h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: GOV.textMuted }}>
              Each programme has a boolean <strong>SLAS priority</strong> flag. Student results use it for
              “Government Funding Priority Alignment”. Use the toggle to set priority on or off.
            </p>
            <a
              href={SLAS_INFO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
              style={{ color: GOV.blue }}
            >
              SLAS application requirements <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Course',
              sortable: true,
              render: c => (
                <div>
                  <p className="text-xs font-semibold" style={{ color: GOV.text }}>{c.name}</p>
                  {c.fieldOfStudy && (
                    <p className="text-[11px]" style={{ color: GOV.textMuted }}>{c.fieldOfStudy}</p>
                  )}
                </div>
              ),
            },
            {
              key: 'fieldOfStudy',
              header: 'Field of study',
              sortable: true,
              render: c => (
                <span className="text-xs" style={{ color: c.fieldOfStudy ? GOV.text : GOV.textMuted }}>
                  {c.fieldOfStudy || '—'}
                </span>
              ),
            },
            {
              key: 'fundingPriority',
              header: 'Funding priority',
              sortable: true,
              render: c => {
                const on = isPriorityProgramme(c.fundingPriority);
                return (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canEdit || savingId === c.id}
                      onClick={() => handlePriorityToggle(c.id, !on)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
                      style={{ backgroundColor: on ? GOV.blue : GOV.borderLight }}
                      role="switch"
                      aria-checked={on}
                      aria-label={`SLAS funding priority for ${c.name}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          on ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs ${on ? 'font-medium' : ''}`} style={{ color: on ? GOV.text : GOV.textMuted }}>
                      {on ? 'Yes' : 'No'}
                    </span>
                  </div>
                );
              },
            },
          ]}
          rows={courses}
          rowKey="id"
          loading={loading}
          emptyTitle="No courses"
          emptyMessage="Add programmes under Courses, then set their funding priority here."
          pageSize={15}
          toolbar={
            <div className="flex flex-wrap items-center gap-2 w-full">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Funding priorities</h3>
              <div className="relative ml-2">
                <Search
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: GOV.textMuted }}
                />
                <input
                  className="pl-7 pr-3 py-1.5 border rounded-md text-xs"
                  style={{ borderColor: GOV.border, color: GOV.text, width: 200 }}
                  placeholder="Search courses…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                className="px-2 py-1.5 border rounded-md text-xs"
                style={{ borderColor: GOV.border, color: GOV.text }}
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                aria-label="Filter by funding priority"
              >
                {FILTER_OPTIONS.map(p => (
                  <option key={p.value || 'all'} value={p.value}>{p.label}</option>
                ))}
              </select>
              {!canEdit && (
                <p className="text-[11px] ml-auto" style={{ color: GOV.textHint }}>
                  View only — course update permission required to change priorities.
                </p>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
};

export default AdminFundingPrioritiesPanel;
