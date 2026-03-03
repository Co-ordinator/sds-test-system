import { Link } from 'react-router-dom';
import { HelpCircle, UserPlus, ClipboardList, BarChart3 } from 'lucide-react';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      {/* Government bar – Ministry branding */}
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

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-8">
        <div className={LOGO.marginBottom}>
          <img src="/siyinqaba.png" alt={LOGO_ALT} className={LOGO.className} />
        </div>

        <h1
          className={`${TYPO.pageTitle} text-center mb-2 max-w-2xl`}
          style={{ color: GOV.text }}
        >
          Self-Directed Search (SDS)
        </h1>

        <p
          className={`${TYPO.bodySmall} text-center max-w-2xl mx-auto mb-6 leading-relaxed`}
          style={{ color: GOV.textMuted }}
        >
          The Self-Directed Search (SDS) is an assessment tool to help you identify career interests and explore occupations aligned with your personality.
        </p>

        <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-md font-medium text-white transition-opacity hover:opacity-95 text-sm"
            style={{ backgroundColor: GOV.blue }}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-md font-medium border transition-opacity hover:opacity-95 text-sm"
            style={{ borderColor: GOV.border, color: GOV.text }}
          >
            Register
          </Link>
        </div>
      </main>

      {/* Feature cards */}
      <section className="px-6 pb-16 md:pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-5 text-center flex flex-col items-center border border-gray-100">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: GOV.blueLight }}
            >
              <UserPlus className="w-5 h-5" style={{ color: GOV.blue }} strokeWidth={1.8} />
            </div>
            <h2 className={`${TYPO.cardTitle} mb-1`} style={{ color: GOV.text }}>
              1. Register &amp; Login
            </h2>
            <p className={`${TYPO.hint} leading-relaxed`} style={{ color: GOV.textMuted }}>
              Create your secure account to get started on your career journey.
            </p>
          </div>

          <div className="bg-white rounded-lg p-5 text-center flex flex-col items-center border border-gray-100">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: GOV.blueLight }}
            >
              <ClipboardList className="w-5 h-5" style={{ color: GOV.blue }} strokeWidth={1.8} />
            </div>
            <h2 className={`${TYPO.cardTitle} mb-1`} style={{ color: GOV.text }}>
              2. Take the Assessment
            </h2>
            <p className={`${TYPO.hint} leading-relaxed`} style={{ color: GOV.textMuted }}>
              Complete the interactive SDS test at your own pace, answering questions about your activities, competencies, and occupations.
            </p>
          </div>

          <div className="bg-white rounded-lg p-5 text-center flex flex-col items-center border border-gray-100">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: GOV.blueLight }}
            >
              <BarChart3 className="w-5 h-5" style={{ color: GOV.blue }} strokeWidth={1.8} />
            </div>
            <h2 className={`${TYPO.cardTitle} mb-1`} style={{ color: GOV.text }}>
              3. View Your Results
            </h2>
            <p className={`${TYPO.hint} leading-relaxed`} style={{ color: GOV.textMuted }}>
              Receive a personalized report with your Holland Code, detailed interpretations, and career recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer – Government */}
      <footer
        className="flex-shrink-0 border-t py-3 px-6 text-center"
        style={{ borderColor: GOV.border }}
      >
        <p className={TYPO.hint} style={{ color: GOV.textHint }}>
          © {new Date().getFullYear()} {KINGDOM}. {MINISTRY_NAME}.
        </p>
      </footer>
    </div>
  );
}
