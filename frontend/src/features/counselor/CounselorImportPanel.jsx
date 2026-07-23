import React, { useRef, useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import { useToast } from '../../components/ui/StatusIndicators';
import { counselorService } from '../../services/counselorService';

const CounselorImportPanel = ({
  isAdmin,
  institutions = [],
  assignedInstitutionName = 'Assigned institution',
  onImportComplete
}) => {
  const { toast, showToast, Toast: ToastComp } = useToast();
  const [csvText, setCsvText] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [institutionId, setInstitutionId] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result || '');
    reader.onerror = () => {
      setCsvText('');
      setImportError('Failed to read CSV file. Please try another file.');
    };
    reader.readAsText(file);
    setImportResult(null);
    setImportError(null);
  };

  const handleImport = async () => {
    if (!csvText.trim()) { setImportError('Please select a CSV file.'); return; }
    setIsSaving(true);
    setImportError(null);
    setImportResult(null);
    try {
      const report = await counselorService.importStudents(csvText, institutionId);
      setImportResult(report);
      setCsvText('');
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onImportComplete?.();
      showToast(`Imported ${report.importedCount} students`);
    } catch (err) {
      setImportError(err.uiMessage || 'Import failed. Check your CSV format.');
    } finally { setIsSaving(false); }
  };

  const downloadTemplate = () => {
    const csvContent = `student_number,first_name,last_name,national_id,grade,class,gender,email,institution
MCHS-G10A-001,Asanda,Dlamini,,Grade 10,10A,female,,"Mbabane Central High School"
MCHS-G10A-002,Yenzokuhle,Dlamini,,Grade 10,10A,female,,"Mbabane Central High School"
MCHS-G10A-003,Skhanyiso,Gama,,Grade 10,10A,female,,"Mbabane Central High School"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ToastComp toast={toast} />
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-md border p-6" style={{ borderColor: GOV.border }}>
          <h3 className={`${TYPO.sectionTitle} mb-4`} style={{ color: GOV.text }}>Import Students via CSV</h3>

          <div className="mb-4 p-3 rounded-lg text-xs space-y-1" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.textMuted }}>
            <p className="font-semibold">CSV columns (header row required):</p>
            <code className="font-mono block">student_number, first_name, last_name, national_id, grade, class, gender, email, institution</code>
            <p className="text-[11px]">· <strong>national_id</strong> (PIN): optional for school login-card imports; leave blank when learner PINs are not available</p>
            <p className="text-[11px]">
              · <strong>institution</strong>: School name - <strong>required for each student</strong>
              {isAdmin ? ' (must match an existing institution)' : ' (must match your assigned institution)'}
            </p>
            <p className="text-[11px]">· System auto-generates a unique <strong>Login Number</strong> (e.g., SDS123456) for each student</p>
            <p className="text-[11px]">· Passwords are auto-generated securely and are never shown in the UI/API</p>
          </div>

          {isAdmin && (
            <div className="mb-4">
              <label className={`block ${TYPO.label} mb-2`} style={{ color: GOV.text }}>Import Scope Institution</label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="form-control w-full text-sm"
                style={{ color: GOV.text }}
              >
                <option value="">Use institution from CSV rows</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>{institution.name}</option>
                ))}
              </select>
              <p className="text-[11px] mt-1" style={{ color: GOV.textHint }}>
                When set, all imported rows must belong to this institution.
              </p>
            </div>
          )}

          {!isAdmin && (
            <div className="mb-4 rounded-md border px-3 py-2" style={{ borderColor: '#bfdbfe', backgroundColor: GOV.blueLightAlt }}>
              <p className={TYPO.label} style={{ color: GOV.text }}>Import institution</p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: GOV.blue }}>{assignedInstitutionName}</p>
              <p className="mt-1 text-[11px]" style={{ color: GOV.textMuted }}>
                Your System Administrator assigned this school. Imported learners cannot be placed in another institution.
              </p>
            </div>
          )}

          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={`block ${TYPO.label}`} style={{ color: GOV.text }}>Select CSV File</label>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-1 text-xs rounded border transition-colors"
                style={{ 
                  borderColor: GOV.border, 
                  color: GOV.textMuted,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = GOV.blueLightAlt;
                  e.currentTarget.style.color = GOV.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = GOV.textMuted;
                }}
              >
                <Download className="w-3 h-3" />
                Download Template
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:text-white file:bg-blue-600" />
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
                  {(Array.isArray(importResult.students) ? importResult.students : []).map((c, idx) => (
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
