import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Company } from '../types';
import { calculateDashboardMetrics, calculateCompanyChecklistProgress, exportCompaniesToCsv } from '../utils/rules';

interface ReportsViewProps {
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ companies, onSelectCompany }) => {
  const [activeReport, setActiveReport] = useState<
    'progress' | 'approved' | 'industries' | 'officers' | 'rfqs'
  >('progress');

  const metrics = calculateDashboardMetrics(companies);

  const industryMap = new Map<string, { total: number; approved: number; active: number }>();
  companies.forEach((c) => {
    const ind = c.industry || 'Other';
    const curr = industryMap.get(ind) || { total: 0, approved: 0, active: 0 };
    curr.total++;
    if (c.registrationStatus === 'Approved' || c.registrationStatus === 'Conditionally Approved') {
      curr.approved++;
    }
    if (['Requirements Received', 'Documents In Preparation', 'Submitted', 'Under Evaluation'].includes(c.registrationStatus)) {
      curr.active++;
    }
    industryMap.set(ind, curr);
  });

  const industryStats = Array.from(industryMap.entries()).map(([industry, stats]) => ({
    industry,
    total: stats.total,
    approved: stats.approved,
    active: stats.active,
    successRate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
  }));

  const officerMap = new Map<string, { assigned: number; approved: number; active: number }>();
  companies.forEach((c) => {
    const off = c.assignedOfficer || 'Unassigned';
    const curr = officerMap.get(off) || { assigned: 0, approved: 0, active: 0 };
    curr.assigned++;
    if (c.registrationStatus === 'Approved') curr.approved++;
    if (['Contacted', 'Requirements Received', 'Submitted'].includes(c.registrationStatus)) curr.active++;
    officerMap.set(off, curr);
  });

  const officerStats = Array.from(officerMap.entries()).map(([officer, stats]) => ({
    officer,
    ...stats,
    winRate: stats.assigned > 0 ? Math.round((stats.approved / stats.assigned) * 100) : 0,
  }));

  const approvedVendors = companies.filter(
    (c) => c.registrationStatus === 'Approved' || c.registrationStatus === 'Conditionally Approved'
  );

  const allRfqs = companies.flatMap((c) =>
    c.opportunities.map((opp) => ({
      ...opp,
      companyId: c.id,
      companyName: c.name,
    }))
  );

  const totalRfqPipelineValue = allRfqs.reduce((acc, curr) => acc + curr.estimatedValue, 0);

  const handleDownloadCsv = () => {
    const csvContent = exportCompaniesToCsv(companies);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `innovista_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Reports
        </h1>

        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved</span>
          <div className="mt-1 text-2xl font-extrabold text-[#0e3aa9] font-mono tabular-nums">
            {metrics.approvedVendors}
          </div>
        </div>

        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Turnaround</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {metrics.averageTurnaroundDays}d
          </div>
        </div>

        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline</span>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            LKR {(totalRfqPipelineValue / 1000000).toFixed(1)}M
          </div>
        </div>

        <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</span>
          <div className="mt-1 text-2xl font-extrabold text-[#0e3aa9] font-mono tabular-nums">
            {metrics.successRate}%
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveReport('progress')}
          className={`py-2 px-3 border-b-2 whitespace-nowrap ${
            activeReport === 'progress' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          Progress ({companies.length})
        </button>

        <button
          onClick={() => setActiveReport('approved')}
          className={`py-2 px-3 border-b-2 whitespace-nowrap ${
            activeReport === 'approved' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          Approved ({approvedVendors.length})
        </button>

        <button
          onClick={() => setActiveReport('industries')}
          className={`py-2 px-3 border-b-2 whitespace-nowrap ${
            activeReport === 'industries' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          Industries ({industryStats.length})
        </button>

        <button
          onClick={() => setActiveReport('officers')}
          className={`py-2 px-3 border-b-2 whitespace-nowrap ${
            activeReport === 'officers' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          Officers ({officerStats.length})
        </button>

        <button
          onClick={() => setActiveReport('rfqs')}
          className={`py-2 px-3 border-b-2 whitespace-nowrap ${
            activeReport === 'rfqs' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          RFQs ({allRfqs.length})
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden text-xs">
        {activeReport === 'progress' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Officer</th>
                  <th className="py-2.5 px-3">Checklist</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((c) => {
                  const p = calculateCompanyChecklistProgress(c.checklist);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCompany(c.id)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{c.registrationStatus}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.assignedOfficer.split(' ')[0]}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {p.overallPercentage}% ({p.completedItems}/{p.applicableItems})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {c.intelligence.totalScore}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'approved' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Vendor Code</th>
                  <th className="py-2.5 px-3">Categories</th>
                  <th className="py-2.5 px-3 text-right">Valid Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedVendors.map((c) => (
                  <tr key={c.id} onClick={() => onSelectCompany(c.id)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{c.approval.vendorNumber || 'Pending'}</td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{c.approval.approvedCategories[0]}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{c.approval.validUntil || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'industries' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Industry</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Approved</th>
                  <th className="py-2.5 px-3 text-right">Success</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {industryStats.map((ind) => (
                  <tr key={ind.industry} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{ind.industry}</td>
                    <td className="py-2.5 px-3">{ind.total}</td>
                    <td className="py-2.5 px-3 text-sky-700">{ind.active}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">{ind.approved}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{ind.successRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'officers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Officer</th>
                  <th className="py-2.5 px-3">Assigned</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Approved</th>
                  <th className="py-2.5 px-3 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {officerStats.map((off) => (
                  <tr key={off.officer} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{off.officer.split(' ')[0]}</td>
                    <td className="py-2.5 px-3">{off.assigned}</td>
                    <td className="py-2.5 px-3 text-sky-700">{off.active}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">{off.approved}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{off.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'rfqs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allRfqs.map((rfq) => (
                  <tr key={rfq.id} onClick={() => onSelectCompany(rfq.companyId)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{rfq.title}</td>
                    <td className="py-2.5 px-3 text-slate-600">{rfq.companyName}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">LKR {rfq.estimatedValue.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{rfq.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
