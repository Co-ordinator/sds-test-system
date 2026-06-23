import React from 'react';
import { GOV } from '../../theme/government';

export default function PoweredFooter({ compact = false }) {
  return (
    <footer
      className={`shrink-0 border-t bg-white text-center ${compact ? 'px-4 py-3' : 'px-4 py-4'}`}
      style={{ borderColor: GOV.borderLight }}
    >
      <p className="m-0 text-xs sm:text-sm" style={{ color: GOV.textMuted }}>
        © {new Date().getFullYear()} SDS Career Assessment System
        <span className="mx-2" style={{ color: GOV.accentRed }}>|</span>
        Powered by{' '}
        <a
          href="https://datamatics.co.sz"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline"
          style={{ color: GOV.blue }}
        >
          Datamatics Eswatini
        </a>
      </p>
    </footer>
  );
}
