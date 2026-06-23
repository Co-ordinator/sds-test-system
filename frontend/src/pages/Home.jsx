import React from 'react';
import { Link } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, MINISTRY_NAME, KINGDOM } from '../theme/government';

const fullBleed = {
  position: 'relative',
  boxSizing: 'border-box',
  marginLeft: 'calc(50% - 50vw)',
  marginRight: 'calc(50% - 50vw)',
};

const pathwaySteps = [
  {
    num: '01',
    title: 'Register and verify',
    desc: 'Establish your account and confirm contact details for programme access.',
  },
  {
    num: '02',
    title: 'Complete the instrument',
    desc: 'Work through the assessment items within the secure SDS session.',
  },
  {
    num: '03',
    title: 'Review your profile',
    desc: 'Consult your Holland Code output and explanatory resources.',
  },
  {
    num: '04',
    title: 'Plan next steps',
    desc: 'Use your documented results to support study and career planning.',
  },
];

const operationSteps = [
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
    desc: 'Apply the information with school, institutional, or career guidance support where appropriate.',
  },
];

export default function Home() {
  return (
    <OnboardingLayout wide>
      <div
        className="mx-0 mb-[-1.5rem] mt-0 w-full sm:mb-[-2rem]"
        style={{ fontFamily: 'sans-serif', color: GOV.text, background: 'transparent', padding: 0 }}
      >
        <section className="mx-auto flex w-full max-w-[1100px] flex-col items-stretch gap-6 px-4 pb-10 pt-10 sm:gap-8 sm:px-6 sm:pb-12 sm:pt-12 lg:min-h-[min(520px,52vh)] lg:flex-row lg:justify-between lg:gap-8 lg:px-12 lg:pb-14 lg:pt-16">
          <div className="w-full max-w-none shrink-0 self-center lg:max-w-[430px]">
            <p className="mb-3 text-[0.72rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: GOV.blue }}>
              Ministry of Labour: Measurement and Testing Unit
            </p>
            <h1
              className="mb-3 text-[1.8rem] font-extrabold leading-tight sm:text-[2.05rem] lg:text-[2.45rem]"
              style={{ color: GOV.text }}
            >
              Welcome to the Self-Directed Search (SDS)
            </h1>
            <p className="mb-6 text-[0.9rem] leading-relaxed sm:text-[0.94rem]" style={{ color: GOV.textMuted }}>
              SDS is a structured career-interest assessment. It records your preferences across standard occupational
              themes and produces a Holland Code profile to support practical education and career planning.
            </p>
            <div className="mb-2 flex flex-col gap-3 sm:mb-0 sm:flex-row">
              <Link to="/login" style={{ ...btnPrimary, textDecoration: 'none', textAlign: 'center' }}>
                Login
              </Link>
              <Link to="/register" style={{ ...btnSecondary, textDecoration: 'none', textAlign: 'center' }}>
                Register an account
              </Link>
            </div>
          </div>

          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-end lg:flex-[1_1_480px] lg:items-end">
            <img
              src="/hero-group.png"
              alt=""
              className="mx-auto block h-auto w-full max-w-[min(100%,420px)] object-contain object-bottom sm:max-w-[min(100%,520px)] lg:mx-0 lg:max-w-[580px]"
              style={{ maxHeight: 'min(52vh, 640px)' }}
            />
          </div>
        </section>

        <section style={{ ...fullBleed, background: '#fff' }}>
          <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:gap-8">
              <div className="order-1 min-w-0 w-full lg:order-2 lg:flex-[4]">
                <h2 className="mb-4 text-left text-lg font-extrabold sm:text-xl lg:mb-6 lg:text-2xl" style={{ color: GOV.text }}>
                  Programme pathway from registration to guidance
                </h2>
                <div className="relative -mx-1 overflow-x-auto pb-2 lg:mx-0 lg:overflow-visible">
                  <div className="relative flex min-w-[600px] justify-between lg:min-w-0" style={{ alignItems: 'flex-start' }}>
                    <div
                      className="pointer-events-none absolute left-5 right-5 top-5 z-0 hidden h-0.5 sm:block"
                      style={{ background: GOV.border }}
                    />
                    {pathwaySteps.map((step) => (
                      <div key={step.num} className="relative z-[1] flex-1 px-1 text-center sm:px-2">
                        <div style={stepNumberStyle}>{step.num}</div>
                        <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: '0 0 0.35rem', color: GOV.text }}>
                          {step.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: GOV.textMuted, margin: 0 }}>{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-2 flex w-full shrink-0 justify-center lg:order-1 lg:max-w-[240px] lg:flex-[1] lg:justify-start">
                <img
                  src="/auth.png"
                  alt=""
                  className="block h-auto w-full max-w-[200px] object-contain sm:max-w-[220px] lg:max-w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-[1100px] flex-col items-stretch gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-12 lg:flex-row lg:items-start lg:gap-12 lg:px-8 lg:py-16">
          <div className="flex shrink-0 justify-center lg:basis-[320px] lg:justify-start">
            <img
              src="/chair-person.png"
              alt=""
              className="h-auto w-full max-w-[280px] object-contain sm:max-w-[320px] lg:max-w-[320px]"
            />
          </div>
          <div className="min-w-0 w-full flex-1">
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 2rem', color: GOV.text }}>
              How the system operates
            </h2>
            {operationSteps.map((item) => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ ...operationDotStyle, background: item.active ? GOV.blue : GOV.border }}>
                  {item.active && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2 7l3.5 3.5L12 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.3rem', color: GOV.text }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: GOV.textMuted, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ ...fullBleed, background: '#fff', borderTop: `1px solid ${GOV.border}` }}>
          <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8">
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: GOV.textHint,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              &copy; {new Date().getFullYear()} {KINGDOM}. {MINISTRY_NAME}. All rights reserved. Powered by{' '}
              <a
                href="https://datamatics.co.sz"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: GOV.blue, fontWeight: 700, textDecoration: 'none' }}
              >
                Datamatics Eswatini
              </a>.
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

const btnSecondary = {
  background: '#ffffff',
  color: GOV.blue,
  border: `1px solid ${GOV.border}`,
  borderRadius: '6px',
  padding: '10px 24px',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const stepNumberStyle = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  background: GOV.blue,
  color: GOV.ministryBarText,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.75rem',
  margin: '0 auto 0.75rem',
};

const operationDotStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '2px',
};
