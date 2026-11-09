import React, { useState, useRef } from 'react';
import { X, Upload, Download, CheckCircle2, AlertCircle, Sparkles, FileText, Check } from 'lucide-react';
import { Company, RegistrationStatus } from '../types';
import { parseCsvCompanyImport } from '../utils/rules';
import { createDefaultCompanyChecklist } from '../data/masterChecklist';
import { calculateIntelligenceScore } from '../utils/rules';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCompanies: Company[];
  onImportSuccess: (newCompanies: Company[], mode: 'merge' | 'append') => void;
}

export const SAMPLE_CSV = `Client Company Name,Industry,Company Type,Website,Main Telephone,Procurement Email,Procurement Manager,Registration Portal,Priority,Registration Status,Assigned Officer,Notes
John Keells Holdings PLC,Conglomerate & Real Estate,PLC,https://www.keells.com,+94112306000,procurement@keells.com,Sunil Mendis,https://supplier.keells.com,High,Identified,Ranil Jayasuriya,Cinnamon Life and City facade works
Access Engineering PLC,Civil Engineering & Construction,PLC,https://access.lk,+94117606600,vendor.reg@access.lk,Dharshana Gamage,https://access.lk/suppliers,High,Requirements Received,Kasun Wickrama,Steel structure prequalification
Brandix Apparel Limited,Apparel Manufacturing & Infrastructure,Pvt Ltd,https://brandix.com,+94114727000,purchase@brandix.com,Mahen Perera,,High,Contacted,Ranil Jayasuriya,Industrial plant louvres and doors
CHEC Port City Colombo (Pvt) Ltd,Mega Urban Development,Pvt Ltd,https://portcitycolombo.lk,+94112440000,procure@portcitycolombo.lk,Zhang Wei,https://portal.portcitycolombo.lk,High,Identified,Kasun Wickrama,Marina commercial facade packages
MAGA Engineering (Pvt) Ltd,Major Building Contractor,Pvt Ltd,https://maga.lk,+94112808835,procurement@maga.lk,Nalaka Wijesinghe,,High,Contacted,Ranil Jayasuriya,High-rise curtain wall subcontractor
`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingCompanies,
  onImportSuccess,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'append'>('merge');
  const [defaultBatchStatus, setDefaultBatchStatus] = useState<RegistrationStatus>('Identified');
  const [defaultOfficer, setDefaultOfficer] = useState('Ranil Jayasuriya');
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseCsvCompanyImport> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setCsvContent(text);
    if (text.trim().length > 0) {
      setParsedData(parseCsvCompanyImport(text));
    } else {
      setParsedData(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      handleTextChange((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      handleTextChange((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'innovista_client_bulk_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSampleBatch = () => {
    handleTextChange(SAMPLE_CSV);
  };

  const handleExecuteImport = () => {
    if (!parsedData || parsedData.validRecords.length === 0) return;

    const createdCompanies: Company[] = parsedData.validRecords.map((r, index) => {
      const existing = existingCompanies.find(
        (c) => c.name.toLowerCase().trim() === r.name.toLowerCase().trim()
      );

      const assignedOfficer = r.assignedOfficer && r.assignedOfficer !== 'BD Team' ? r.assignedOfficer : defaultOfficer;
      const registrationStatus = r.registrationStatus && r.registrationStatus !== 'Identified' ? r.registrationStatus : defaultBatchStatus;

      const intelligenceFactors = {
        businessOpportunity: 85,
        companySuitability: 80,
        registrationAccessibility: 75,
        potentialProjectValue: 85,
        relationshipAccessibility: 70,
        registrationCostEffort: 75,
      };
      const score = calculateIntelligenceScore(intelligenceFactors);

      if (existing && importMode === 'merge') {
        return {
          ...existing,
          industry: r.industry || existing.industry,
          companyType: r.companyType || existing.companyType,
          website: r.website || existing.website,
          mainTelephone: r.mainTelephone || existing.mainTelephone,
          procurementEmail: r.procurementEmail || existing.procurementEmail,
          procurementContact: r.procurementContact || existing.procurementContact,
          registrationPortal: r.registrationPortal || existing.registrationPortal,
          priority: r.priority || existing.priority,
          registrationStatus: registrationStatus || existing.registrationStatus,
          assignedOfficer: assignedOfficer || existing.assignedOfficer,
          notes: r.notes || existing.notes,
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        id: 'client-bulk-' + Date.now() + '-' + index,
        name: r.name,
        industry: r.industry || 'Corporate Client',
        companyType: r.companyType || 'PLC',
        website: r.website,
        headOfficeAddress: 'Colombo, Sri Lanka',
        mainTelephone: r.mainTelephone,
        procurementEmail: r.procurementEmail,
        procurementContact: r.procurementContact || 'Procurement Department',
        registrationPortal: r.registrationPortal,
        priority: r.priority || 'High',
        registrationStatus: registrationStatus,
        assignedOfficer: assignedOfficer,
        notes: r.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextFollowUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        intelligence: {
          ...intelligenceFactors,
          totalScore: score.totalScore,
          tier: score.tier,
          justificationNotes: 'Bulk imported client corporation for vendor prequalification.',
        },
        contacts: [
          {
            id: 'c-bulk-' + Date.now() + '-' + index,
            name: r.procurementContact || 'Procurement Manager',
            designation: 'Procurement / Prequalification Officer',
            department: 'Procurement',
            email: r.procurementEmail,
            phone: r.mainTelephone,
            isPrimary: true,
          },
        ],
        checklist: createDefaultCompanyChecklist(assignedOfficer),
        documents: [],
        communicationLogs: [],
        submission: {
          channel: 'Online Vendor Portal',
          confirmationReceived: false,
        },
        approval: {
          approvedCategories: ['Architectural Aluminium Fabrication', 'Curtain Wall Facades', 'Glass & Metal Works'],
          renewalReminderDays: 30,
          status: registrationStatus === 'Approved' ? 'Approved' : 'Pending',
          approvalDate: registrationStatus === 'Approved' ? new Date().toISOString().slice(0, 10) : undefined,
        },
        evaluation: {
          overallRating: 3,
          responsiveness: 'Moderate',
          communicationQuality: 'Good',
          opportunityAccess: 'Project based',
          registrationDurationDays: 0,
          lessonsLearned: '',
        },
        opportunities: [],
      };
    });

    onImportSuccess(createdCompanies, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900">
            Import
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Quick Action Strip */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#f8faff] hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 transition-all text-xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#0e3aa9]" />
              <span>File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </button>

            <button
              onClick={handleDownloadSample}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Template</span>
            </button>

            <button
              onClick={handleLoadSampleBatch}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-[#0e3aa9] transition-all text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0e3aa9]" />
              <span>Sample</span>
            </button>
          </div>

          {/* Drag & Drop / Direct Paste Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-3 transition-colors ${
              isDragging ? 'border-[#0e3aa9] bg-blue-50/50' : 'border-slate-200 bg-[#f8faff]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 px-1 font-medium">
              <span>Paste comma-separated or tab-separated client rows below:</span>
              <span>Drag & drop file anywhere here</span>
            </div>
            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Client Company Name,Industry,Company Type,Website,Main Telephone,Procurement Email,Procurement Manager,Registration Portal,Priority,Registration Status,Assigned Officer,Notes\nJohn Keells Holdings,Conglomerate,PLC,https://keells.com,+94112306000,procurement@keells.com,Sunil Mendis,https://supplier.keells.com,High,Identified,Ranil Jayasuriya,Key facade projects`}
              className="w-full p-3 font-mono text-[11px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#0e3aa9] focus:ring-1 focus:ring-[#0e3aa9] shadow-inner leading-relaxed"
            />
          </div>

          {/* Batch Configuration Settings */}
          <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-3 grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={defaultBatchStatus}
                onChange={(e) => setDefaultBatchStatus(e.target.value as RegistrationStatus)}
                className="w-full py-1.5 px-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs font-medium"
              >
                <option value="Identified">Identified</option>
                <option value="Contacted">Contacted</option>
                <option value="Requirements Received">Requirements</option>
                <option value="Documents In Preparation">Preparation</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Officer
              </label>
              <select
                value={defaultOfficer}
                onChange={(e) => setDefaultOfficer(e.target.value)}
                className="w-full py-1.5 px-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs font-medium"
              >
                <option value="Ranil Jayasuriya">Ranil</option>
                <option value="Kasun Wickrama">Kasun</option>
                <option value="BD Team">General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mode
              </label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as any)}
                className="w-full py-1.5 px-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs font-medium"
              >
                <option value="merge">Update</option>
                <option value="append">Append</option>
              </select>
            </div>
          </div>

          {/* Validation & Preview Strip */}
          {parsedData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs">
                <span className="text-emerald-700 font-bold">{parsedData.validRecords.length} Valid</span>
                <span className="text-slate-300">|</span>
                <span className="text-amber-700">{parsedData.warnings.length} Warnings</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-700">{parsedData.errors.length} Errors</span>
              </div>

              {/* Mini Preview Table */}
              {parsedData.validRecords.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#f8faff] text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-1 px-2.5">Client</th>
                        <th className="py-1 px-2.5">Industry</th>
                        <th className="py-1 px-2.5">Contact</th>
                        <th className="py-1 px-2.5">Email</th>
                        <th className="py-1 px-2.5">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.validRecords.slice(0, 5).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1 px-2.5 font-bold text-slate-900">{r.name}</td>
                          <td className="py-1 px-2.5 text-slate-600 truncate max-w-[120px]">{r.industry}</td>
                          <td className="py-1 px-2.5 text-slate-600 truncate max-w-[120px]">{r.procurementContact}</td>
                          <td className="py-1 px-2.5 font-mono text-slate-500 truncate max-w-[140px]">{r.procurementEmail || '—'}</td>
                          <td className="py-1 px-2.5 font-semibold text-rose-700">{r.priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-[#f8faff] flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            {parsedData?.validRecords.length ? `${parsedData.validRecords.length} records` : ''}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!parsedData || parsedData.validRecords.length === 0}
              onClick={handleExecuteImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl disabled:opacity-40 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Import {parsedData?.validRecords.length ? `(${parsedData.validRecords.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
