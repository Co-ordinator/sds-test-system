import { Link } from 'react-router-dom';
import { GOV, TYPO, LOGO, KINGDOM, MINISTRY_NAME, LOGO_ALT } from '../../theme/government';

export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div
        className="flex-shrink-0 px-6 py-1.5 border-b text-center"
        style={{ borderColor: GOV.border, backgroundColor: GOV.ministryBarBg }}
        role="banner"
      >
        <p className={TYPO.ministryBanner} style={{ color: GOV.ministryBarText }}>
          {MINISTRY_NAME} | {KINGDOM}
        </p>
      </div>

      <Link
        to="/help"
        className="absolute top-3 right-6 w-8 h-8 rounded-md flex items-center justify-center z-10 border"
        style={{ backgroundColor: '#ffffff', borderColor: GOV.border }}
        aria-label="Open help page"
      >
        <span className="text-sm font-semibold" style={{ color: GOV.blue }}>?</span>
      </Link>

      <main className="flex-1 flex flex-col px-6 py-8" id="main-content" role="main">
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col">
          <Link to="/" className={`self-center ${LOGO.marginBottom}`} aria-label="Home">
            <img src="/letterhead.png" alt={LOGO_ALT} className={LOGO.className} />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
