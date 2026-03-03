import { Link } from 'react-router-dom';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';

export default function NotFound() {
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

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <Link to="/" className={`${LOGO.marginBottom} flex-shrink-0`} aria-label="Home">
            <img src="/siyinqaba.png" alt={LOGO_ALT} className={LOGO.className} />
          </Link>

          <div
            className="w-full bg-white rounded-lg border py-6 px-6 text-center"
            style={{ borderColor: GOV.border }}
          >
            <h1 className={`${TYPO.pageTitle} mb-2`} style={{ color: GOV.text }}>
              404 – Page not found
            </h1>
            <p className={`${TYPO.bodySmall} mb-4`} style={{ color: GOV.textMuted }}>
              The page you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link
              to="/"
              className={`inline-block py-2.5 px-4 rounded-md font-medium ${TYPO.bodySmall} text-white transition-opacity hover:opacity-95`}
              style={{ backgroundColor: GOV.blue }}
            >
              Return to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
