import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { GOV } from '../../theme/government';

/**
 * ActionMenu — MoreHorizontal icon that opens a compact dropdown with action items.
 *
 * actions: Array<{
 *   label: string,
 *   Icon?: LucideIcon,
 *   onClick: () => void,
 *   danger?: boolean,
 *   hidden?: boolean,
 * }>
 * align?: 'left' | 'right'  — dropdown alignment (default: 'right')
 */
const ActionMenu = ({ actions = [], align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visible = actions.filter(a => a && !a.hidden);
  if (visible.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Actions"
      >
        <MoreHorizontal className="w-4 h-4" style={{ color: GOV.textMuted }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-full mt-1 z-30 min-w-[140px] bg-white border rounded-md shadow-lg py-1 ${align === 'left' ? 'left-0' : 'right-0'}`}
            style={{ borderColor: GOV.border }}
          >
            {visible.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); action.onClick(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-gray-50 text-left transition-colors"
                style={{ color: action.danger ? '#dc2626' : GOV.text }}
              >
                {action.Icon && (
                  <action.Icon
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: action.danger ? '#dc2626' : GOV.textMuted }}
                  />
                )}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ActionMenu;
