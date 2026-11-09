import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trophy,
} from 'lucide-react';
import { Company, RegistrationStatus } from '../types';
import {
  calculateCompanyChecklistProgress,
  formatScheduleCountdown,
} from '../utils/rules';

interface PipelineBoardViewProps {
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onUpdateCompanyStatus: (companyId: string, status: RegistrationStatus) => void;
  onOpenAddModal: () => void;
  onOpenImportModal?: () => void;
  onOpenWinModal?: (company: Company) => void;
  onOpenScheduleModal?: (company: Company) => void;
}

interface ColumnDefinition {
  key: string;
  title: string;
  statuses: RegistrationStatus[];
  headerColor: string;
}

const BOARD_COLUMNS: ColumnDefinition[] = [
  {
    key: 'col-identified',
    title: 'Identified',
    statuses: ['Identified'],
    headerColor: 'border-slate-400 text-slate-700',
  },
  {
    key: 'col-contacted',
    title: 'Contacted',
    statuses: ['Contacted'],
    headerColor: 'border-sky-500 text-sky-800',
  },
  {
    key: 'col-requirements',
    title: 'Requirements',
    statuses: ['Requirements Received'],
    headerColor: 'border-amber-500 text-amber-800',
  },
  {
    key: 'col-preparation',
    title: 'Preparation',
    statuses: ['Documents In Preparation'],
    headerColor: 'border-indigo-500 text-indigo-800',
  },
  {
    key: 'col-submitted',
    title: 'Submitted',
    statuses: ['Submitted', 'Under Evaluation'],
    headerColor: 'border-blue-600 text-blue-800',
  },
  {
    key: 'col-approved',
    title: 'Approved',
    statuses: ['Approved', 'Conditionally Approved'],
    headerColor: 'border-emerald-600 text-emerald-800',
  },
];

const STAGE_ORDER: RegistrationStatus[] = [
  'Identified',
  'Contacted',
  'Requirements Received',
  'Documents In Preparation',
  'Submitted',
  'Under Evaluation',
  'Approved',
];

export const PipelineBoardView: React.FC<PipelineBoardViewProps> = ({
  companies,
  onSelectCompany,
  onUpdateCompanyStatus,
  onOpenAddModal,
  onOpenImportModal,
  onOpenWinModal,
  onOpenScheduleModal,
}) => {
  const getNextStatus = (current: RegistrationStatus): RegistrationStatus | null => {
    const idx = STAGE_ORDER.indexOf(current);
    if (idx >= 0 && idx < STAGE_ORDER.length - 1) {
      return STAGE_ORDER[idx + 1];
    }
    return null;
  };

  const getPrevStatus = (current: RegistrationStatus): RegistrationStatus | null => {
    const idx = STAGE_ORDER.indexOf(current);
    if (idx > 0) {
      return STAGE_ORDER[idx - 1];
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Pipeline</h2>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {companies.length === 0 && (
        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-6 text-center flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-900">Pipeline is currently empty</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
            No client accounts have been registered yet. Add clients individually or upload your company list in bulk to populate the Kanban board.
          </p>
          <div className="flex items-center gap-2 mt-4">
            {onOpenImportModal && (
              <button
                type="button"
                onClick={onOpenImportModal}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl transition-all shadow-xs"
              >
                Bulk Upload CSV
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
            >
              Add Client
            </button>
          </div>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 pb-6 overflow-x-auto">
        {BOARD_COLUMNS.map((col) => {
          const colCompanies = companies.filter((c) => col.statuses.includes(c.registrationStatus));

          return (
            <div
              key={col.key}
              className="bg-[#f8faff] border border-slate-200/80 rounded-2xl flex flex-col min-w-[220px] overflow-hidden"
            >
              {/* Column Header */}
              <div className={`p-3 border-b bg-white flex items-center justify-between ${col.headerColor}`}>
                <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                  {colCompanies.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[700px]">
                {colCompanies.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Empty</div>
                ) : (
                  colCompanies.map((c) => {
                    const progress = calculateCompanyChecklistProgress(c.checklist);
                    const prev = getPrevStatus(c.registrationStatus);
                    const next = getNextStatus(c.registrationStatus);
                    const countdown = formatScheduleCountdown(c.nextFollowUpDate);
                    const isWon = c.registrationStatus === 'Approved';

                    return (
                      <div
                        key={c.id}
                        className="bg-white border border-slate-200/80 rounded-xl p-3 hover:border-blue-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <button
                            onClick={() => onSelectCompany(c.id)}
                            className="font-bold text-xs text-slate-900 hover:text-[#0e3aa9] text-left line-clamp-1 transition-colors"
                          >
                            {c.name}
                          </button>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            {c.priority}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {c.industry}
                        </div>

                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                            <span>Progress</span>
                            <span className="font-semibold text-slate-800">{progress.overallPercentage}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-700 rounded-full"
                              style={{ width: `${progress.overallPercentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span className="truncate max-w-[85px]">{c.assignedOfficer.split(' ')[0]}</span>
                          {countdown ? (
                            <button
                              type="button"
                              onClick={() => onOpenScheduleModal && onOpenScheduleModal(c)}
                              title={`Scheduled: ${c.nextFollowUpDate}. Click to modify.`}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${countdown.colorClass}`}
                            >
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <span>{countdown.label}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenScheduleModal && onOpenScheduleModal(c)}
                              className="text-slate-400 hover:text-slate-700 text-[10px]"
                            >
                              + Schedule
                            </button>
                          )}
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-50 flex items-center justify-between gap-1">
                          <button
                            disabled={!prev}
                            onClick={() => prev && onUpdateCompanyStatus(c.id, prev)}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Move back"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onSelectCompany(c.id)}
                              className="text-[10px] text-slate-700 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-50"
                            >
                              View
                            </button>

                            {isWon ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Won ✓
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenWinModal && onOpenWinModal(c)}
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors"
                                title="Record Won Client Status"
                              >
                                <Trophy className="w-2.5 h-2.5" />
                                <span>Win</span>
                              </button>
                            )}
                          </div>

                          <button
                            disabled={!next}
                            onClick={() => next && onUpdateCompanyStatus(c.id, next)}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Advance"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
