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

const heroHighlights = [
  {
    title: 'Understand yourself',
    text: 'Identify interests, strengths, and preferred work activities.',
    Icon: Target,
  },
  {
    title: 'Read your code',
    text: 'Turn your answers into a clear Holland Code profile.',
    Icon: BookOpenCheck,
  },
  {
    title: 'Plan your path',
    text: 'Use results to explore education and career options.',
    Icon: GraduationCap,
  },
];

const steps = [
  {
    number: '01',
    title: 'Register',
    description: 'Create your secure SDS profile.',
    Icon: UserPlus,
  },
  {
    number: '02',
    title: 'Complete SDS',
    description: 'Answer guided interest and ability questions.',
    Icon: ClipboardList,
  },
  {
    number: '03',
    title: 'View results',
    description: 'Review your Holland Code and recommendations.',
    Icon: BarChart3,
  },
  {
    number: '04',
    title: 'Take action',
    description: 'Discuss and plan suitable pathways.',
    Icon: Map,
  },
];

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f4f9fc] text-[#111827]">
      <header className="sticky top-0 z-40 border-b border-[#d8e7f1] bg-white/96 shadow-sm backdrop-blur">
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
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Learn more
            </Link>
          </div>
        </div>
      </header>

      <main id="landing-content" className="flex flex-1 flex-col">
        <section className="relative isolate overflow-hidden bg-[#07183d] lg:hidden">
          <img
            src="/landing-assessment-testing.jpg"
            alt="Pencil marking an assessment answer sheet"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center] opacity-70"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#07183d]/92 via-[#07183d]/84 to-[#07183d]/96" />
          <div className="absolute inset-x-0 top-0 flex h-1.5">
            <div className="flex-1 bg-[#3b82c4]" />
            <div className="w-20 bg-[#ffeb3b]" />
            <div className="w-28 bg-[#f44336]" />
            <div className="w-20 bg-[#ffeb3b]" />
            <div className="flex-1 bg-[#3b82c4]" />
          </div>

          <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-5 sm:py-7 md:px-6 md:py-10">
            <div className="grid w-full min-w-0 gap-3.5 sm:gap-4 md:grid-cols-[minmax(0,1fr)_19rem] md:items-start">
              <div className="w-full min-w-0 rounded-lg border border-white/20 bg-[#07183d]/90 p-3 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-5">
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  <span className="max-w-full rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white sm:px-3 sm:text-[10px]">
                    Official portal
                  </span>
                  <span className="max-w-full rounded-full border border-[#ffeb3b] bg-[#ffeb3b] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#4b3b00] sm:px-3 sm:text-[10px]">
                    National career assessment
                  </span>
                </div>

                <h2 className="mt-4 max-w-full text-[1.75rem] font-extrabold leading-[1.04] text-white sm:mt-5 sm:text-[2.7rem]">
                  <span className="block sm:inline">Self-Directed</span>{' '}
                  <span className="block sm:inline">Search</span>
                  <span className="block">(SDS)</span>
                </h2>
                <p className="mt-3 max-w-full text-[0.9rem] font-bold leading-6 text-[#d9efff] sm:mt-4 sm:text-lg">
                  Career guidance for informed education and work decisions.
                </p>
                <p className="mt-3 max-w-full text-[0.8rem] font-medium leading-6 text-white/90 sm:mt-4 sm:text-sm">
                  SDS helps you understand your interests, abilities, and preferred work activities, then turns your answers into a Holland Code profile for practical study and career planning.
                </p>

                <div className="mt-4 grid w-full min-w-0 grid-cols-2 gap-2 sm:mt-5">
                  <Link
                    to="/login"
                    className="group inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md bg-[#2d8bc4] px-4 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-[#256b9a] sm:h-11 sm:px-5"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Login
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-white/75 bg-white px-4 text-sm font-bold text-[#086fcf] shadow-lg shadow-black/20 transition-all duration-200 hover:bg-[#f7fbff] sm:h-11 sm:px-5"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Register
                  </Link>
                </div>
              </div>

              <aside className="w-full min-w-0 rounded-lg border border-white/20 bg-white/[0.13] p-3 text-white shadow-2xl shadow-black/20 backdrop-blur-xl ring-1 ring-white/10 sm:p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#ffeb3b]">How it works</p>
                    <h2 className="mt-1 text-xl font-extrabold text-white">Four simple steps</h2>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-[#ffeb3b] ring-1 ring-white/20">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-4 grid w-full min-w-0 gap-2 sm:grid-cols-2 md:grid-cols-1">
                  {steps.map(({ number, title, description, Icon }) => (
                    <div
                      key={number}
                      className="flex min-w-0 gap-3 rounded-md border border-white/20 bg-gradient-to-r from-[#07183d] via-[#0b214c] to-[#112f64] p-3 shadow-sm shadow-black/30"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-[#ffeb3b] ring-1 ring-white/20">
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
            </div>

            <div className="mt-4 grid w-full min-w-0 gap-2 sm:grid-cols-3">
              {heroHighlights.map(({ title, text, Icon }) => (
                <div
                  key={title}
                  className="rounded-lg border border-white/20 bg-white/[0.11] p-3 text-white backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-[#ffeb3b] ring-1 ring-white/20">
                      <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold">{title}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/80">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
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

      <footer className="bg-[#333b4c] px-6 py-3 text-center text-xs font-normal text-white">
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
  );
}
