import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Lock,
  Map,
  ShieldCheck,
  Target,
  UserPlus,
} from 'lucide-react';
import { LOGO_ALT } from '../theme/government';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Break out of OnboardingLayout `max-w-5xl` so background paints edge-to-edge.
 * Avoid `width: 100vw` — with a vertical scrollbar, 100vw is wider than the layout
 * and causes a horizontal scrollbar in many browsers.
 */
const fullBleed = {
  position: 'relative',
  boxSizing: 'border-box',
  marginLeft: 'calc(50% - 50vw)',
  marginRight: 'calc(50% - 50vw)',
};

export default function Home() {
  const { getAriaLabel } = useAccessibility();
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f4f9fc] text-[#111827]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-[#d8e7f1] bg-white/96 shadow-sm backdrop-blur" role="banner">
        <div className="mx-auto max-w-[92rem] px-3 py-3 sm:px-5 lg:px-6 lg:py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="flex min-w-0 items-center gap-2.5 text-left sm:gap-4">
              <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md border border-[#d8e7f1] bg-white px-1.5 shadow-sm sm:h-[4.75rem] sm:w-[14.5rem] sm:border-0 sm:px-0 sm:shadow-none lg:w-[19rem]">
                <img
                  src="/letterhead.png"
                  alt={LOGO_ALT}
                  className="h-11 w-full object-contain sm:h-[4.25rem] lg:h-[4.75rem]"
                />
              </div>
              <div className="hidden h-16 w-1.5 shrink-0 overflow-hidden rounded-full sm:block">
                <div className="h-1/3 bg-[#3b82c4]" />
                <div className="h-1/6 bg-[#ffeb3b]" />
                <div className="h-1/3 bg-[#f44336]" />
                <div className="h-1/6 bg-[#ffeb3b]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#2d8bc4] sm:text-[11px]">
                  Government of Eswatini
                </p>
                <h1 className="mt-0.5 text-[0.95rem] font-extrabold leading-[1.05] text-[#07183d] sm:text-2xl lg:text-[30px] xl:whitespace-nowrap xl:text-[34px]">
                  <span className="block sm:inline">Ministry of Labor:</span>{' '}
                  <span className="block whitespace-nowrap text-[#07183d] sm:inline">
                    Measurement and Testing Unit
                  </span>
                </h1>
                <p className="mt-1 text-[10px] font-semibold leading-snug text-[#4b5563] sm:text-sm">
                  SDS National Career Assessment System
                </p>
              </div>
            </div>

            <Link
              to="/help"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#d8e1ea] bg-white px-4 text-sm font-semibold text-[#2d8bc4] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7fbeeb] hover:bg-[#f7fbff] hover:shadow-md sm:h-10 sm:w-fit lg:self-auto"
              aria-label={getAriaLabel('Open help page', 'Home actions')}
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Learn more
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 flex-col" role="main">
        <section className="relative isolate overflow-hidden bg-[#07183d] lg:hidden">
          <img
            src="/hero-group.png"
            alt=""
            className="mx-auto block h-auto w-full max-w-[min(100%,420px)] object-contain object-bottom sm:max-w-[min(100%,520px)] lg:mx-0 lg:max-w-[580px]"
            style={{ maxHeight: 'min(52vh, 640px)' }}
          />
        </div>
      </section>

      {/* ── Programme pathway ── */}
      <section style={{ ...fullBleed, background: GOV.borderLight }}>
        <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="order-1 min-w-0 w-full lg:order-2 lg:min-w-0 lg:flex-[4]">
            <h2 className="mb-4 text-left text-lg font-extrabold sm:text-xl lg:mb-6 lg:text-2xl" style={{ color: GOV.text }}>
              Programme pathway from registration to guidance
            </h2>
            <div className="relative -mx-1 overflow-x-auto pb-2 lg:mx-0 lg:overflow-visible">
            <div className="relative flex min-w-[600px] justify-between lg:min-w-0" style={{ alignItems: 'flex-start' }}>
              <div
                className="pointer-events-none absolute left-5 right-5 top-5 z-0 hidden h-0.5 sm:block"
                style={{ background: GOV.border }}
              />
              {[
                { num: 'one', title: 'Register and verify', desc: 'Establish your account and confirm contact details as required for programme access.' },
                { num: 'two', title: 'Complete the instrument', desc: 'Work through the assessment items within the secure session provided by the system.' },
                { num: 'three', title: 'Review your profile', desc: 'Consult outputs and explanatory material consistent with the SDS framework.' },
                { num: 'four', title: 'Plan next steps', desc: 'Use documented results, together with qualified advisers where appropriate, to inform career decisions.' },
              ].map((step) => (
                <div key={step.num} className="relative z-[1] flex-1 px-1 text-center sm:px-2">
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: GOV.blue, color: GOV.ministryBarText,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.75rem',
                    margin: '0 auto 0.75rem',
                  }}>
                    {step.num}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: '0 0 0.35rem', color: GOV.text }}>{step.title}</p>
                  <p style={{ fontSize: '0.75rem', color: GOV.textMuted, margin: 0 }}>{step.desc}</p>
                </div>
              ))}
            </div>
            </div>
          </div>
          <div className="order-2 flex w-full shrink-0 justify-center lg:order-1 lg:flex-[1] lg:max-w-[240px] lg:justify-start">
            <img
              src="/auth-white.png"
              alt=""
              className="block h-auto w-full max-w-[200px] object-contain sm:max-w-[220px] lg:max-w-full"
            />
          </div>
        </div>
        </div>
      </section>

        <section className="relative isolate hidden flex-1 overflow-hidden bg-[#07183d] lg:flex">
          <img
            src="/landing-assessment-testing.jpg"
            alt="Pencil marking an assessment answer sheet"
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07183d] via-[#07183d]/86 to-[#c83232]/28" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#07183d]/92 via-[#07183d]/18 to-[#edf6fc]/10" />
          <div className="absolute inset-x-0 top-0 flex h-1.5">
            <div className="flex-1 bg-[#3b82c4]" />
            <div className="w-20 bg-[#ffeb3b]" />
            <div className="w-28 bg-[#f44336]" />
            <div className="w-20 bg-[#ffeb3b]" />
            <div className="flex-1 bg-[#3b82c4]" />
          </div>

          <div className="mx-auto grid w-full max-w-[92rem] flex-1 justify-items-start gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-center lg:justify-items-stretch lg:gap-8 lg:py-12 xl:py-16 2xl:max-w-[104rem]">
            <div className="min-w-0 max-w-[21.75rem] sm:max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
                  Official portal
                </span>
                <span className="rounded-full border border-[#ffeb3b] bg-[#ffeb3b] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#4b3b00]">
                  National career assessment
                </span>
              </div>

              <h2 className="mt-5 max-w-full break-words text-[2rem] font-extrabold leading-[1.04] text-white sm:mt-6 sm:text-5xl sm:leading-[1.02] lg:max-w-4xl lg:text-[66px]">
                <span className="block sm:inline">Self-Directed Search</span>{' '}
                <span className="block sm:inline">(SDS)</span>
              </h2>
              <p className="mt-4 max-w-full text-[0.95rem] font-bold leading-6 text-[#d9efff] sm:max-w-3xl sm:text-2xl sm:leading-8">
                Career guidance for informed education and work decisions.
              </p>
              <p className="mt-4 max-w-full text-[0.82rem] font-medium leading-6 text-white/90 sm:mt-5 sm:max-w-3xl sm:text-lg sm:leading-7">
                SDS helps learners and professionals understand their interests, abilities, and preferred work activities. The assessment produces a Holland Code profile that supports practical career and education planning.
              </p>

              <div className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:mt-8 sm:flex-row">
                <Link
                  to="/login"
                  className="group inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#2d8bc4] px-5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#256b9a] hover:shadow-xl sm:h-12"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Login
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-white/75 bg-white px-5 text-sm font-bold text-[#086fcf] shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f7fbff] hover:shadow-xl sm:h-12"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Register
                </Link>
              </div>
            </div>

            <aside
              className="w-full max-w-[21.75rem] rounded-xl border border-white/25 bg-white/[0.13] p-3 text-white shadow-2xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/10 sm:max-w-none sm:p-4 lg:self-center"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#ffeb3b]">How it works</p>
                  <h2 className="mt-1 text-lg font-extrabold text-white sm:text-xl">Four simple steps</h2>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-[#ffeb3b] ring-1 ring-white/20 sm:h-10 sm:w-10">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                {steps.map(({ number, title, description, Icon }) => (
                  <div
                    key={number}
                    className="group flex gap-3 rounded-md border border-white/20 bg-gradient-to-r from-[#07183d] via-[#0b214c] to-[#112f64] p-2.5 shadow-sm shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffeb3b]/70 hover:from-[#0a1d49] hover:via-[#0e2859] hover:to-[#173a78] hover:shadow-md sm:p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-[#ffeb3b] ring-1 ring-white/20 transition-colors duration-200 group-hover:bg-[#ffeb3b] group-hover:text-[#07183d]">
                      <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-[#ffeb3b]">{number}</span>
                        <h3 className="text-sm font-extrabold text-white">{title}</h3>
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-white/80">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <div className="hidden gap-3 md:grid md:grid-cols-3 lg:col-span-2">
              {heroHighlights.map(({ title, text, Icon }) => (
                <div
                  key={title}
                  className="group border border-white/20 bg-white/[0.11] p-4 text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-[#ffeb3b]/70 hover:bg-white/[0.16]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-[#ffeb3b] ring-1 ring-white/20 transition-colors duration-200 group-hover:bg-[#ffeb3b] group-hover:text-[#07183d]">
                      <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/80">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#333b4c] px-6 py-3 text-center text-xs font-normal text-white" role="contentinfo">
        <p>
          &copy; {year} All rights reserved. SDS Career Assessment System{' '}
          <span className="font-bold text-[#f44336]">|</span> Powered By:{' '}
          <a
            href="https://datamatics.co.sz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline-offset-4 transition-colors hover:text-[#7fbeeb] hover:underline"
          >
            Datamatics Eswatini
          </a>
        </p>
      </footer>

      </div>
    </OnboardingLayout>
  );
}

const btnPrimary = {
  background: GOV.blue,
  color: GOV.ministryBarText,
  border: 'none',
  borderRadius: '6px',
  padding: '10px 24px',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};