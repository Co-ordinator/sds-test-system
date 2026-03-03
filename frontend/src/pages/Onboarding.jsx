import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { useRef, useEffect } from 'react';
import { MapPin, Info, Globe, User, Building2, Pencil, Check, Search } from 'lucide-react';
import { GOV, TYPO } from '../theme/government';

const GENDERS = ['Male', 'Female'];
const LANGUAGES = ['English', 'SiSwati'];
const GRADES = [
  'Form 3 (Junior Secondary)',
  'Form 5 / O-Level (Senior Secondary)',
  'A-Level',
  'Certificate / Diploma',
  'Bachelor’s degree',
  'Postgraduate',
];

const ESWATINI_REGIONS = ['Hhohho', 'Manzini', 'Lubombo', 'Shiselweni'];
const ESWATINI_TOWNS = [
  'Big Bend',
  'Bhunya',
  'Bulembu',
  'Ezulwini',
  'Hlatikulu',
  'Hluti',
  'Kubuta',
  'Kwaluseni',
  'Lavumisa',
  'Lobamba',
  'Malkerns',
  'Mankayane',
  'Manzini',
  'Matsapha',
  'Mbabane',
  'Mhlambanyatsi',
  'Mhlume',
  'Mondi',
  'Mpaka',
  'Ngwenya',
  'Ngomane',
  'Nhlangano',
  'Nsoko',
  'Piggs Peak',
  'Sidvokodvo',
  'Simunye',
  'Siteki',
  'Tabankulu',
  'Tjaneni',
  'Vuvulane',
  'Other',
];
const ESWATINI_INSTITUTIONS = [
  'University of Eswatini (UNESWA)',
  'Southern Africa Nazarene University (SANU)',
  'Limkokwing University of Creative Technology',
  'Eswatini College of Technology',
  'William Pitcher College',
  'Ngwane Teacher Training College',
  'Other',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);
  const [townQuery, setTownQuery] = useState('');
  const [townDropdownOpen, setTownDropdownOpen] = useState(false);
  const townDropdownRef = useRef(null);

  const [form, setForm] = useState({
    fullName: '',
    gender: '',
    region: 'Hhohho',
    townCity: '',
    areaNeighborhood: '',
    schoolUniversity: '',
    preferredLanguage: 'English',
    highestGrade: 'Form 5 / O-Level (Senior Secondary)',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const filteredSchools = ESWATINI_INSTITUTIONS.filter((inst) =>
    inst.toLowerCase().includes(schoolQuery.toLowerCase())
  );
  const filteredTowns = ESWATINI_TOWNS.filter((t) =>
    t.toLowerCase().includes(townQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(e.target)) {
        setSchoolDropdownOpen(false);
      }
      if (townDropdownRef.current && !townDropdownRef.current.contains(e.target)) {
        setTownDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigate('/');
  };

  const handleContinue = () => {
    if (step < 4) setStep((s) => s + 1);
    else navigate('/dashboard');
  };

  const goToStep = (s) => setStep(s);

  return (
    <OnboardingLayout>
      {/* Step 1: Tell us about yourself */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              Tell us about yourself
            </h1>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              We need a few basic details to set up your profile for the career assessment.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                Full Legal Name
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="e.g. Thabo Dlamini"
                className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                style={{ borderColor: GOV.border, color: GOV.text }}
              />
              <p className={`mt-1 flex items-center gap-1.5 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ borderColor: GOV.textHint, color: GOV.textHint }}>i</span>
                Use the name exactly as it appears on your national ID.
              </p>
            </div>

            <div>
              <label className={`block ${TYPO.label} mb-1.5`} style={{ color: GOV.text }}>
                Gender Identity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update('gender', g)}
                    className={`py-2.5 px-3 rounded-md border ${TYPO.bodySmall} font-medium transition-colors`}
                    style={{
                      borderColor: form.gender === g ? GOV.blue : GOV.border,
                      backgroundColor: form.gender === g ? GOV.blueLight : '#fff',
                      color: GOV.text,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
              Your information is secure and used only by the Ministry for the SDS career assessment in Eswatini.
            </p>
            <p className={TYPO.hint}>
              Need help? <a href="#" className="font-medium hover:underline" style={{ color: GOV.blue }}>Contact Support</a>
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className={`px-4 py-2.5 rounded-md border font-medium ${TYPO.bodySmall}`}
                style={{ borderColor: GOV.border, color: GOV.text, backgroundColor: '#fff' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white`}
                style={{ backgroundColor: GOV.blue }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Tell us where you study */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              Tell us where you study
            </h1>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              Provide your region and educational institution in Eswatini for the career assessment.
            </p>
          </div>

          <div className="rounded-lg border overflow-hidden bg-white" style={{ borderColor: GOV.borderLight }}>
            <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: GOV.borderLight }}>
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: GOV.blue }} />
              <span className={`${TYPO.caption} font-semibold`} style={{ color: GOV.text }}>
                Location &amp; Institution
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Region *</label>
                <select
                  value={form.region}
                  onChange={(e) => update('region', e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                  style={{ borderColor: GOV.border, color: GOV.text }}
                >
                  {ESWATINI_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="relative" ref={townDropdownRef}>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Town / City *</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: GOV.textHint }} aria-hidden />
                  <input
                    type="text"
                    value={townDropdownOpen ? townQuery : form.townCity}
                    onChange={(e) => {
                      setTownQuery(e.target.value);
                      setTownDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setTownQuery(form.townCity);
                      setTownDropdownOpen(true);
                    }}
                    placeholder="Search or select town..."
                    className={`w-full pl-8 pr-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                    style={{ borderColor: GOV.border, color: GOV.text }}
                    autoComplete="off"
                  />
                </div>
                {townDropdownOpen && (
                  <ul
                    className="absolute z-10 left-0 right-0 mt-0.5 py-0.5 rounded-md border overflow-auto max-h-40 bg-white"
                    style={{ borderColor: GOV.border }}
                  >
                    {filteredTowns.length > 0 ? (
                      filteredTowns.map((t) => (
                        <li key={t}>
                          <button
                            type="button"
                            className={`w-full text-left px-3 py-1.5 ${TYPO.bodySmall} hover:bg-gray-100 transition-colors`}
                            style={{ color: GOV.text }}
                            onClick={() => {
                              update('townCity', t);
                              setTownQuery(t);
                              setTownDropdownOpen(false);
                            }}
                          >
                            {t}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className={`px-3 py-2 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                        No town found. Type to search.
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Area / Neighborhood</label>
                <input
                  type="text"
                  value={form.areaNeighborhood}
                  onChange={(e) => update('areaNeighborhood', e.target.value)}
                  placeholder="e.g. Msunduza, Fonteyn"
                  className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                  style={{ borderColor: GOV.border, color: GOV.text }}
                />
              </div>
              <div className="sm:col-span-2 relative" ref={schoolDropdownRef}>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current School / University *</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: GOV.textHint }} aria-hidden />
                  <input
                    type="text"
                    value={schoolDropdownOpen ? schoolQuery : form.schoolUniversity}
                    onChange={(e) => {
                      setSchoolQuery(e.target.value);
                      setSchoolDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setSchoolQuery(form.schoolUniversity);
                      setSchoolDropdownOpen(true);
                    }}
                    placeholder="Search or select school..."
                    className={`w-full pl-8 pr-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                    style={{ borderColor: GOV.border, color: GOV.text }}
                    autoComplete="off"
                  />
                </div>
                {schoolDropdownOpen && (
                  <ul
                    className="absolute z-10 left-0 right-0 mt-0.5 py-0.5 rounded-md border overflow-auto max-h-40 bg-white"
                    style={{ borderColor: GOV.border }}
                  >
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((inst) => (
                        <li key={inst}>
                          <button
                            type="button"
                            className={`w-full text-left px-3 py-1.5 ${TYPO.bodySmall} hover:bg-gray-100 transition-colors`}
                            style={{ color: GOV.text }}
                            onClick={() => {
                              update('schoolUniversity', inst);
                              setSchoolQuery(inst);
                              setSchoolDropdownOpen(false);
                            }}
                          >
                            {inst}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className={`px-3 py-2 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                        No school found. Type to search.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="rounded-md border p-3 flex gap-2.5" style={{ backgroundColor: GOV.blueLightAlt, borderColor: GOV.blueLight }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOV.blue }}>
                  <Info className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className={`font-semibold ${TYPO.hint} mb-0.5`} style={{ color: GOV.text }}>Why do we need this?</p>
                  <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
                    Your region and institution help the Ministry tailor career guidance and SDS reporting.
                  </p>
                </div>
              </div>
              <p className={`mt-2 flex items-center gap-1.5 ${TYPO.hint}`} style={{ color: GOV.textMuted }}>
                <span className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: GOV.border }}>
                  <Check className="w-2.5 h-2.5" style={{ color: GOV.blue }} />
                </span>
                Your data is stored securely by the Ministry in Eswatini.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className={`px-4 py-2.5 rounded-md border font-medium ${TYPO.bodySmall}`}
              style={{ borderColor: GOV.border, color: GOV.text, backgroundColor: '#fff' }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white`}
              style={{ backgroundColor: GOV.blue }}
            >
              Continue &gt;
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Academic & Language only */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              Academic &amp; Language
            </h1>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              Final details to tailor your career assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Preferred Language</label>
              <select
                value={form.preferredLanguage}
                onChange={(e) => update('preferredLanguage', e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                style={{ borderColor: GOV.border, color: GOV.text }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textHint }}>Default interface language.</p>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Current/Highest Grade Passed</label>
              <select
                value={form.highestGrade}
                onChange={(e) => update('highestGrade', e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                style={{ borderColor: GOV.border, color: GOV.text }}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textHint }}>Used for career recommendations.</p>
            </div>
          </div>

          <div className="rounded-md border p-3 flex gap-2.5" style={{ backgroundColor: GOV.blueLightAlt, borderColor: GOV.borderLight }}>
            <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: GOV.blue }} />
            <div>
              <p className={`font-semibold ${TYPO.hint} mb-0.5`} style={{ color: GOV.text }}>Language &amp; grade</p>
              <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
                You can change these later in account settings.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className={`px-4 py-2.5 rounded-md border font-medium ${TYPO.bodySmall}`}
              style={{ borderColor: GOV.border, color: GOV.text, backgroundColor: '#fff' }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className={`px-4 py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white`}
              style={{ backgroundColor: GOV.blue }}
            >
              Continue &gt;
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary Review only – table-like, clean, white, flat */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              Review Your Profile
            </h1>
            <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
              Ensure all details are correct before submitting.
            </p>
          </div>

          <div className="bg-white border rounded-md overflow-hidden" style={{ borderColor: GOV.border }}>
            <div className="border-b" style={{ borderColor: GOV.border }}>
              <div className="flex items-center justify-between px-4 py-2.5 bg-white" style={{ borderColor: GOV.border }}>
                <h2 className={TYPO.label} style={{ color: GOV.text }}>Personal Details</h2>
                <button type="button" onClick={() => goToStep(1)} className={`${TYPO.bodySmall} font-medium hover:underline`} style={{ color: GOV.blue }}>
                  Edit
                </button>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} w-1/3`} style={{ color: GOV.textHint }}>Full name</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.fullName || '—'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Gender</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.gender || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-b" style={{ borderColor: GOV.border }}>
              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <h2 className={TYPO.label} style={{ color: GOV.text }}>Location &amp; Institution</h2>
                <button type="button" onClick={() => goToStep(2)} className={`${TYPO.hint} font-medium hover:underline`} style={{ color: GOV.blue }}>
                  Edit
                </button>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} w-1/3`} style={{ color: GOV.textHint }}>Region</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.region || '—'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Town / City</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.townCity || '—'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>School / University</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.schoolUniversity || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-white" style={{ borderColor: GOV.border }}>
                <h2 className={TYPO.label} style={{ color: GOV.text }}>Academic</h2>
                <button type="button" onClick={() => goToStep(3)} className={`${TYPO.hint} font-medium hover:underline`} style={{ color: GOV.blue }}>
                  Edit
                </button>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} w-1/3`} style={{ color: GOV.textHint }}>Preferred language</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.preferredLanguage || '—'}</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: GOV.border }}>
                    <td className={`px-4 py-2 ${TYPO.bodySmall}`} style={{ color: GOV.textHint }}>Highest grade passed</td>
                    <td className={`px-4 py-2 ${TYPO.bodySmall} font-medium`} style={{ color: GOV.text }}>{form.highestGrade || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className={TYPO.hint} style={{ color: GOV.textHint }}>
            By submitting, you agree to the Ministry&apos;s data use policy.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className={`px-5 py-2.5 rounded-lg border font-medium ${TYPO.bodySmall}`}
              style={{ borderColor: GOV.border, color: GOV.text, backgroundColor: '#fff' }}
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className={`px-5 py-2.5 rounded-lg font-medium ${TYPO.bodySmall} text-white`}
              style={{ backgroundColor: GOV.blue }}
            >
              Submit &amp; Complete Profile
            </button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
