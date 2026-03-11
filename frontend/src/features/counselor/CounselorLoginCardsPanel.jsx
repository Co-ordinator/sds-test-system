import React, { useState } from 'react';
import { Printer, Filter } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import { useToast } from '../../components/ui/StatusIndicators';
import { counselorService } from '../../services/counselorService';

const CounselorLoginCardsPanel = ({ isAdmin, institutions = [], userInstitutionId = '' }) => {
  const { toast, showToast, Toast: ToastComp } = useToast();
  const [cardInstitutionId, setCardInstitutionId] = useState('');
  const [cardGrade, setCardGrade] = useState('');
  const [generatingCards, setGeneratingCards] = useState(false);

  const handleGenerateLoginCards = async () => {
    const instId = isAdmin ? cardInstitutionId : userInstitutionId;
    if (isAdmin && !instId) { showToast('Please select an institution', 'error'); return; }
    setGeneratingCards(true);
    try {
      await counselorService.generateLoginCards(instId, cardGrade);
      showToast('Login cards PDF downloaded');
    } catch (err) {
      const msg = err.response?.status === 404
        ? 'No students found for these criteria.'
        : err.response?.data?.message || 'Failed to generate login cards.';
      showToast(msg, 'error');
    } finally { setGeneratingCards(false); }
  };

  return (
    <>
      <ToastComp toast={toast} />
      <div className="max-w-xl space-y-6">
        <div className="bg-white rounded-md border p-6" style={{ borderColor: GOV.border }}>
          <h3 className={`${TYPO.sectionTitle} mb-1`} style={{ color: GOV.text }}>Generate Login Cards</h3>
          <p className="text-xs mb-5" style={{ color: GOV.textMuted }}>
            Generate a printable PDF of student login cards. Cards show the student's name, username, and instructions for the career test.
          </p>

          {isAdmin && (
            <div className="mb-4">
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Institution *</label>
              <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={cardInstitutionId} onChange={e => setCardInstitutionId(e.target.value)}>
                <option value="">— Select institution —</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          )}

          <div className="mb-5">
            <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
              <Filter className="w-3 h-3 inline mr-1" /> Filter by Grade / Class (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Form5 or 11A"
              className="form-control"
              style={{ borderBottomColor: GOV.border, color: GOV.text }}
              value={cardGrade}
              onChange={e => setCardGrade(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: GOV.textHint }}>Leave blank to generate cards for ALL students in the institution.</p>
          </div>

          <button
            type="button"
            onClick={handleGenerateLoginCards}
            disabled={generatingCards}
            className="w-full text-white py-2.5 rounded-md text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: GOV.blue }}
          >
            {generatingCards
              ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating…</>
              : <><Printer className="w-4 h-4" /> Generate &amp; Download Login Cards PDF</>}
          </button>
        </div>

        {/* Card preview */}
        <div className="bg-white rounded-md border p-5" style={{ borderColor: GOV.border }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: GOV.text }}>Login Card Preview</h4>
          <div className="border-2 rounded-xl p-4 max-w-xs" style={{ borderColor: GOV.blue }}>
            <div className="text-center rounded-lg py-2 mb-3" style={{ backgroundColor: GOV.blue }}>
              <p className="text-white text-xs font-bold">ESWATINI CAREER GUIDANCE SYSTEM</p>
              <p className="text-[10px]" style={{ color: '#c7d2fe' }}>careers.gov.sz</p>
            </div>
            <p className="font-semibold text-sm" style={{ color: GOV.text }}>Student Name: Sipho Dlamini</p>
            <p className="text-xs mb-2" style={{ color: GOV.textMuted }}>Form 5 · Class A</p>
            <hr className="mb-2" style={{ borderColor: GOV.border }} />
            <p className="text-xs font-bold mb-1" style={{ color: GOV.text }}>LOGIN DETAILS</p>
            <p className="text-xs font-mono" style={{ color: GOV.text }}>Username: 2026001</p>
            <p className="text-xs" style={{ color: GOV.textMuted }}>Website: careers.gov.sz</p>
            <div className="mt-2 space-y-0.5">
              {['1. Go to website and click Login', '2. Enter your username', '3. Complete the Career Test', '4. Download your Career Report'].map((s, i) => (
                <p key={i} className="text-[10px]" style={{ color: GOV.textHint }}>{s}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CounselorLoginCardsPanel;
