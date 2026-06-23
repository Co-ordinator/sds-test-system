import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from 'lucide-react';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, KINGDOM, MINISTRY_NAME } from '../theme/government';

const audiences = [
  {
    title: 'High school learners',
    text: 'Learners receive career direction that can support subject choices, guidance discussions, and early pathway planning.',
    icon: GraduationCap,
  },
  {
    title: 'Tertiary students',
    text: 'Students can connect their Holland Code profile to courses, study fields, and opportunities after tertiary education.',
    icon: BookOpen,
  },
  {
    title: 'Professionals',
    text: 'Working users can review career fit, growth options, relevant occupations, and possible further-study pathways.',
    icon: UsersRound,
  },
];

const capabilities = [
  'Secure OTP-based account verification and password recovery',
  'Mobile-ready questionnaire experience with autosaved progress',
  'Glossary support and voice assistance for difficult assessment terms',
  'Holland Code results, career pathways, certificates, and PDF reports',
  'Role-based access for test takers, test administrators, and system administrators',
  'Institution, region, school, occupation, and priority-list data for better reporting',
];

const riasec = [
  ['R', 'Realistic', 'Practical, hands-on activities and technical work.'],
  ['I', 'Investigative', 'Analysis, research, science, and problem solving.'],
  ['A', 'Artistic', 'Creative expression, design, writing, and performance.'],
  ['S', 'Social', 'Helping, teaching, counseling, and service work.'],
  ['E', 'Enterprising', 'Leadership, persuasion, business, and initiative.'],
  ['C', 'Conventional', 'Organisation, records, data, and structured procedures.'],
];

export default function About() {
  return (
    <OnboardingLayout wide>
      <div className="mx-0 mb-[-1.5rem] mt-0 w-full text-[#111827] sm:mb-[-2rem]">
        <section className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-center lg:px-8 lg:py-14">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: GOV.blue }}>
              Ministry of Labour: Measurement and Testing Unit
            </p>
            <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl" style={{ color: GOV.text }}>
              About the Self-Directed Search system
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 sm:text-base" style={{ color: GOV.textMuted }}>
              The SDS Test System is a national career assessment platform that helps learners, students, and
              professionals understand their interests, abilities, preferred activities, and possible education or
              career pathways.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition hover:opacity-95"
                style={{ backgroundColor: GOV.blue, textDecoration: 'none' }}
              >
                Register an account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/help"
                className="inline-flex items-center justify-center rounded-lg border bg-white px-5 py-3 text-sm font-bold transition hover:bg-gray-50"
                style={{ borderColor: GOV.border, color: GOV.blue, textDecoration: 'none' }}
              >
                Read FAQs
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border bg-white p-5 shadow-[0_18px_45px_rgba(15,45,75,0.10)]" style={{ borderColor: GOV.border }}>
            <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: GOV.borderLight }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: GOV.blueLightAlt }}>
                <BarChart3 className="h-5 w-5" style={{ color: GOV.blue }} />
              </div>
              <div>
                <p className="m-0 text-sm font-extrabold" style={{ color: GOV.text }}>What SDS produces</p>
                <p className="m-0 mt-1 text-xs" style={{ color: GOV.textMuted }}>A practical Holland Code profile.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {['Interest profile', 'Career recommendations', 'Study and pathway guidance', 'Downloadable report and certificate'].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg bg-[#f8fafc] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOV.blue }} />
                  <span className="text-sm font-semibold" style={{ color: GOV.text }}>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="border-y bg-[#f8fafc]" style={{ borderColor: GOV.borderLight }}>
          <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-6 max-w-3xl">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: GOV.blue }}>
                Who the system supports
              </p>
              <h2 className="text-2xl font-black sm:text-3xl" style={{ color: GOV.text }}>
                Guidance that changes with the user group.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {audiences.map(({ title, text, icon: Icon }) => (
                <article key={title} className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: GOV.border }}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: GOV.blueLightAlt }}>
                    <Icon className="h-5 w-5" style={{ color: GOV.blue }} />
                  </div>
                  <h3 className="mb-2 text-base font-extrabold" style={{ color: GOV.text }}>{title}</h3>
                  <p className="m-0 text-sm leading-6" style={{ color: GOV.textMuted }}>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1120px] gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: GOV.blue }}>
              RIASEC model
            </p>
            <h2 className="text-2xl font-black sm:text-3xl" style={{ color: GOV.text }}>
              The six Holland career themes.
            </h2>
            <p className="mt-4 text-sm leading-7" style={{ color: GOV.textMuted }}>
              SDS groups responses into six themes. Your strongest themes combine into a Holland Code, which the system
              uses to match relevant occupations, study options, and next steps.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {riasec.map(([code, title, text]) => (
              <div key={code} className="flex gap-3 rounded-xl border bg-white p-4" style={{ borderColor: GOV.border }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white" style={{ backgroundColor: GOV.blue }}>
                  {code}
                </div>
                <div>
                  <p className="m-0 text-sm font-extrabold" style={{ color: GOV.text }}>{title}</p>
                  <p className="m-0 mt-1 text-xs leading-5" style={{ color: GOV.textMuted }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-white" style={{ borderColor: GOV.borderLight }}>
          <div className="mx-auto grid max-w-[1120px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
            <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: GOV.border }}>
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6" style={{ color: GOV.blue }} />
                <h2 className="m-0 text-xl font-black" style={{ color: GOV.text }}>Platform capabilities</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {capabilities.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOV.blue }} />
                    <p className="m-0 text-sm leading-6" style={{ color: GOV.textMuted }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="grid gap-3">
              <div className="rounded-xl border bg-[#f8fafc] p-4" style={{ borderColor: GOV.border }}>
                <Smartphone className="mb-3 h-5 w-5" style={{ color: GOV.blue }} />
                <h3 className="mb-1 text-sm font-extrabold" style={{ color: GOV.text }}>Mobile first</h3>
                <p className="m-0 text-xs leading-5" style={{ color: GOV.textMuted }}>
                  Built for users who mainly access the system by phone.
                </p>
              </div>
              <div className="rounded-xl border bg-[#f8fafc] p-4" style={{ borderColor: GOV.border }}>
                <MapPinned className="mb-3 h-5 w-5" style={{ color: GOV.blue }} />
                <h3 className="mb-1 text-sm font-extrabold" style={{ color: GOV.text }}>Local data</h3>
                <p className="m-0 text-xs leading-5" style={{ color: GOV.textMuted }}>
                  Uses Eswatini regions, schools, institutions, and priority guidance data.
                </p>
              </div>
              <div className="rounded-xl border bg-[#f8fafc] p-4" style={{ borderColor: GOV.border }}>
                <LockKeyhole className="mb-3 h-5 w-5" style={{ color: GOV.blue }} />
                <h3 className="mb-1 text-sm font-extrabold" style={{ color: GOV.text }}>Controlled access</h3>
                <p className="m-0 text-xs leading-5" style={{ color: GOV.textMuted }}>
                  Roles keep test taker, test administrator, and system administrator access separate.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <footer style={{ background: '#fff', borderTop: `1px solid ${GOV.border}` }}>
          <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8">
            <p className="m-0 text-center text-xs leading-6" style={{ color: GOV.textHint }}>
              &copy; {new Date().getFullYear()} {KINGDOM}. {MINISTRY_NAME}. All rights reserved. Powered by{' '}
              <a
                href="https://datamatics.co.sz"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold"
                style={{ color: GOV.blue, textDecoration: 'none' }}
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
