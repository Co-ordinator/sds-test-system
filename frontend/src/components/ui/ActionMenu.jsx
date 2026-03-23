import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { GOV } from '../../theme/government';

/**
 * ActionMenu — MoreHorizontal icon that opens a compact dropdown with action items.
 * Uses a portal + fixed positioning so it is never clipped by overflow-hidden parents.
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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const openMenu = useCallback((e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: align === 'left' ? rect.left + window.scrollX : rect.right + window.scrollX,
      });
    }
    setOpen(o => !o);
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visible = actions.filter(a => a && !a.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Actions"
      >
        <MoreHorizontal className="w-4 h-4" style={{ color: GOV.textMuted }} />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] min-w-[140px] bg-white border rounded-md shadow-lg py-1"
            style={{
              borderColor: GOV.border,
              top: pos.top,
              ...(align === 'left' ? { left: pos.left } : { right: `calc(100vw - ${pos.left}px)` }),
            }}
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
        </>,
        document.body
      )}
    </div>
  );
};

export default ActionMenu;
