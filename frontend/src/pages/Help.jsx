import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  HelpCircle,
  KeyRound,
  Mail,
  Phone,
  Shield,
  Smartphone,
  UserPlus,
} from 'lucide-react';
import { GOV, TYPO, MINISTRY_NAME, KINGDOM } from '../theme/government';
import { resolveHelpBackTarget } from '../utils/helpNavigation';

const FAQ_VIDEO_URL = (process.env.REACT_APP_FAQ_VIDEO_URL || '').trim();

const getFaqVideoSource = (configuredUrl) => {
  if (!configuredUrl) return null;
  try {
    const parsed = new URL(configuredUrl, 'https://sds.local');
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId
        ? { type: 'youtube', url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` }
        : null;
    }
    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const videoId = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
      return videoId
        ? { type: 'youtube', url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` }
        : null;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return { type: 'video', url: configuredUrl };
  } catch {
    return null;
  }
};

const FaqVideo = ({ configuredUrl }) => {
  const source = getFaqVideoSource(configuredUrl);
  if (!source) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm" style={{ borderColor: GOV.border }}>
      <div className="p-4 sm:p-5">
        <h2 className="text-base font-extrabold" style={{ color: GOV.text }}>Video Guide</h2>
        <p className="mt-1 text-xs leading-5" style={{ color: GOV.textMuted }}>
          An optional walkthrough of registering, taking the SDS assessment, and reading your results.
        </p>
      </div>
      <div className="border-t" style={{ borderColor: GOV.borderLight }}>
        {source.type === 'youtube' ? (
          <iframe
            src={source.url}
            title="SDS instructional video"
            loading="lazy"
            className="aspect-video w-full border-0"
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video controls preload="none" className="aspect-video w-full bg-black" aria-label="SDS instructional video">
            <source src={source.url} />
            Your browser does not support embedded video.
          </video>
        )}
      </div>
    </div>
  );
};

const faqGroups = [
  {
    title: 'Getting Started',
    icon: UserPlus,
    questions: [
      {
        question: 'How do I create an SDS account?',
        answer: 'Open Register, enter your National ID, names, email address, password, and consent. The system sends an email OTP code. Enter that code to verify your account, then complete onboarding before using the dashboard.',
      },
      {
        question: 'Why must I complete onboarding?',
        answer: 'Onboarding captures the information needed for reporting and recommendations, such as your user group, region, school or institution, education level, and work details where applicable.',
      },
      {
        question: 'Can learners without email addresses use the system?',
        answer: 'Yes. A Test Administrator can import learners and generate login cards with a login number and temporary password. The learner signs in with those details and changes the password when required.',
      },
    ],
  },
  {
    title: 'Taking the Assessment',
    icon: BookOpen,
    questions: [
      {
        question: 'How long does the assessment take?',
        answer: 'Most users complete it in about 30 to 45 minutes. You can pause and resume later; your progress is saved as you answer.',
      },
      {
        question: 'Are there right or wrong answers?',
        answer: 'No. SDS is a career-interest questionnaire, not an exam. Choose answers that honestly reflect what you like, know, can do, or prefer.',
      },
      {
        question: 'What happens if I skip questions by mistake?',
        answer: 'When you submit, the system checks for skipped questions. If any are missing, a panel shows those questions and lets you jump back to answer them before final submission.',
      },
      {
        question: 'Can I understand difficult words during the questionnaire?',
        answer: 'Yes. Glossary-supported terms can be highlighted during the assessment, with definitions and voice support available for users who need it.',
      },
    ],
  },
  {
    title: 'Results & Certificates',
    icon: Award,
    questions: [
      {
        question: 'What is a Holland Code?',
        answer: 'A Holland Code is a set of your strongest RIASEC themes: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional. It helps connect your interests to suitable study and career pathways.',
      },
      {
        question: 'Are recommendations the same for everyone?',
        answer: 'No. Recommendations are adjusted by user group. High school learners can see subject and pathway guidance, tertiary students see study and career options, and professionals see work or further study options relevant to their profile.',
      },
      {
        question: 'How do I get my certificate?',
        answer: 'After completing the assessment, use Download Certificate from your results or dashboard. The system creates the certificate automatically if it has not already been issued.',
      },
    ],
  },
  {
    title: 'Account & Support',
    icon: Shield,
    questions: [
      {
        question: 'What if I forget my password?',
        answer: 'Use Forgot Password on the login page. The system sends an OTP code to your email, then lets you set a new password after successful verification.',
      },
      {
        question: 'Can I use SDS on a phone?',
        answer: 'Yes. The system is designed for phones, tablets, and desktop computers. Assessment screens, dashboards, forms, and glossary support are mobile responsive.',
      },
      {
        question: 'How is my information protected?',
        answer: 'The system uses authenticated access, role-based permissions, account verification, and privacy controls aligned with safe handling of personal information.',
      },
    ],
  },
];

