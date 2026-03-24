import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  User, 
  FileText, 
  Award, 
  Settings, 
  Mail, 
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Briefcase,
  Shield,
  Lock,
  Eye,
  Download,
  Upload,
  Search,
  ChevronRight,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { GOV, TYPO, MINISTRY_NAME, KINGDOM } from '../theme/government';

export default function Help() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Government bar – Ministry branding */}
      <div
        className="flex-shrink-0 px-6 py-1.5 border-b text-center"
        style={{ borderColor: GOV.border, backgroundColor: GOV.blueLightAlt }}
      >
        <p className={TYPO.ministryBanner} style={{ color: GOV.blue }}>
          {MINISTRY_NAME} · {KINGDOM}
        </p>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white" style={{ borderColor: GOV.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-sm font-medium" style={{ color: GOV.textMuted }}>
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" style={{ color: GOV.blue }} />
              <h1 className="text-lg font-semibold" style={{ color: GOV.text }}>Help Center</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Quick Links */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickLinkCard
                icon={User}
                title="Getting Started"
                description="New user guide and registration"
                to="#getting-started"
              />
              <QuickLinkCard
                icon={FileText}
                title="Assessment Guide"
                description="How to complete the SDS test"
                to="#assessment-guide"
              />
              <QuickLinkCard
                icon={Award}
                title="Results & Careers"
                description="Understanding your results"
                to="#results-careers"
              />
              <QuickLinkCard
                icon={Settings}
                title="Account & Support"
                description="Profile management and help"
                to="#account-support"
              />
            </div>
          </section>

          {/* Getting Started */}
          <section id="getting-started" className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: GOV.blueLight }}>
                <User className="w-5 h-5" style={{ color: GOV.blue }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: GOV.text }}>Getting Started</h2>
            </div>

            <div className="space-y-6">
              <HelpCard
                title="Creating Your Account"
                icon={User}
                content={
                  <div className="space-y-3">
                    <p>To get started with the SDS Test System:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li>Click "Register" on the home page</li>
                      <li>Enter your 13-digit National ID number</li>
                      <li>Provide your email address and create a password</li>
                      <li>Agree to the data processing consent</li>
                      <li>Check your email for verification link</li>
                      <li>Complete your profile during first login</li>
                    </ol>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium" style={{ color: GOV.blue }}>
                        <Shield className="w-4 h-4 inline mr-2" />
                        Your National ID automatically provides your date of birth and gender
                      </p>
                    </div>
                  </div>
                }
              />

              <HelpCard
                title="System Requirements"
                icon={Settings}
                content={
                  <div className="space-y-3">
                    <p>For the best experience:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                      <li>Stable internet connection (2 Mbps or faster)</li>
                      <li>Screen resolution of 1024x768 or higher</li>
                      <li>Javascript and cookies enabled</li>
                      <li>Mobile devices supported (phones and tablets)</li>
                    </ul>
                  </div>
                }
              />
            </div>
          </section>

          {/* Assessment Guide */}
          <section id="assessment-guide" className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: GOV.blueLight }}>
                <FileText className="w-5 h-5" style={{ color: GOV.blue }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: GOV.text }}>Assessment Guide</h2>
            </div>

            <div className="space-y-6">
              <HelpCard
                title="About the SDS Assessment"
                icon={BookOpen}
                content={
                  <div className="space-y-3">
                    <p>The Self-Directed Search (SDS) is based on Holland's RIASEC theory:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RIASECType type="R" title="Realistic" description="Hands-on work with tools, machines, or animals" />
                      <RIASECType type="I" title="Investigative" description="Research, analysis, and problem-solving" />
                      <RIASECType type="A" title="Artistic" description="Creative expression and design" />
                      <RIASECType type="S" title="Social" description="Helping, teaching, and caring for others" />
                      <RIASECType type="E" title="Enterprising" description="Leadership, sales, and business" />
                      <RIASECType type="C" title="Conventional" description="Organization, data, and procedures" />
                    </div>
                  </div>
                }
              />

              <HelpCard
                title="Taking the Assessment"
                icon={Clock}
                content={
                  <div className="space-y-3">
                    <p>The assessment consists of 228 questions across 6 sections:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li><strong>Activities</strong> - What you like to do</li>
                      <li><strong>Competencies</strong> - What you're good at</li>
                      <li><strong>Occupations</strong> - Jobs that interest you</li>
                      <li><strong>Self-Estimates</strong> - How you rate your abilities</li>
                      <li><strong>Two of Your Best</strong> - Your top areas</li>
                      <li><strong>Your Daydreams</strong> - Your ideal scenarios</li>
                    </ol>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Average completion time: 30-45 minutes
                      </p>
                    </div>
                  </div>
                }
              />

              <HelpCard
                title="Answering Questions"
                icon={CheckCircle}
                content={
                  <div className="space-y-3">
                    <p>Tips for answering questions:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li>Answer honestly - there are no right or wrong answers</li>
                      <li>Work at your own pace - you can pause and resume</li>
                      <li>Don't overthink - go with your first instinct</li>
                      <li>Your progress is saved automatically</li>
                      <li>You have 30 days to complete the assessment</li>
                    </ul>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-800">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        You can only take the assessment once every 6 months
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
          </section>

          {/* Results & Careers */}
          <section id="results-careers" className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: GOV.blueLight }}>
                <Award className="w-5 h-5" style={{ color: GOV.blue }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: GOV.text }}>Results & Careers</h2>
            </div>

            <div className="space-y-6">
              <HelpCard
                title="Understanding Your Holland Code"
                icon={GraduationCap}
                content={
                  <div className="space-y-3">
                    <p>Your results include:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li><strong>3-letter Holland Code</strong> (e.g., SIA - Social, Investigative, Artistic)</li>
                      <li><strong>Scores for each type</strong> showing your interests</li>
                      <li><strong>Personality description</strong> based on your code</li>
                      <li><strong>Career recommendations</strong> matching your interests</li>
                    </ul>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-purple-800">
                        <Eye className="w-4 h-4 inline mr-2" />
                        Higher scores indicate stronger interest in that area
                      </p>
                    </div>
                  </div>
                }
              />

              <HelpCard
                title="Career Recommendations"
                icon={Briefcase}
                content={
                  <div className="space-y-3">
                    <p>You'll receive personalized recommendations for:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li><strong>Occupations</strong> that match your Holland Code</li>
                      <li><strong>Educational courses</strong> at local institutions</li>
                      <li><strong>Academic subjects</strong> to focus on</li>
                      <li><strong>Labor market information</strong> for Eswatini</li>
                    </ul>
                    <p className="text-sm" style={{ color: GOV.textMuted }}>
                      All recommendations are tailored to the Eswatini context and include local educational institutions and employment opportunities.
                    </p>
                  </div>
                }
              />

              <HelpCard
                title="Certificate and Reports"
                icon={Download}
                content={
                  <div className="space-y-3">
                    <p>After completing the assessment:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li>Download your official completion certificate</li>
                      <li>View detailed results report</li>
                      <li>Share results with counselors or institutions</li>
                      <li>Access your results anytime in your profile</li>
                    </ul>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium" style={{ color: GOV.blue }}>
                        <Award className="w-4 h-4 inline mr-2" />
                        Certificates include unique verification codes
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
          </section>

          {/* Account & Support */}
          <section id="account-support" className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: GOV.blueLight }}>
                <Settings className="w-5 h-5" style={{ color: GOV.blue }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: GOV.text }}>Account & Support</h2>
            </div>

            <div className="space-y-6">
              <HelpCard
                title="Managing Your Profile"
                icon={User}
                content={
                  <div className="space-y-3">
                    <p>In your profile you can:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li>Update personal information and contact details</li>
                      <li>Add education and work experience</li>
                      <li>Upload qualification documents</li>
                      <li>Change your password</li>
                      <li>Export your personal data</li>
                      <li>Delete your account if needed</li>
                    </ul>
                  </div>
                }
              />

              <HelpCard
                title="Privacy and Security"
                icon={Lock}
                content={
                  <div className="space-y-3">
                    <p>Your data is protected by:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: GOV.textMuted }}>
                      <li>Eswatini Data Protection Act 2022 compliance</li>
                      <li>Secure encryption of all personal data</li>
                      <li>Strict access controls and authentication</li>
                      <li>Regular security audits and monitoring</li>
                      <li>Right to access, correct, or delete your data</li>
                    </ul>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Your information is never shared without your consent
                      </p>
                    </div>
                  </div>
                }
              />

              <HelpCard
                title="Getting Help"
                icon={HelpCircle}
                content={
                  <div className="space-y-3">
                    <p>If you need assistance:</p>
                    <div className="space-y-2">
                      <ContactItem
                        icon={Mail}
                        label="Email Support"
                        value="coordinator@bitsandpc.co.za"
                        description="For technical issues and account help"
                      />
                      <ContactItem
                        icon={Phone}
                        label="Phone Support"
                        value="+268 4041971/2/3"
                        description="Monday-Friday, 8:00 AM - 5:00 PM"
                      />
                      <ContactItem
                        icon={ExternalLink}
                        label="Ministry Website"
                        value="www.labour.gov.sz"
                        description="Official Ministry resources"
                      />
                    </div>
                  </div>
                }
              />
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: GOV.blueLight }}>
                <HelpCircle className="w-5 h-5" style={{ color: GOV.blue }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: GOV.text }}>Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              <FAQItem
                question="How long are my results valid?"
                answer="Your SDS results are valid indefinitely, but we recommend retaking the assessment every 2-3 years or after significant life changes to ensure your career recommendations remain relevant."
              />
              <FAQItem
                question="Can I retake the assessment?"
                answer="You can retake the assessment after 6 months from your last completion date. This waiting period ensures meaningful changes in your interests can be measured."
              />
              <FAQItem
                question="What if I forget my password?"
                answer="Click 'Forgot Password' on the login page. Enter your email address and we'll send you a secure link to reset your password. The link expires after 24 hours."
              />
              <FAQItem
                question="Can I use the system on my phone?"
                answer="Yes! The SDS Test System is fully responsive and works on smartphones, tablets, and desktop computers. All features are available on mobile devices."
              />
              <FAQItem
                question="How are career recommendations selected?"
                answer="Recommendations are based on your Holland Code, local labor market data in Eswatini, and educational opportunities available in the country. We prioritize careers with good employment prospects."
              />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="flex-shrink-0 border-t py-6 px-6 text-center"
        style={{ borderColor: GOV.border }}
      >
        <div className="max-w-4xl mx-auto space-y-2">
          <p className={TYPO.hint} style={{ color: GOV.textHint }}>
            © {new Date().getFullYear()} {KINGDOM}. {MINISTRY_NAME}.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link to="/privacy" className="hover:underline" style={{ color: GOV.textMuted }}>
              Privacy Policy
            </Link>
            <span style={{ color: GOV.textMuted }}>•</span>
            <Link to="/terms" className="hover:underline" style={{ color: GOV.textMuted }}>
              Terms of Service
            </Link>
            <span style={{ color: GOV.textMuted }}>•</span>
            <Link to="/contact" className="hover:underline" style={{ color: GOV.textMuted }}>
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function QuickLinkCard({ icon: Icon, title, description, to }) {
  return (
    <a
      href={to}
      className="block p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-1"
      style={{ borderColor: GOV.border }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOV.blueLight }}>
          <Icon className="w-4 h-4" style={{ color: GOV.blue }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-1" style={{ color: GOV.text }}>{title}</h3>
          <p className="text-xs" style={{ color: GOV.textMuted }}>{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: GOV.textMuted }} />
      </div>
    </a>
  );
}

