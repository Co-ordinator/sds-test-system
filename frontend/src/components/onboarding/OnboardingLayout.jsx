import { Link } from 'react-router-dom';
import { GOV, TYPO, LOGO, KINGDOM, MINISTRY_NAME, LOGO_ALT } from '../../theme/government';

export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      <div
        className="flex-shrink-0 px-6 py-1.5 border-b text-center"
        style={{ borderColor: GOV.border, backgroundColor: GOV.blueLightAlt }}
      >
        <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
          {MINISTRY_NAME} · {KINGDOM}
        </p>
      </div>

      <button
        type="button"
        className="absolute top-3 right-6 w-8 h-8 rounded-full flex items-center justify-center z-10"
        style={{ backgroundColor: GOV.blueLight }}
        aria-label="Help"
      >
        <span className="text-sm font-semibold" style={{ color: GOV.blue }}>?</span>
      </button>

      <main className="flex-1 flex flex-col px-6 py-6">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
          <Link to="/" className={`self-start ${LOGO.marginBottom}`} aria-label="Home">
            <img src="/siyinqaba.png" alt={LOGO_ALT} className={LOGO.className} />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
