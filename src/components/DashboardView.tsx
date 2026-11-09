import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Upload,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Company } from '../types';
import { calculateDashboardMetrics, calculateCompanyChecklistProgress } from '../utils/rules';

interface DashboardViewProps {
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onNavigateTab: (tab: 'companies' | 'pipeline' | 'notifications' | 'reports') => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onSeedSample?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  companies,
  onSelectCompany,
  onNavigateTab,
  onOpenAddModal,
  onOpenImportModal,
  onSeedSample,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const metrics = calculateDashboardMetrics(companies);

  const filteredTargets = companies
    .filter((c) => {
      const isTarget = c.priority === 'High' && c.registrationStatus !== 'Approved';
      if (!searchQuery.trim()) return isTarget;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.procurementContact.toLowerCase().includes(q)
      );
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Title with search */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Overview
        </h1>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-[#f8faff] focus:bg-white focus:outline-none focus:border-[#0e3aa9] focus:ring-1 focus:ring-[#0e3aa9] transition-all"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approved
            </div>
            <div className="text-2xl font-extrabold text-[#0e3aa9] font-mono tabular-nums mt-1">
              {metrics.approvedVendors}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-[#0e3aa9] flex items-center justify-center font-bold text-base">
            ✓
          </div>
        </div>

        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending
            </div>
            <div className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums mt-1">
              {metrics.pendingApprovals}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center font-bold text-base">
            ⏳
          </div>
        </div>

        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pipeline
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
              LKR {(metrics.monthlyProcurementSpend / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/60 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono">
            Rs.
          </div>
        </div>

        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rate
            </div>
            <div className="text-2xl font-extrabold text-[#0e3aa9] font-mono tabular-nums mt-1">
              {metrics.successRate}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100/60 text-indigo-800 flex items-center justify-center font-bold text-xs font-mono">
            %
          </div>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
            <span>Clients</span>
            <div className="flex items-center gap-12 mr-2">
              <span>Checklist</span>
              <span>Score</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTargets.length === 0 ? (
              <div className="py-10 text-center bg-[#f8faff] rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0e3aa9] mb-3 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {companies.length === 0 ? 'No Client Companies Registered' : 'No Priority Targets Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  {companies.length === 0
                    ? 'Your database is clean. Bulk upload a CSV or add your first client company to begin tracking registration progress.'
                    : 'No companies match your current search query.'}
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={onOpenImportModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl transition-all shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Bulk Upload CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Client</span>
                  </button>
                </div>
                {companies.length === 0 && onSeedSample && (
                  <button
                    type="button"
                    onClick={onSeedSample}
                    className="mt-4 text-[11px] text-[#0e3aa9] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Load Demo Template (10 Clients)</span>
                  </button>
                )}
              </div>
            ) : (
              filteredTargets.map((comp) => {
                const progress = calculateCompanyChecklistProgress(comp.checklist);

                return (
                  <div
                    key={comp.id}
                    onClick={() => onSelectCompany(comp.id)}
                    className="py-4 flex items-center justify-between gap-4 group cursor-pointer hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-700 font-bold text-xs shadow-2xs group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                        {comp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 group-hover:text-[#0e3aa9] transition-colors truncate">
                          {comp.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {comp.industry}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 shrink-0">
                      <div className="flex items-center border border-slate-200 bg-white rounded-full px-2.5 py-1 text-xs text-slate-600 gap-2 shadow-2xs">
                        <span className="font-mono font-semibold text-slate-800 text-xs">
                          {progress.completedItems} / 115
                        </span>
                      </div>

                      <div className="text-right w-16">
                        <div className="text-base font-bold text-[#0e3aa9] font-mono tabular-nums">
                          {comp.intelligence.totalScore}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {progress.overallPercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-1">
            <button
              onClick={() => onNavigateTab('companies')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0e3aa9] hover:underline"
            >
              <span>View All ({companies.length}) →</span>
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Summary
            </h2>

            <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-200 pb-3">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-mono font-bold text-slate-900">{metrics.totalCompanies}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active</span>
                <span className="font-mono font-bold text-slate-900">{metrics.applicationsActive}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Approved</span>
                <span className="font-mono font-bold text-emerald-700">{metrics.approvedVendors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Follow-Ups</span>
                <span className="font-mono font-bold text-slate-900">{metrics.pendingFollowUps}</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-xs font-bold text-slate-900">Rate</span>
              <span className="text-xl font-extrabold text-[#0e3aa9] font-mono tabular-nums">
                {metrics.successRate}%
              </span>
            </div>

            <button
              onClick={() => onNavigateTab('pipeline')}
              className="w-full py-3 px-4 bg-[#0e3aa9] hover:bg-[#0b2d84] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Pipeline →</span>
            </button>
          </div>

          <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0e3aa9] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-800">
              115-Step Master Verification
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