function HelpCard({ title, icon: Icon, content }) {
  return (
    <div className="bg-white rounded-lg border p-6" style={{ borderColor: GOV.border }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOV.blueLight }}>
          <Icon className="w-5 h-5" style={{ color: GOV.blue }} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-3" style={{ color: GOV.text }}>{title}</h3>
          <div className="text-sm" style={{ color: GOV.textMuted }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

function RIASECType({ type, title, description }) {
  const colors = {
    R: '#ef4444', // Realistic - Red
    I: '#3b82f6', // Investigative - Blue
    A: '#8b5cf6', // Artistic - Purple
    S: '#10b981', // Social - Green
    E: '#f59e0b', // Enterprising - Amber
    C: '#6b7280', // Conventional - Gray
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: GOV.border }}>
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: colors[type] }}
      >
        {type}
      </div>
      <div>
        <h4 className="font-semibold text-sm" style={{ color: GOV.text }}>{title}</h4>
        <p className="text-xs" style={{ color: GOV.textMuted }}>{description}</p>
      </div>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value, description }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: GOV.blue }} />
      <div>
        <p className="font-semibold text-sm" style={{ color: GOV.text }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: GOV.blue }}>{value}</p>
        <p className="text-xs" style={{ color: GOV.textMuted }}>{description}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="bg-white rounded-lg border p-6" style={{ borderColor: GOV.border }}>
      <h3 className="font-semibold text-sm mb-2" style={{ color: GOV.text }}>{question}</h3>
      <p className="text-sm" style={{ color: GOV.textMuted }}>{answer}</p>
    </div>
  );
}
