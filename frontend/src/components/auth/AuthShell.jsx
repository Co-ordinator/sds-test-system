import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, HelpCircle, ShieldCheck } from 'lucide-react';
import { LOGO_ALT } from '../../theme/government';
import { useAccessibility } from '../../context/AccessibilityContext';

const trustPoints = [
  'Secure account access',
  'Guided SDS assessment',
  'Personal Holland Code results',
];

export default function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
  panelTitle = 'Self-Directed Search',
  panelText = 'A national career assessment system for understanding interests, abilities, and education pathways.',
}) {
  const { getAriaLabel } = useAccessibility();

  return (
    <div className="min-h-screen bg-[#eef6fb] text-[#111827]">
      <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <img
          src="/landing-assessment-testing.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-[#eef6fb]/96 to-[#d8eaf7]/92" />

        <header className="shrink-0 border-b border-[#d8e7f1] bg-white/90 backdrop-blur" role="banner">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Back to landing page">
              <img
                src="/letterhead.png"
                alt={LOGO_ALT}
                className="h-12 w-32 shrink-0 object-contain object-left sm:h-14 sm:w-44"
              />
              <div className="hidden min-w-0 border-l border-[#d8e7f1] pl-3 sm:block">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#2d8bc4]">
                  Ministry of Labor
                </p>
                <p className="truncate text-sm font-extrabold text-[#07183d]">
                  Measurement and Testing Unit
                </p>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                className="hidden h-9 items-center gap-2 rounded-md border border-[#d8e1ea] bg-white px-3 text-xs font-bold text-[#4b5563] transition-colors hover:bg-[#f8fafc] sm:inline-flex"
                aria-label={getAriaLabel('Back to home page', 'Authentication navigation')}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Home
              </Link>
              <Link
                to="/help"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d8e1ea] bg-white px-3 text-xs font-bold text-[#2d8bc4] transition-colors hover:bg-[#f7fbff]"
                aria-label={getAriaLabel('Open help page', 'Authentication navigation')}
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Help
              </Link>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center px-4 py-6 sm:px-6 lg:py-10" id="main-content" role="main">
          <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,440px)] lg:items-stretch">
            <section className="relative hidden overflow-hidden rounded-lg border border-white/30 bg-[#07183d] p-7 text-white shadow-2xl shadow-[#07183d]/20 lg:flex lg:flex-col lg:justify-between">
              <img
                src="/landing-assessment-testing.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07183d]/96 via-[#07183d]/86 to-[#07183d]/50" />
              <div className="absolute inset-x-0 top-0 flex h-1.5">
                <div className="flex-1 bg-[#3b82c4]" />
                <div className="w-20 bg-[#ffeb3b]" />
                <div className="w-28 bg-[#f44336]" />
                <div className="w-20 bg-[#ffeb3b]" />
                <div className="flex-1 bg-[#3b82c4]" />
              </div>

              <div className="relative max-w-xl">
                <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#ffeb3b] backdrop-blur">
                  SDS national portal
                </span>
                <h1 className="mt-5 text-4xl font-extrabold leading-tight">
                  {panelTitle}
                </h1>
                <p className="mt-4 max-w-lg text-base font-medium leading-7 text-white/86">
                  {panelText}
                </p>
              </div>

              <div className="relative grid gap-3">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 rounded-md border border-white/16 bg-white/10 px-4 py-3 backdrop-blur"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#ffeb3b]" aria-hidden="true" />
                    <span className="text-sm font-bold text-white">{point}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex min-w-0 flex-col justify-center">
              <div className="mb-4 rounded-lg border border-[#d8e7f1] bg-white/85 p-4 shadow-sm backdrop-blur lg:hidden">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#edf6fc] text-[#2d8bc4]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#2d8bc4]">
                      SDS national portal
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-[#4b5563]">
                      Secure career assessment access for learners, students, and professionals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#d8e7f1] bg-white shadow-xl shadow-[#07183d]/10">
                <div className="border-b border-[#edf2f7] px-5 py-5 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#2d8bc4]">
                    {eyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold leading-tight text-[#07183d]">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#4b5563]">
                    {subtitle}
                  </p>
                </div>
                <div className="px-5 py-5 sm:px-6">
                  {children}
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#d8e7f1] bg-white/80 px-4 py-3 text-center text-xs font-medium text-[#4b5563]">
          SDS Career Assessment System
          <span className="mx-2 text-[#f44336]">|</span>
          <a
            href="https://datamatics.co.sz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#2d8bc4] hover:underline"
          >
            Datamatics Eswatini
          </a>
        </footer>
      </div>
    </div>
  );
}
