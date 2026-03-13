import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import { LoadingState, EmptyState } from '../ui/StatusIndicators';

/**
 * Enterprise DataTable — sortable, paginated, with actions and toolbar slots.
 *
 * columns: Array<{
 *   key: string,          — unique key, used for sorting
 *   header: string,       — display header
 *   render?: (row) => ReactNode   — custom cell renderer (default: row[key])
 *   sortable?: boolean,   — enable client-side sort (default: false)
 *   width?: string,       — optional width class e.g. 'w-32'
 *   align?: 'left'|'right'|'center'  — default 'left'
 * }>
 * rows: Array<object>
 * rowKey: string | (row) => string  — unique row identifier
 * loading?: boolean
 * emptyTitle?: string
 * emptyMessage?: string
 * pageSize?: number       — rows per page (default: 25, 0 = no pagination)
 * toolbar?: ReactNode     — rendered above the table
 * onRowClick?: (row) => void
 * selectable?: boolean    — show checkboxes for multi-select
 * selectedIds?: Set       — controlled set of selected row keys
 * onSelectionChange?: (Set) => void  — called when selection changes
 * bulkActions?: ReactNode — rendered in the bulk-actions bar when items are selected
 */
const DataTable = ({
  columns = [],
  rows = [],
  rowKey = 'id',
  loading = false,
  emptyTitle = 'No data',
  emptyMessage = '',
  pageSize = 7,
  toolbar,
  onRowClick,
  stickyHeader = false,
  selectable = false,
  selectedIds,
  onSelectionChange,
  bulkActions,
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const getKey = (row) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey]);

  // Selection helpers
  const sel = selectable && selectedIds ? selectedIds : new Set();
  const toggleOne = useCallback((id) => {
    if (!onSelectionChange) return;
    const next = new Set(sel);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  }, [sel, onSelectionChange]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);

  const visible = useMemo(() => {
    if (pageSize <= 0) return sorted;
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3" style={{ color: GOV.blue }} />
      : <ChevronDown className="w-3 h-3" style={{ color: GOV.blue }} />;
  };

  const alignClass = (align) => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  const visibleKeys = useMemo(() => new Set(visible.map(getKey)), [visible, getKey]);
  const allPageSelected = selectable && visible.length > 0 && visible.every(r => sel.has(getKey(r)));
  const somePageSelected = selectable && visible.some(r => sel.has(getKey(r)));
  const toggleAllPage = useCallback(() => {
    if (!onSelectionChange) return;
    const next = new Set(sel);
    if (allPageSelected) {
      visible.forEach(r => next.delete(getKey(r)));
    } else {
      visible.forEach(r => next.add(getKey(r)));
    }
    onSelectionChange(next);
  }, [sel, visible, allPageSelected, onSelectionChange, getKey]);

  const colCount = columns.length + (selectable ? 1 : 0);

  return (
    <div className="flex flex-col gap-0">
      {toolbar && (
        <div className="p-3 border-b flex flex-wrap items-center gap-2" style={{ borderColor: GOV.border }}>
          {toolbar}
        </div>
      )}

      {selectable && sel.size > 0 && bulkActions && (
        <div className="px-3 py-2 border-b flex items-center gap-3" style={{ backgroundColor: '#eff6ff', borderColor: GOV.border }}>
          <span className="text-xs font-semibold" style={{ color: GOV.blue }}>{sel.size} selected</span>
          <div className="flex items-center gap-2">
            {bulkActions}
          </div>
          <button type="button" onClick={() => onSelectionChange?.(new Set())} className="ml-auto text-xs underline" style={{ color: GOV.textMuted }}>Clear</button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className={`overflow-x-auto ${stickyHeader ? 'max-h-[520px]' : ''}`}>
            <table className="w-full text-left text-sm">
              <thead
                className={stickyHeader ? 'sticky top-0 z-10' : ''}
                style={{ backgroundColor: GOV.blueLightAlt, color: GOV.textMuted }}
              >
                <tr>
                  {selectable && (
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                        onChange={toggleAllPage}
                        className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer"
                      />
                    </th>
                  )}
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-xs font-semibold uppercase select-none ${alignClass(col.align)} ${col.width || ''} ${col.sortable ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      <span className="flex items-center gap-1 w-full">
                        {col.header}
                        <SortIcon col={col} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={colCount}>
                      <EmptyState title={emptyTitle} message={emptyMessage} />
                    </td>
                  </tr>
                ) : (
                  visible.map(row => {
                    const rk = getKey(row);
                    const isSelected = sel.has(rk);
                    return (
                      <tr
                        key={rk}
                        className={`border-b transition-colors ${isSelected ? 'bg-blue-50/60' : ''} ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'}`}
                        style={{ borderColor: GOV.borderLight }}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                      >
                        {selectable && (
                          <td className="px-3 py-3 w-10" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(rk)}
                              className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer"
                            />
                          </td>
                        )}
                        {columns.map(col => (
                          <td
                            key={col.key}
                            className={`px-4 py-3 ${alignClass(col.align)} ${col.width || ''}`}
                            style={{ color: GOV.text }}
                            onClick={col.stopPropagation ? e => e.stopPropagation() : undefined}
                          >
                            {col.render ? col.render(row) : (row[col.key] ?? '–')}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pageSize > 0 && totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t text-xs" style={{ borderColor: GOV.border, color: GOV.textMuted }}>
              <span>{sorted.length} total · page {safePage} of {totalPages}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
                  style={{ borderColor: GOV.border }}
                >
                  ‹ Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pg;
                  if (totalPages <= 7) pg = i + 1;
                  else if (safePage <= 4) pg = i + 1;
                  else if (safePage >= totalPages - 3) pg = totalPages - 6 + i;
                  else pg = safePage - 3 + i;
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setPage(pg)}
                      className="px-2.5 py-1 border rounded"
                      style={{
                        borderColor: pg === safePage ? GOV.blue : GOV.border,
                        color: pg === safePage ? GOV.blue : GOV.textMuted,
                        backgroundColor: pg === safePage ? GOV.blueLightAlt : 'transparent',
                        fontWeight: pg === safePage ? '700' : '400',
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
                  style={{ borderColor: GOV.border }}
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;
