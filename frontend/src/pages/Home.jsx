import React from 'react';
import { Link } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, MINISTRY_NAME, KINGDOM } from '../theme/government';

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
  return (
    <OnboardingLayout wide>
      <div
        className="mx-0 mt-0 w-full mb-[-1.5rem] sm:mb-[-2rem]"
        style={{ fontFamily: 'sans-serif', color: GOV.text, background: 'transparent', padding: 0 }}
      >

      {/* ── HERO ── */}
      <section
        className="mx-auto flex w-full max-w-[1100px] flex-col items-stretch gap-6 px-4 pb-0 pt-10 min-h-0 sm:gap-8 sm:px-6 sm:pt-12 lg:min-h-[min(520px,52vh)] lg:flex-row lg:justify-between lg:gap-8 lg:px-12 lg:pt-16"
      >
        <div className="w-full max-w-none shrink-0 self-center lg:max-w-[420px] lg:self-center">
          <h1
            className="mb-3 text-[1.65rem] font-extrabold leading-tight sm:text-[1.85rem] lg:text-[2.2rem]"
            style={{ color: GOV.text }}
          >
            Welcome to the Self-Directed Search (SDS)
          </h1>
          <p className="mb-8 text-[0.9rem] leading-relaxed sm:text-[0.92rem]" style={{ color: GOV.textMuted }}>
            The Self-Directed Search (SDS) is a structured interest inventory: it records your preferences across standard occupational themes and produces a profile used to align brief guidance with your results and to support career planning.
          </p>
          <Link to="/register" style={{ ...btnPrimary, display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
            Register an account
          </Link>
        </div>
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-end lg:max-w-none lg:flex-[1_1_480px] lg:items-end">
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

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto flex w-full max-w-[1100px] flex-col items-stretch gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-12 lg:flex-row lg:items-start lg:gap-12 lg:px-8 lg:py-16">
        <div className="flex shrink-0 justify-center lg:basis-[320px] lg:justify-start">
          <img
            src="/chair-person.png"
            alt=""
            className="h-auto w-full max-w-[280px] object-contain sm:max-w-[320px] lg:max-w-[320px]"
          />
        </div>
        <div className="min-w-0 w-full flex-1">
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 2rem', color: GOV.text }}>How the system operates</h2>
          {[
            {
              active: true,
              title: 'Assess',
              desc: 'Sign in and complete the Self-Directed Search assessment through your authenticated account.',
            },
            {
              active: false,
              title: 'Review',
              desc: 'Examine your profile output and the explanatory resources supplied within the platform.',
            },
            {
              active: false,
              title: 'Proceed',
              desc: 'Apply the information, in conjunction with institutional guidance or qualified advisers as applicable, to support career planning.',
            },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: item.active ? GOV.blue : GOV.border,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: '2px',
              }}>
                {item.active && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.3rem', color: GOV.text }}>{item.title}</p>
                {item.desc && <p style={{ fontSize: '0.82rem', color: GOV.textMuted, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ ...fullBleed, background: '#fff', borderTop: `1px solid ${GOV.border}` }}>
        <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8">
          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: GOV.textHint,
            lineHeight: 1.5,
            margin: 0,
          }}>
            © {new Date().getFullYear()} {KINGDOM}. {MINISTRY_NAME}. All rights reserved.
          </p>
        </div>
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