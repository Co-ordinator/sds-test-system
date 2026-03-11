import React from 'react';
import { X, Filter, RefreshCw } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';

const FilterDialog = ({ isOpen, onClose, filters, onFilterChange, onReset, children, title = "Filters" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" style={{ color: GOV.blue }} />
            <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: GOV.textMuted }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50" style={{ borderColor: GOV.border }}>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold border bg-white"
            style={{ borderColor: GOV.border, color: GOV.textMuted }}
          >
            <RefreshCw className="w-4 h-4" /> Reset All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white"
            style={{ backgroundColor: GOV.blue }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDialog;
