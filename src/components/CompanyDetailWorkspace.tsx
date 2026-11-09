import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  Sliders,
  Users,
  ShieldCheck,
  Send,
  Award,
  Briefcase,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  FileCheck,
  Trophy,
  Clock,
} from 'lucide-react';
import {
  Company,
  ChecklistItem,
  ChecklistItemStatus,
  CompanyContact,
  CompanyDocument,
  CommunicationLog,
  ProcurementOpportunity,
  RegistrationPhaseKey,
  RegistrationStatus,
} from '../types';
import { REGISTRATION_PHASES } from '../data/masterChecklist';
import {
  calculateCompanyChecklistProgress,
  calculateIntelligenceScore,
  formatScheduleCountdown,
} from '../utils/rules';

interface CompanyDetailWorkspaceProps {
  company: Company;
  onUpdateCompany: (updated: Company) => void;
  onBack: () => void;
  onOpenNotificationModal: (companyId: string) => void;
  onOpenWinModal?: (company: Company) => void;
  onOpenScheduleModal?: (company: Company) => void;
  industryTypes?: string[];
}

export const CompanyDetailWorkspace: React.FC<CompanyDetailWorkspaceProps> = ({
  company,
  onUpdateCompany,
  onBack,
  onOpenNotificationModal,
  onOpenWinModal,
  onOpenScheduleModal,
  industryTypes = [],
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'checklist'
    | 'intelligence'
    | 'profile'
    | 'documents'
    | 'comms'
    | 'submission'
    | 'approval'
    | 'rfqs'
  >('checklist');

  const [selectedPhase, setSelectedPhase] = useState<RegistrationPhaseKey | 'ALL'>('ALL');
  const [checklistSearch, setChecklistSearch] = useState('');
  const [checklistStatusFilter, setChecklistStatusFilter] = useState<string>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // New communication log state
  const [isLoggingComms, setIsLoggingComms] = useState(false);
  const [newLog, setNewLog] = useState<{
    type: CommunicationLog['type'];
    contactPerson: string;
    summary: string;
    outcome: string;
    nextFollowUpDate: string;
  }>({
    type: 'Call',
    contactPerson: company.procurementContact || '',
    summary: '',
    outcome: '',
    nextFollowUpDate: '',
  });

  // New RFQ opportunity state
  const [isAddingRfq, setIsAddingRfq] = useState(false);
  const [newRfq, setNewRfq] = useState<{
    title: string;
    category: string;
    estimatedValue: number;
    rfqDate: string;
    deadline: string;
    status: ProcurementOpportunity['status'];
    referenceNo: string;
  }>({
    title: '',
    category: 'Aluminium Fabrication',
    estimatedValue: 5000000,
    rfqDate: new Date().toISOString().slice(0, 10),
    deadline: '',
    status: 'Identified',
    referenceNo: '',
  });

  // New contact state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<{
    name: string;
    designation: string;
    department: CompanyContact['department'];
    email: string;
    phone: string;
  }>({
    name: '',
    designation: '',
    department: 'Procurement',
    email: '',
    phone: '',
  });

  const progressSummary = calculateCompanyChecklistProgress(company.checklist);

  const statusColors: Record<RegistrationStatus, string> = {
    Identified: 'bg-slate-100 text-slate-800',
    Contacted: 'bg-sky-50 text-sky-800',
    'Requirements Received': 'bg-amber-50 text-amber-800',
    'Documents In Preparation': 'bg-indigo-50 text-indigo-800',
    Submitted: 'bg-blue-50 text-blue-800',
    'Under Evaluation': 'bg-purple-50 text-purple-800',
    Approved: 'bg-emerald-50 text-emerald-800',
    'Conditionally Approved': 'bg-teal-50 text-teal-800',
    Rejected: 'bg-rose-50 text-rose-800',
    'On Hold': 'bg-slate-100 text-slate-600',
  };

  const handleUpdateChecklistItemStatus = (
    itemId: string,
    newStatus: ChecklistItemStatus
  ) => {
    const updatedChecklist = company.checklist.map((item) => {
      if (item.id === itemId) {
        const isNowCompleted = newStatus === 'completed';
        const nowStr = new Date().toISOString();
        return {
          ...item,
          status: newStatus,
          completionDate: isNowCompleted ? nowStr.slice(0, 10) : item.completionDate,
          activityHistory: [
            ...(item.activityHistory || []),
            {
              timestamp: nowStr,
              action: `Status: ${newStatus}`,
              user: company.assignedOfficer || 'User',
            },
          ],
        };
      }
      return item;
    });

    onUpdateCompany({
      ...company,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateChecklistItemDetails = (
    itemId: string,
    field: keyof ChecklistItem,
    value: any
  ) => {
    const updatedChecklist = company.checklist.map((item) => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });

    onUpdateCompany({
      ...company,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleBulkCompletePhase = (phaseKey: RegistrationPhaseKey) => {
    const updatedChecklist = company.checklist.map((item) => {
      if (item.phase === phaseKey && item.status !== 'not_applicable') {
        return {
          ...item,
          status: 'completed' as ChecklistItemStatus,
          completionDate: new Date().toISOString().slice(0, 10),
          isVerified: true,
        };
      }
      return item;
    });

    onUpdateCompany({
      ...company,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleBulkUpdateAllChecklist = (targetStatus: ChecklistItemStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    const updatedChecklist = company.checklist.map((item) => {
      if (item.status === 'not_applicable') return item;
      return {
        ...item,
        status: targetStatus,
        completionDate: targetStatus === 'completed' ? today : undefined,
        isVerified: targetStatus === 'completed',
        activityHistory: [
          ...(item.activityHistory || []),
          {
            timestamp: new Date().toISOString(),
            action: `Bulk updated to ${targetStatus}`,
            user: company.assignedOfficer || 'Officer',
          },
        ],
      };
    });

    onUpdateCompany({
      ...company,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveCommsLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.summary) return;

    const entry: CommunicationLog = {
      id: 'log-' + Date.now(),
      date: new Date().toLocaleString(),
      type: newLog.type,
      contactPerson: newLog.contactPerson || company.procurementContact,
      summary: newLog.summary,
      outcome: newLog.outcome || 'Logged',
      nextFollowUpDate: newLog.nextFollowUpDate || undefined,
      loggedBy: company.assignedOfficer || 'Officer',
    };

    onUpdateCompany({
      ...company,
      communicationLogs: [entry, ...company.communicationLogs],
      nextFollowUpDate: newLog.nextFollowUpDate || company.nextFollowUpDate,
      updatedAt: new Date().toISOString(),
    });

    setIsLoggingComms(false);
    setNewLog({
      type: 'Call',
      contactPerson: company.procurementContact,
      summary: '',
      outcome: '',
      nextFollowUpDate: '',
    });
  };

  const handleSaveRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfq.title) return;

    const rfqEntry: ProcurementOpportunity = {
      id: 'rfq-' + Date.now(),
      title: newRfq.title,
      category: newRfq.category,
      estimatedValue: Number(newRfq.estimatedValue) || 0,
      rfqDate: newRfq.rfqDate || new Date().toISOString().slice(0, 10),
      deadline: newRfq.deadline || 'TBD',
      status: newRfq.status,
      referenceNo: newRfq.referenceNo || `RFQ-${Date.now().toString().slice(-4)}`,
    };

    onUpdateCompany({
      ...company,
      opportunities: [rfqEntry, ...company.opportunities],
      updatedAt: new Date().toISOString(),
    });

    setIsAddingRfq(false);
    setNewRfq({
      title: '',
      category: 'Aluminium Fabrication',
      estimatedValue: 5000000,
      rfqDate: new Date().toISOString().slice(0, 10),
      deadline: '',
      status: 'Identified',
      referenceNo: '',
    });
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name) return;

    const contactEntry: CompanyContact = {
      id: 'contact-' + Date.now(),
      name: newContact.name,
      designation: newContact.designation || 'Officer',
      department: newContact.department,
      email: newContact.email,
      phone: newContact.phone,
      isPrimary: company.contacts.length === 0,
    };

    onUpdateCompany({
      ...company,
      contacts: [...company.contacts, contactEntry],
      updatedAt: new Date().toISOString(),
    });

    setIsAddingContact(false);
    setNewContact({
      name: '',
      designation: '',
      department: 'Procurement',
      email: '',
      phone: '',
    });
  };

  const handleIntelligenceSlider = (key: keyof Company['intelligence'], val: number) => {
    const updatedFactors = {
      businessOpportunity: key === 'businessOpportunity' ? val : company.intelligence.businessOpportunity,
      companySuitability: key === 'companySuitability' ? val : company.intelligence.companySuitability,
      registrationAccessibility: key === 'registrationAccessibility' ? val : company.intelligence.registrationAccessibility,
      potentialProjectValue: key === 'potentialProjectValue' ? val : company.intelligence.potentialProjectValue,
      relationshipAccessibility: key === 'relationshipAccessibility' ? val : company.intelligence.relationshipAccessibility,
      registrationCostEffort: key === 'registrationCostEffort' ? val : company.intelligence.registrationCostEffort,
    };

    const calculated = calculateIntelligenceScore(updatedFactors);

    let newPriority = company.priority;
    if (calculated.tier === 'High-priority target') newPriority = 'High';
    else if (calculated.tier === 'Medium-priority target') newPriority = 'Medium';
    else if (calculated.tier === 'Low-priority target') newPriority = 'Low';
    else newPriority = 'Not Feasible';

    onUpdateCompany({
      ...company,
      priority: newPriority,
      intelligence: {
        ...company.intelligence,
        ...updatedFactors,
        totalScore: calculated.totalScore,
        tier: calculated.tier,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleDocStatus = (docId: string, status: CompanyDocument['status']) => {
    const updatedDocs = company.documents.map((d) => (d.id === docId ? { ...d, status } : d));
    onUpdateCompany({
      ...company,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header matching Crescendo Cart / Product Header */}
      <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{company.industry}</span>
                <span>·</span>
                <span>{company.assignedOfficer.split(' ')[0]}</span>
                <span>·</span>
                <span>{company.mainTelephone}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-0.5">
                {company.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${statusColors[company.registrationStatus]}`}>
              {company.registrationStatus}
            </span>
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-white border border-slate-200 text-[#0e3aa9] shadow-2xs">
              Score {company.intelligence.totalScore}/100
            </span>

            {/* Schedule Countdown Pill / Trigger */}
            {company.nextFollowUpDate ? (
              <button
                type="button"
                onClick={() => onOpenScheduleModal && onOpenScheduleModal(company)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border shadow-2xs transition-colors ${
                  formatScheduleCountdown(company.nextFollowUpDate)?.colorClass || 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title={`Scheduled follow-up: ${company.nextFollowUpDate}. Click to modify.`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatScheduleCountdown(company.nextFollowUpDate)?.label || company.nextFollowUpDate}</span>
              </button>
            ) : onOpenScheduleModal ? (
              <button
                type="button"
                onClick={() => onOpenScheduleModal(company)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Schedule</span>
              </button>
            ) : null}

            {/* Win Status Action Button */}
            {company.registrationStatus === 'Approved' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                <span>Won ✓</span>
              </span>
            ) : onOpenWinModal ? (
              <button
                type="button"
                onClick={() => onOpenWinModal(company)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                title="Register client as Won / Approved Vendor"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Win</span>
              </button>
            ) : null}

            <button
              onClick={() => onOpenNotificationModal(company.id)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
            >
              Alert
            </button>
            <button
              onClick={() => {
                setActiveTab('comms');
                setIsLoggingComms(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl shadow-xs transition-colors"
            >
              Log
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200/60">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums mb-1.5">
            <span className="text-slate-600 font-semibold">
              Checklist: {progressSummary.completedItems}/{progressSummary.applicableItems}
            </span>
            <span className="font-bold text-[#0e3aa9]">{progressSummary.overallPercentage}% Complete</span>
          </div>
          <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0e3aa9] rounded-full transition-all duration-300"
              style={{ width: `${progressSummary.overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs styled like clean segmented nav */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-600 pb-1">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'checklist' ? 'bg-[#0e3aa9] text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Checklist
        </button>

        <button
          onClick={() => setActiveTab('intelligence')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'intelligence' ? 'bg-[#0e3aa9] text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Intelligence
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-[#0e3aa9] text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Contacts ({company.contacts.length})
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'documents' ? 'bg-[#0e3aa9] text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Documents ({company.documents.length})
        </button>

        <button
          onClick={() => setActiveTab('comms')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'comms' ? 'bg-[#0e3aa9] text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          History ({company.communicationLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('submission')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'submission' ? 'bg-[#0e3aa9] text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Submission
        </button>

        <button
          onClick={() => setActiveTab('approval')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'approval' ? 'bg-[#0e3aa9] text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Approval
        </button>

        <button
          onClick={() => setActiveTab('rfqs')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'rfqs' ? 'bg-[#0e3aa9] text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          RFQs ({company.opportunities.length})
        </button>
      </div>

      {/* TAB 1: CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          {/* Phase Filter Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 text-xs">
            <button
              onClick={() => setSelectedPhase('ALL')}
              className={`p-2 text-center rounded border ${
                selectedPhase === 'ALL'
                  ? 'border-slate-900 bg-slate-900 text-white font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {REGISTRATION_PHASES.map((p) => {
              const pData = progressSummary.phases.find((x) => x.phase === p.key);
              const isSelected = selectedPhase === p.key;

              return (
                <button
                  key={p.key}
                  onClick={() => setSelectedPhase(p.key)}
                  className={`p-2 text-center rounded border ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>Phase {p.key}</div>
                  <div className="text-[10px] opacity-75 font-mono">{pData?.percentage}%</div>
                </button>
              );
            })}
          </div>

          {/* Search bar & single-click update buttons */}
          <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                placeholder="Search tasks..."
                value={checklistSearch}
                onChange={(e) => setChecklistSearch(e.target.value)}
                className="py-1.5 px-3 border border-slate-200 rounded-xl bg-white text-xs w-52 focus:outline-none focus:border-[#0e3aa9]"
              />
              <select
                value={checklistStatusFilter}
                onChange={(e) => setChecklistStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="not_applicable">N/A</option>
              </select>
            </div>

            {/* One-Button Bulk Update Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleBulkUpdateAllChecklist('completed')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl transition-colors shadow-2xs whitespace-nowrap"
                title="Complete all"
              >
                <span>Complete</span>
              </button>

              {selectedPhase !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleBulkCompletePhase(selectedPhase)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs"
                >
                  Phase {selectedPhase}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleBulkUpdateAllChecklist('not_started')}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 bg-white border border-slate-200 rounded-xl shadow-2xs"
                title="Reset all checklist items to Not Started"
              >
                Reset
              </button>
            </div>
          </div>

          {/* List */}
          <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100">
            {company.checklist
              .filter((item) => {
                const matchesPhase = selectedPhase === 'ALL' || item.phase === selectedPhase;
                const matchesStatus =
                  checklistStatusFilter === 'ALL' || item.status === checklistStatusFilter;
                const matchesSearch =
                  item.title.toLowerCase().includes(checklistSearch.toLowerCase()) ||
                  item.id.toLowerCase().includes(checklistSearch.toLowerCase());
                return matchesPhase && matchesStatus && matchesSearch;
              })
              .map((item) => {
                const isExpanded = expandedItemId === item.id;
                const isDone = item.status === 'completed';

                return (
                  <div key={item.id} className="p-2.5 hover:bg-slate-50 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={() =>
                            handleUpdateChecklistItemStatus(
                              item.id,
                              item.status === 'completed' ? 'not_started' : 'completed'
                            )
                          }
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isDone ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <span className="font-mono text-[11px] text-slate-400">{item.id}</span>
                        <span className={`truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-900 font-medium'}`}>
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateChecklistItemStatus(item.id, e.target.value as ChecklistItemStatus)
                          }
                          className="text-[11px] py-0.5 px-1.5 border border-slate-200 rounded bg-white text-slate-700"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="not_applicable">N/A</option>
                        </select>

                        <button
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <label className="block text-slate-500 mb-0.5">Assigned</label>
                          <input
                            type="text"
                            value={item.responsiblePerson}
                            onChange={(e) =>
                              handleUpdateChecklistItemDetails(item.id, 'responsiblePerson', e.target.value)
                            }
                            className="w-full py-1 px-2 border border-slate-200 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-0.5">Deadline</label>
                          <input
                            type="date"
                            value={item.deadline || ''}
                            onChange={(e) =>
                              handleUpdateChecklistItemDetails(item.id, 'deadline', e.target.value)
                            }
                            className="w-full py-1 px-2 border border-slate-200 rounded bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-0.5">Notes</label>
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) =>
                              handleUpdateChecklistItemDetails(item.id, 'notes', e.target.value)
                            }
                            placeholder="Add task note..."
                            className="w-full py-1 px-2 border border-slate-200 rounded bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: INTELLIGENCE */}
      {activeTab === 'intelligence' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Intelligence Scoring</h2>
            <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
              {company.intelligence.totalScore} / 100
              <span className="text-xs font-normal text-slate-500 ml-2">({company.intelligence.tier})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Business Opportunity (25%)</span>
                <span className="font-mono">{company.intelligence.businessOpportunity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={company.intelligence.businessOpportunity}
                onChange={(e) => handleIntelligenceSlider('businessOpportunity', Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Company Suitability (20%)</span>
                <span className="font-mono">{company.intelligence.companySuitability}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={company.intelligence.companySuitability}
                onChange={(e) => handleIntelligenceSlider('companySuitability', Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Registration Accessibility (15%)</span>
                <span className="font-mono">{company.intelligence.registrationAccessibility}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={company.intelligence.registrationAccessibility}
                onChange={(e) => handleIntelligenceSlider('registrationAccessibility', Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Potential Project Value (20%)</span>
                <span className="font-mono">{company.intelligence.potentialProjectValue}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={company.intelligence.potentialProjectValue}
                onChange={(e) => handleIntelligenceSlider('potentialProjectValue', Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Relationship Accessibility (10%)</span>
                <span className="font-mono">{company.intelligence.relationshipAccessibility}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={company.intelligence.relationshipAccessibility}
                onChange={(e) => handleIntelligenceSlider('relationshipAccessibility', Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Registration Cost & Effort (10%)</span>
                <span className="font-mono">{company.intelligence.registrationCostEffort}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={company.intelligence.registrationCostEffort}
                onChange={(e) => handleIntelligenceSlider('registrationCostEffort', Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Notes</label>
            <input
              type="text"
              value={company.intelligence.justificationNotes || ''}
              onChange={(e) =>
                onUpdateCompany({
                  ...company,
                  intelligence: { ...company.intelligence, justificationNotes: e.target.value },
                })
              }
              placeholder="Scoring evidence..."
              className="w-full py-1.5 px-2.5 border border-slate-200 rounded bg-white text-xs"
            />
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Company Name</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => onUpdateCompany({ ...company, name: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-500">Industry</label>
                <span className="text-[10px] text-slate-400">Select or edit</span>
              </div>
              <input
                type="text"
                list="workspace-industry-types"
                value={company.industry}
                onChange={(e) => onUpdateCompany({ ...company, industry: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded"
              />
              <datalist id="workspace-industry-types">
                {industryTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Telephone</label>
              <input
                type="text"
                value={company.mainTelephone}
                onChange={(e) => onUpdateCompany({ ...company, mainTelephone: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={company.procurementEmail}
                onChange={(e) => onUpdateCompany({ ...company, procurementEmail: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Portal URL</label>
              <input
                type="text"
                value={company.registrationPortal || ''}
                onChange={(e) => onUpdateCompany({ ...company, registrationPortal: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Officer</label>
              <input
                type="text"
                value={company.assignedOfficer}
                onChange={(e) => onUpdateCompany({ ...company, assignedOfficer: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Contacts</h3>
              <button
                onClick={() => setIsAddingContact(true)}
                className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
              >
                + Add Contact
              </button>
            </div>

            {isAddingContact && (
              <form onSubmit={handleSaveContact} className="p-3 mb-3 bg-slate-50 border border-slate-200 rounded grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  required
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="py-1 px-2 border rounded bg-white text-xs"
                />
                <input
                  placeholder="Designation"
                  value={newContact.designation}
                  onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                  className="py-1 px-2 border rounded bg-white text-xs"
                />
                <input
                  placeholder="Email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="py-1 px-2 border rounded bg-white text-xs"
                />
                <div className="flex gap-1">
                  <input
                    placeholder="Phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="flex-1 py-1 px-2 border rounded bg-white text-xs font-mono"
                  />
                  <button type="submit" className="px-2 py-1 bg-slate-900 text-white rounded text-xs font-semibold">
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100">
              {company.contacts.map((c) => (
                <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    <span className="text-slate-500 ml-2">({c.designation})</span>
                    <span className="text-slate-400 font-mono ml-2">{c.phone || c.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateCompany({
                        ...company,
                        contacts: company.contacts.filter((x) => x.id !== c.id),
                      });
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-slate-200 rounded p-4 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="py-2 px-3">Document</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {company.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="py-2 px-3 font-medium text-slate-900">{doc.title}</td>
                    <td className="py-2 px-3">
                      <select
                        value={doc.status}
                        onChange={(e) => handleToggleDocStatus(doc.id, e.target.value as any)}
                        className="text-[11px] font-medium py-0.5 px-1.5 border rounded"
                      >
                        <option value="Valid">Valid</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Missing">Missing</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{doc.issueDate || '—'}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => {
                          const updated = company.documents.map((d) =>
                            d.id === doc.id ? { ...d, status: 'Valid' as const, issueDate: new Date().toISOString().slice(0, 10) } : d
                          );
                          onUpdateCompany({ ...company, documents: updated });
                        }}
                        className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 rounded"
                      >
                        Upload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: HISTORY */}
      {activeTab === 'comms' && (
        <div className="bg-white border border-slate-200 rounded p-4 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Communication History</h2>
            <button
              onClick={() => setIsLoggingComms(!isLoggingComms)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded"
            >
              + Log Interaction
            </button>
          </div>

          {isLoggingComms && (
            <form onSubmit={handleSaveCommsLog} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newLog.type}
                  onChange={(e) => setNewLog({ ...newLog, type: e.target.value as any })}
                  className="py-1 px-2 border rounded bg-white"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Meeting">Meeting</option>
                </select>
                <input
                  placeholder="Contact Person"
                  value={newLog.contactPerson}
                  onChange={(e) => setNewLog({ ...newLog, contactPerson: e.target.value })}
                  className="py-1 px-2 border rounded bg-white"
                />
                <input
                  type="date"
                  value={newLog.nextFollowUpDate}
                  onChange={(e) => setNewLog({ ...newLog, nextFollowUpDate: e.target.value })}
                  className="py-1 px-2 border rounded bg-white font-mono"
                />
              </div>
              <textarea
                required
                rows={2}
                placeholder="Discussion summary..."
                value={newLog.summary}
                onChange={(e) => setNewLog({ ...newLog, summary: e.target.value })}
                className="w-full p-2 border rounded bg-white text-xs"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsLoggingComms(false)} className="px-2 py-1 text-slate-500">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1 bg-slate-900 text-white rounded font-medium">
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100">
            {company.communicationLogs.map((log) => (
              <div key={log.id} className="py-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5 font-mono">
                  <span className="font-bold text-slate-900">{log.type} · {log.contactPerson}</span>
                  <span>{log.date}</span>
                </div>
                <p className="text-slate-800 text-xs">{log.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SUBMISSION */}
      {activeTab === 'submission' && (
        <div className="bg-white border border-slate-200 rounded p-4 text-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Channel</label>
              <select
                value={company.submission.channel}
                onChange={(e) =>
                  onUpdateCompany({
                    ...company,
                    submission: { ...company.submission, channel: e.target.value as any },
                  })
                }
                className="w-full py-1.5 px-2 border border-slate-200 rounded"
              >
                <option value="Online Vendor Portal">Online Portal</option>
                <option value="Official Procurement Email">Email</option>
                <option value="Physical Courier">Courier</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Reference No</label>
              <input
                type="text"
                value={company.submission.referenceNumber || ''}
                onChange={(e) =>
                  onUpdateCompany({
                    ...company,
                    submission: { ...company.submission, referenceNumber: e.target.value },
                  })
                }
                className="w-full py-1.5 px-2 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Submission Date</label>
              <input
                type="date"
                value={company.submission.submissionDate || ''}
                onChange={(e) =>
                  onUpdateCompany({
                    ...company,
                    submission: { ...company.submission, submissionDate: e.target.value },
                  })
                }
                className="w-full py-1.5 px-2 border border-slate-200 rounded font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: APPROVAL */}
      {activeTab === 'approval' && (
        <div className="bg-white border border-slate-200 rounded p-4 text-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Vendor Code</label>
              <input
                type="text"
                value={company.approval.vendorNumber || ''}
                onChange={(e) =>
                  onUpdateCompany({
                    ...company,
                    approval: { ...company.approval, vendorNumber: e.target.value },
                  })
                }
                className="w-full py-1.5 px-2 border border-slate-200 rounded font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Valid Until</label>
              <input
                type="date"
                value={company.approval.validUntil || ''}
                onChange={(e) =>
                  onUpdateCompany({
                    ...company,
                    approval: { ...company.approval, validUntil: e.target.value },
                  })
                }
                className="w-full py-1.5 px-2 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Portal Login</label>
              <input
                type="text"
                value={company.approval.portalLogin || ''}
                onChange={(e) =>
                  onUpdateCompany({
                    ...company,
                    approval: { ...company.approval, portalLogin: e.target.value },
                  })
                }
                className="w-full py-1.5 px-2 border border-slate-200 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: RFQS */}
      {activeTab === 'rfqs' && (
        <div className="bg-white border border-slate-200 rounded p-4 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">RFQs</h2>
            <button
              onClick={() => setIsAddingRfq(!isAddingRfq)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded"
            >
              + Add RFQ
            </button>
          </div>

          {isAddingRfq && (
            <form onSubmit={handleSaveRfq} className="p-3 bg-slate-50 border border-slate-200 rounded grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                required
                placeholder="Title"
                value={newRfq.title}
                onChange={(e) => setNewRfq({ ...newRfq, title: e.target.value })}
                className="py-1 px-2 border rounded bg-white text-xs"
              />
              <input
                type="number"
                placeholder="Value (LKR)"
                value={newRfq.estimatedValue}
                onChange={(e) => setNewRfq({ ...newRfq, estimatedValue: Number(e.target.value) })}
                className="py-1 px-2 border rounded bg-white text-xs font-mono"
              />
              <div className="flex gap-1">
                <input
                  type="date"
                  value={newRfq.deadline}
                  onChange={(e) => setNewRfq({ ...newRfq, deadline: e.target.value })}
                  className="flex-1 py-1 px-2 border rounded bg-white text-xs font-mono"
                />
                <button type="submit" className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold">
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100">
            {company.opportunities.map((opp) => (
              <div key={opp.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{opp.title}</span>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    LKR {opp.estimatedValue.toLocaleString()} · Due: {opp.deadline}
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-100 rounded">
                  {opp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
