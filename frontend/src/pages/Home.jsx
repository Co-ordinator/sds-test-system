import { Link } from 'react-router-dom';
import { UserPlus, ClipboardList, BarChart3, Sparkles, HelpCircle } from 'lucide-react';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      {/* Government bar – Ministry branding */}
      <div
        className="flex-shrink-0 px-6 py-1.5 border-b text-center"
        style={{ borderColor: GOV.border, backgroundColor: GOV.ministryBarBg }}
      >
        <p className={TYPO.ministryBanner} style={{ color: GOV.ministryBarText }}>
          {MINISTRY_NAME} · {KINGDOM}
        </p>
      </div>

      <Link
        to="/help"
        className="absolute top-3 right-6 w-8 h-8 rounded-md flex items-center justify-center z-10 border transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
        style={{ backgroundColor: '#ffffff', borderColor: GOV.border }}
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" style={{ color: GOV.blue }} />
      </Link>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-8">
        <div className="mb-6">
          <img src="/siyinqaba.png" alt={LOGO_ALT} className="h-16 w-auto mx-auto" />
        </div>

        <div className="w-full max-w-3xl bg-white rounded-md p-8 text-center">
          <h1
            className="text-2xl font-bold text-center mb-2"
            style={{ color: GOV.text }}
          >
            Self-Directed Search (SDS)
          </h1>

          <p
            className="text-sm font-medium text-center mb-6"
            style={{ color: GOV.textMuted }}
          >
            National Career Assessment System
          </p>

          <p
            className={`${TYPO.body} text-center max-w-2xl mx-auto mb-8 leading-relaxed`}
            style={{ color: GOV.text }}
          >
            The Self-Directed Search is a career assessment tool designed to help students and professionals identify their interests, abilities, and suitable career paths. Complete the assessment to receive personalized career recommendations aligned with the national education and labour market framework.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 text-sm"
              style={{ backgroundColor: GOV.blue }}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 text-sm bg-white"
              style={{ borderColor: GOV.border, color: GOV.text }}
            >
              Register
            </Link>
          </div>
        </div>
      </main>

      {/* Process information */}
      <section className="px-6 pb-16 md:pb-20">
        <h2 className="text-center text-lg font-bold mb-6" style={{ color: GOV.text }}>Assessment Process</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-md p-5 text-center flex flex-col items-center border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-default" style={{ borderColor: GOV.border }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: GOV.text }}>
              1. Registration
            </h3>
            <p className={`${TYPO.hint} leading-relaxed`} style={{ color: GOV.textMuted }}>
              Create an account with your personal details to access the assessment system.
            </p>
          </div>

          <div className="bg-white rounded-md p-5 text-center flex flex-col items-center border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-default" style={{ borderColor: GOV.border }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: GOV.text }}>
              2. Complete Assessment
            </h3>
            <p className={`${TYPO.hint} leading-relaxed`} style={{ color: GOV.textMuted }}>
              Answer questions about your activities, competencies, and occupational interests.
            </p>
          </div>

          <div className="bg-white rounded-md p-5 text-center flex flex-col items-center border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-default" style={{ borderColor: GOV.border }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: GOV.text }}>
              3. Receive Results
            </h3>
            <p className={`${TYPO.hint} leading-relaxed`} style={{ color: GOV.textMuted }}>
              View your Holland Code profile and personalized career and education recommendations.
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