const quickFacts = [
  { icon: Clock, label: '30-45 minutes', text: 'Typical completion time' },
  { icon: Smartphone, label: 'Mobile ready', text: 'Designed for phones and tablets' },
  { icon: KeyRound, label: 'OTP protected', text: 'Email verification and password reset' },
  { icon: CheckCircle, label: 'Auto-saved', text: 'Progress saves while answering' },
];

export default function Help() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [publishedFaqs, setPublishedFaqs] = useState([]);

  useEffect(() => {
    let active = true;
    api.get('/api/v1/faqs')
      .then((response) => {
        if (active) setPublishedFaqs(response.data?.data?.faqs || []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const displayedGroups = useMemo(() => {
    if (publishedFaqs.length === 0) return faqGroups;
    return [
      ...faqGroups,
      {
        title: 'More Help',
        icon: HelpCircle,
        questions: publishedFaqs.map(({ question, answer }) => ({ question, answer }))
      }
    ];
  }, [publishedFaqs]);

  const handleBack = (event) => {
    event.preventDefault();
    navigate(resolveHelpBackTarget({
      historyIndex: window.history.state?.idx,
      isAuthenticated,
      role: user?.role
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <div
        className="flex-shrink-0 border-b py-1.5 text-center"
        style={{ borderColor: GOV.border, backgroundColor: GOV.ministryBarBg }}
      >
        <p className={TYPO.ministryBanner} style={{ color: GOV.ministryBarText }}>
          {MINISTRY_NAME} · {KINGDOM}
        </p>
      </div>

      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur" style={{ borderColor: GOV.border }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" onClick={handleBack} className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: GOV.blue }}>
            <ArrowLeft className="h-4 w-4" />
            {isAuthenticated ? 'Back' : 'Back to Home'}
          </Link>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" style={{ color: GOV.blue }} />
            <span className="text-sm font-extrabold sm:text-base" style={{ color: GOV.text }}>SDS FAQ</span>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: GOV.blue }}>
                Frequently asked questions
              </p>
              <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl" style={{ color: GOV.text }}>
                Quick answers for using the SDS Test System.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 sm:text-base" style={{ color: GOV.textMuted }}>
                Find practical answers about registration, OTP verification, onboarding, taking the assessment,
                glossary support, results, certificates, and account recovery.
              </p>
            </div>

            <aside className="rounded-xl border bg-[#f8fafc] p-4" style={{ borderColor: GOV.border }}>
              <h2 className="mb-3 text-sm font-extrabold" style={{ color: GOV.text }}>Need direct support?</h2>
              <div className="space-y-3">
                <a href="mailto:mis@datamatics.co.sz" className="flex items-start gap-3 rounded-lg bg-white p-3 transition hover:shadow-sm">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOV.blue }} />
                  <span>
                    <span className="block text-xs font-bold" style={{ color: GOV.text }}>Email support</span>
                    <span className="block text-xs" style={{ color: GOV.textMuted }}>mis@datamatics.co.sz</span>
                  </span>
                </a>
                <a href="tel:+26824047198" className="flex items-start gap-3 rounded-lg bg-white p-3 transition hover:shadow-sm">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOV.blue }} />
                  <span>
                    <span className="block text-xs font-bold" style={{ color: GOV.text }}>Phone support</span>
                    <span className="block text-xs" style={{ color: GOV.textMuted }}>+268 2404 7198</span>
                  </span>
                </a>
              </div>
            </aside>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickFacts.map(({ icon: Icon, label, text }) => (
              <div key={label} className="rounded-lg border bg-white p-4 shadow-sm" style={{ borderColor: GOV.border }}>
                <Icon className="mb-3 h-5 w-5" style={{ color: GOV.blue }} />
                <p className="m-0 text-sm font-extrabold" style={{ color: GOV.text }}>{label}</p>
                <p className="m-0 mt-1 text-xs leading-5" style={{ color: GOV.textMuted }}>{text}</p>
              </div>
            ))}
          </div>

          <FaqVideo configuredUrl={FAQ_VIDEO_URL} />
        </section>

        <section className="border-t bg-[#f8fafc]" style={{ borderColor: GOV.borderLight }}>
          <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:px-8">
            {displayedGroups.map(({ title, icon: Icon, questions }) => (
              <article key={title} className="rounded-xl border bg-white p-4 shadow-sm sm:p-5" style={{ borderColor: GOV.border }}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: GOV.blueLightAlt }}>
                    <Icon className="h-5 w-5" style={{ color: GOV.blue }} />
                  </div>
                  <h2 className="text-lg font-extrabold" style={{ color: GOV.text }}>{title}</h2>
                </div>

                <div className="space-y-2">
                  {questions.map((item, index) => (
                    <details
                      key={item.question}
                      className="group rounded-lg border bg-white px-3 py-3"
                      style={{ borderColor: GOV.borderLight }}
                      open={index === 0}
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-bold" style={{ color: GOV.text }}>
                        <span>{item.question}</span>
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: GOV.textMuted }} />
                      </summary>
                      <p className="m-0 mt-3 text-xs leading-6" style={{ color: GOV.textMuted }}>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ background: '#fff', borderTop: `1px solid ${GOV.border}` }}>
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
  );
}
