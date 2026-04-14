import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import { useToast } from '../../components/ui/StatusIndicators';
import { counselorService } from '../../services/counselorService';

const CounselorImportPanel = ({ isAdmin, institutions = [], onImportComplete }) => {
  const { toast, showToast, Toast: ToastComp } = useToast();
  const [csvText, setCsvText] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importInstitutionId, setImportInstitutionId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result || '');
    reader.readAsText(file);
    setImportResult(null);
    setImportError(null);
  };

  const handleImport = async () => {
    if (!csvText.trim()) { setImportError('Please select a CSV file.'); return; }
    if (isAdmin && !importInstitutionId) { setImportError('Please select an institution.'); return; }
    setIsSaving(true);
    setImportError(null);
    setImportResult(null);
    try {
      const report = await counselorService.importStudents(csvText, isAdmin ? importInstitutionId : '');
      setImportResult(report);
      setCsvText('');
      setImportFile(null);
      onImportComplete?.();
      showToast(`Imported ${report.importedCount} students`);
    } catch (err) {
      setImportError(err.response?.data?.message || 'Import failed. Check your CSV format.');
    } finally { setIsSaving(false); }
  };

  return (
    <>
      <ToastComp toast={toast} />
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-md border p-6" style={{ borderColor: GOV.border }}>
          <h3 className={`${TYPO.sectionTitle} mb-4`} style={{ color: GOV.text }}>Import Students via CSV</h3>

          <div className="mb-4 p-3 rounded-lg text-xs space-y-1" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.textMuted }}>
            <p className="font-semibold">CSV columns (header row required):</p>
            <code className="font-mono block">student_number, first_name, last_name, national_id, grade, class, gender, email</code>
            <p className="text-[11px]">• <strong>national_id</strong> (PIN): 13-digit national ID number — <strong>required for each student</strong></p>
            <p className="text-[11px]">• System auto-generates a unique <strong>Login Number</strong> (e.g., SDS123456) for each student</p>
            <p className="text-[11px]">• Passwords are auto-generated securely and are never shown in the UI/API</p>
          </div>

          {isAdmin && (
            <div className="mb-4">
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Target Institution *</label>
              <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={importInstitutionId} onChange={e => setImportInstitutionId(e.target.value)}>
                <option value="">— Select institution —</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className={`block ${TYPO.label} mb-2`} style={{ color: GOV.text }}>Select CSV File</label>
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:text-white file:bg-blue-600" />
            {importFile && <p className="mt-1 text-xs" style={{ color: GOV.textMuted }}>Selected: {importFile.name}</p>}
          </div>

          {importError && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              {importError}
            </div>
          )}

          <button type="button" onClick={handleImport} disabled={isSaving || !csvText.trim()} className="w-full text-white py-2 rounded-md text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: GOV.blue }}>
            <Upload className="w-4 h-4" />
            {isSaving ? 'Importing…' : 'Import Students'}
          </button>
        </div>

        {importResult && importResult.importedCount > 0 && (
          <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Import Successful — {importResult.importedCount} students</h3>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs">
                <thead style={{ backgroundColor: GOV.blueLightAlt, color: GOV.textMuted }}>
                  <tr>
                    <th className="px-4 py-2 uppercase">Name</th>
                    <th className="px-4 py-2 uppercase">Login Number</th>
                    <th className="px-4 py-2 uppercase">Grade</th>
                    <th className="px-4 py-2 uppercase">Class</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.students.map((c, idx) => (
                    <tr key={idx} className="border-b" style={{ borderColor: GOV.borderLight }}>
                      <td className="px-4 py-2" style={{ color: GOV.text }}>{`${c.firstName || ''} ${c.lastName || ''}`.trim() || '–'}</td>
                      <td className="px-4 py-2 font-mono font-semibold" style={{ color: GOV.blue }}>{c.studentCode || '–'}</td>
                      <td className="px-4 py-2" style={{ color: GOV.textMuted }}>{c.grade || '–'}</td>
                      <td className="px-4 py-2" style={{ color: GOV.textMuted }}>{c.className || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CounselorImportPanel;
