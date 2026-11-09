import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  ArrowUpDown,
  Upload,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Copy,
  MoreVertical,
  Check,
  Trophy,
  Clock,
  UserCheck,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Company, RegistrationStatus } from '../types';
import { SAMPLE_CSV } from './CsvImportModal';
import {
  calculateCompanyChecklistProgress,
  exportCompaniesToCsv,
  VendorCategory,
  isCompanyInCategory,
  countCompaniesByCategories,
  IndustryCategory,
  getIndustryCategory,
  countCompaniesByIndustryCategory,
  formatScheduleCountdown,
  REPRESENTATIVE_PRESETS,
  ALL_REGISTRATION_STATUSES,
} from '../utils/rules';

interface CompanyListViewProps {
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onUpdateCompany?: (updated: Company) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onDeleteCompany: (companyId: string) => void;
  onUpdateCompanyStatus: (companyId: string, status: RegistrationStatus) => void;
  onBulkUpdateStatus?: (companyIds: string[], status: RegistrationStatus) => void;
  onBulkAssignOfficer?: (companyIds: string[], officerName: string) => void;
  onBulkDelete?: (companyIds: string[]) => void;
  onOpenWinModal?: (company: Company) => void;
  onOpenScheduleModal?: (company: Company) => void;
  onShowToast?: (msg: string) => void;
  onSeedSample?: () => void;
  onClearDatabase?: () => void;
}

export const CompanyListView: React.FC<CompanyListViewProps> = ({
  companies,
  onSelectCompany,
  onUpdateCompany,
  onOpenAddModal,
  onOpenImportModal,
  onDeleteCompany,
  onUpdateCompanyStatus,
  onBulkUpdateStatus,
  onBulkAssignOfficer,
  onBulkDelete,
  onOpenWinModal,
  onOpenScheduleModal,
  onShowToast,
  onSeedSample,
  onClearDatabase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<VendorCategory>('All');
  const [selectedIndustryCategory, setSelectedIndustryCategory] = useState<IndustryCategory>('All');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [industryFilter, setIndustryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'progress' | 'followUp'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Persistent Bulk Action Toolbar States
  const [isAssignRepOpen, setIsAssignRepOpen] = useState(false);
  const [customRepName, setCustomRepName] = useState('');
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);

  // Quick Action Dropdown State
  const [activeMenuCompanyId, setActiveMenuCompanyId] = useState<string | null>(null);
  const [followUpPickerCompanyId, setFollowUpPickerCompanyId] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categoryCounts = useMemo(() => countCompaniesByCategories(companies), [companies]);
  const industryCategoryOptions = useMemo(() => countCompaniesByIndustryCategory(companies), [companies]);

  const uniqueIndustries = useMemo(() => {
    const list = Array.from(new Set(companies.map((c) => c.industry))).filter(Boolean);
    return list.sort();
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies
      .filter((c) => {
        const matchesCategory = isCompanyInCategory(c, activeCategory);
        const matchesIndustryCategory =
          selectedIndustryCategory === 'All' ||
          getIndustryCategory(c.industry) === selectedIndustryCategory;
        const matchesSearch =
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.procurementContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.procurementEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.notes.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || c.registrationStatus === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;
        const matchesIndustry = industryFilter === 'ALL' || c.industry === industryFilter;

        return (
          matchesCategory &&
          matchesIndustryCategory &&
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesIndustry
        );
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortBy === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortBy === 'priority') {
          const priorityWeight = { High: 3, Medium: 2, Low: 1, 'Not Feasible': 0 };
          valA = priorityWeight[a.priority];
          valB = priorityWeight[b.priority];
        } else if (sortBy === 'progress') {
          valA = calculateCompanyChecklistProgress(a.checklist).overallPercentage;
          valB = calculateCompanyChecklistProgress(b.checklist).overallPercentage;
        } else if (sortBy === 'followUp') {
          valA = a.nextFollowUpDate || '9999-99-99';
          valB = b.nextFollowUpDate || '9999-99-99';
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    companies,
    activeCategory,
    selectedIndustryCategory,
    searchTerm,
    statusFilter,
    priorityFilter,
    industryFilter,
    sortBy,
    sortOrder,
  ]);

  const handleExportCsv = (specificCompany?: Company) => {
    const toExport = specificCompany
      ? [specificCompany]
      : selectedIds.length > 0
      ? companies.filter((c) => selectedIds.includes(c.id))
      : filteredCompanies;

    if (toExport.length === 0) {
      if (onShowToast) onShowToast('No company records to download');
      return;
    }

    const csvContent = exportCompaniesToCsv(toExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = specificCompany
      ? `${specificCompany.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_report_${dateStamp}.csv`
      : `innovista_clients_report_${dateStamp}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      const msg = specificCompany
        ? `Downloaded CSV report for ${specificCompany.name}`
        : `Downloaded CSV report for ${toExport.length} ${toExport.length === 1 ? 'company' : 'companies'}`;
      onShowToast(msg);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'innovista_client_bulk_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Downloaded bulk upload CSV template');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCompanies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCompanies.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (status: RegistrationStatus) => {
    if (selectedIds.length === 0) return;
    if (onBulkUpdateStatus) {
      onBulkUpdateStatus(selectedIds, status);
    } else {
      selectedIds.forEach((id) => onUpdateCompanyStatus(id, status));
    }
    setIsBulkStatusOpen(false);
  };

  const handleExecuteBulkAssign = (officerName: string) => {
    if (selectedIds.length === 0 || !officerName.trim()) return;
    const cleanOfficer = officerName.trim();
    if (onBulkAssignOfficer) {
      onBulkAssignOfficer(selectedIds, cleanOfficer);
    } else if (onUpdateCompany) {
      selectedIds.forEach((id) => {
        const comp = companies.find((c) => c.id === id);
        if (comp) {
          onUpdateCompany({
            ...comp,
            assignedOfficer: cleanOfficer,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    }
    if (onShowToast) {
      onShowToast(`Assigned representative "${cleanOfficer}" to ${selectedIds.length} clients`);
    }
    setIsAssignRepOpen(false);
    setCustomRepName('');
  };

  const handleDownloadSelection = () => {
    if (selectedIds.length === 0) {
      if (onShowToast) onShowToast('No client records selected to download');
      return;
    }
    const toExport = companies.filter((c) => selectedIds.includes(c.id));
    const csvContent = exportCompaniesToCsv(toExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `innovista_selected_${toExport.length}_clients_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(`Downloaded CSV report for ${toExport.length} selected clients`);
    }
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (onBulkDelete) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    } else {
      if (window.confirm(`Delete ${selectedIds.length} records?`)) {
        selectedIds.forEach((id) => onDeleteCompany(id));
        setSelectedIds([]);
      }
    }
  };

  // Quick Action Handlers
  const handleMarkUrgent = (company: Company) => {
    setActiveMenuCompanyId(null);
    if (onUpdateCompany) {
      onUpdateCompany({
        ...company,
        priority: 'High',
        intelligence: {
          ...company.intelligence,
          businessOpportunity: Math.max(90, company.intelligence.businessOpportunity),
          potentialProjectValue: Math.max(90, company.intelligence.potentialProjectValue),
          totalScore: Math.max(88, company.intelligence.totalScore),
          tier: 'High-priority target',
        },
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleSetFollowUpDays = (company: Company, daysFromNow: number) => {
    const targetDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (onUpdateCompany) {
      onUpdateCompany({
        ...company,
        nextFollowUpDate: targetDate,
        updatedAt: new Date().toISOString(),
      });
    }
    setFollowUpPickerCompanyId(null);
    setActiveMenuCompanyId(null);
  };

  const handleSetCustomFollowUp = (company: Company) => {
    if (!customDate) return;
    if (onUpdateCompany) {
      onUpdateCompany({
        ...company,
        nextFollowUpDate: customDate,
        updatedAt: new Date().toISOString(),
      });
    }
    setFollowUpPickerCompanyId(null);
    setActiveMenuCompanyId(null);
    setCustomDate('');
  };

  const handleCopyEmail = (company: Company) => {
    if (!company.procurementEmail) return;
    navigator.clipboard.writeText(company.procurementEmail);
    setCopiedId(company.id);
    setTimeout(() => {
      setCopiedId(null);
      setActiveMenuCompanyId(null);
    }, 1200);
  };

  return (
    <div className={`space-y-5 relative ${selectedIds.length > 1 ? 'pb-24' : ''}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Clients
        </h1>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-[#f8faff] focus:bg-white focus:outline-none focus:border-[#0e3aa9] focus:ring-1 focus:ring-[#0e3aa9] transition-all"
          />
        </div>
      </div>

      {/* Category Level Filter Options */}
      <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
        {/* Status Category Options */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-16 shrink-0">
            Status
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Active', 'Pending', 'Flagged'] as VendorCategory[]).map((category) => {
              const isSelected = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0e3aa9] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {categoryCounts[category]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Industry Category Level Filter Options */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-16 shrink-0">
            Industry
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {industryCategoryOptions.map((ind) => {
              const isSelected = selectedIndustryCategory === ind.key;
              return (
                <button
                  key={ind.key}
                  onClick={() => setSelectedIndustryCategory(ind.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{ind.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {ind.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs text-slate-500 font-mono">
            {filteredCompanies.length} / {companies.length}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleExportCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Download CSV for external reporting"
              aria-label="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#0e3aa9]" />
              <span>Download CSV{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}</span>
            </button>
            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#0e3aa9]" />
              <span>Import</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-xs"
            >
              <option value="ALL">All</option>
              <option value="Identified">Identified</option>
              <option value="Contacted">Contacted</option>
              <option value="Requirements Received">Requirements</option>
              <option value="Documents In Preparation">Preparation</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Evaluation">Evaluation</option>
              <option value="Approved">Approved</option>
              <option value="Conditionally Approved">Conditional</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-xs"
            >
              <option value="ALL">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Industry:</span>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-xs max-w-[160px] truncate"
            >
              <option value="ALL">All</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <span className="text-slate-500 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-xs"
            >
              <option value="name">Name</option>
              <option value="priority">Priority</option>
              <option value="progress">Checklist</option>
              <option value="followUp">Follow-up</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Simple Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8faff] border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredCompanies.length > 0 && selectedIds.length === filteredCompanies.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 accent-[#0e3aa9]"
                  />
                </th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 min-w-[130px]">Checklist</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Officer</th>
                <th className="py-2.5 px-3">Follow-up</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 px-4">
                    {companies.length === 0 ? (
                      <div className="max-w-md mx-auto text-center flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0e3aa9] mb-4 shadow-2xs">
                          <Upload className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                          No Client Companies Added Yet
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Your database is clean and active. Add corporate clients individually or bulk upload a CSV file to begin tracking 115-point registration checklists and procurement approvals.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
                          <button
                            type="button"
                            onClick={onOpenImportModal}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl transition-all shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Bulk Upload CSV</span>
                          </button>

                          <button
                            type="button"
                            onClick={onOpenAddModal}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Client</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Template</span>
                          </button>
                        </div>

                        {onSeedSample && (
                          <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-center">
                            <button
                              type="button"
                              onClick={onSeedSample}
                              className="text-[11px] text-slate-500 hover:text-[#0e3aa9] hover:underline transition-colors flex items-center gap-1"
                            >
                              <span>Need sample data to explore?</span>
                              <span className="font-semibold text-[#0e3aa9]">Load Demo Template (10 Clients)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-xs mx-auto text-center py-4">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <div className="text-xs font-semibold text-slate-800">No matching clients found</div>
                        <div className="text-[11px] text-slate-500 mt-1">Try clearing search terms or resetting category filters.</div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setActiveCategory('All');
                            setSelectedIndustryCategory('All');
                            setStatusFilter('ALL');
                            setPriorityFilter('ALL');
                            setIndustryFilter('ALL');
                          }}
                          className="mt-3 px-3 py-1 text-xs font-medium text-[#0e3aa9] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Reset Filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const progress = calculateCompanyChecklistProgress(c.checklist);
                  const isSelected = selectedIds.includes(c.id);
                  const isMenuOpen = activeMenuCompanyId === c.id;
                  const isFollowUpOpen = followUpPickerCompanyId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(c.id)}
                          className="rounded border-slate-300 accent-[#0e3aa9]"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onSelectCompany(c.id)}
                          className="font-bold text-slate-900 hover:text-[#0e3aa9] text-left block truncate max-w-xs transition-colors"
                        >
                          {c.name}
                        </button>
                        <div className="text-[11px] text-slate-400 truncate">
                          {c.industry}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span className={c.priority === 'High' ? 'text-rose-700 font-semibold' : 'text-slate-600'}>
                          {c.priority}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={c.registrationStatus}
                          onChange={(e) => onUpdateCompanyStatus(c.id, e.target.value as RegistrationStatus)}
                          className="text-[11px] font-medium py-0.5 px-1 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="Identified">Identified</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Requirements Received">Requirements</option>
                          <option value="Documents In Preparation">Preparation</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Under Evaluation">Evaluation</option>
                          <option value="Approved">Approved</option>
                          <option value="Conditionally Approved">Conditional</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 mb-0.5">
                          <span>{progress.overallPercentage}%</span>
                          <span className="text-slate-400">{progress.completedItems}/115</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0e3aa9] rounded-full"
                            style={{ width: `${progress.overallPercentage}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-[130px] truncate text-slate-700">
                        {c.procurementContact}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {c.assignedOfficer.split(' ')[0]}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        {c.nextFollowUpDate ? (
                          <button
                            type="button"
                            onClick={() => (onOpenScheduleModal ? onOpenScheduleModal(c) : setFollowUpPickerCompanyId(c.id))}
                            className="inline-flex items-center gap-1.5 hover:opacity-85 transition-opacity text-left cursor-pointer group"
                            title="Schedule Alert & Countdown"
                          >
                            <span className="font-mono text-slate-700 font-medium group-hover:text-[#0e3aa9]">
                              {c.nextFollowUpDate}
                            </span>
                            {(() => {
                              const cd = formatScheduleCountdown(c.nextFollowUpDate);
                              return (
                                <span
                                  className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-bold border ${
                                    cd.status === 'overdue'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                      : cd.status === 'today'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 font-extrabold'
                                      : cd.status === 'tomorrow'
                                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                                      : 'bg-blue-50 text-[#0e3aa9] border-blue-200/70'
                                  }`}
                                >
                                  {cd.text}
                                </span>
                              );
                            })()}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => (onOpenScheduleModal ? onOpenScheduleModal(c) : setFollowUpPickerCompanyId(c.id))}
                            className="text-slate-400 hover:text-[#0e3aa9] text-[10px] font-medium"
                          >
                            + Schedule
                          </button>
                        )}
                      </td>

                      {/* Row Actions with Win Button & Quick Actions Dropdown */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Win Client Status Button */}
                          {c.registrationStatus === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/90 rounded-lg">
                              <Trophy className="w-3 h-3 text-amber-500" />
                              <span>Won</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => (onOpenWinModal ? onOpenWinModal(c) : onUpdateCompanyStatus(c.id, 'Approved'))}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
                              title="Register as Approved Vendor (Win Client)"
                            >
                              <Trophy className="w-3 h-3 text-amber-300" />
                              <span>Win</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectCompany(c.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0e3aa9] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            View
                          </button>

                          {/* Quick Actions trigger button */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => {
                                if (activeMenuCompanyId === c.id) {
                                  setActiveMenuCompanyId(null);
                                  setFollowUpPickerCompanyId(null);
                                } else {
                                  setActiveMenuCompanyId(c.id);
                                  setFollowUpPickerCompanyId(null);
                                }
                              }}
                              title="Quick Actions"
                              className={`p-1 rounded-lg border transition-colors ${
                                isMenuOpen
                                  ? 'bg-[#0e3aa9] text-white border-[#0e3aa9]'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu Overlay & Card */}
                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => {
                                    setActiveMenuCompanyId(null);
                                    setFollowUpPickerCompanyId(null);
                                  }}
                                />

                                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200/90 rounded-xl shadow-xl z-30 py-1 text-left text-xs divide-y divide-slate-100 animate-fadeIn">
                                  {/* Menu Item 1: Schedule Follow-up */}
                                  <div className="p-1">
                                    <button
                                      onClick={() => setFollowUpPickerCompanyId(c.id)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-xs text-left"
                                    >
                                      <Calendar className="w-3.5 h-3.5 text-[#0e3aa9]" />
                                      <span>Schedule Follow-up</span>
                                    </button>

                                    {/* Inline Follow-up Picker Submenu */}
                                    {isFollowUpOpen && (
                                      <div className="mt-1 p-2 bg-[#f8faff] rounded-lg border border-slate-200 space-y-1.5">
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleSetFollowUpDays(c, 1)}
                                            className="flex-1 py-1 px-1 bg-white hover:bg-blue-50 border border-slate-200 rounded text-[10px] font-semibold text-slate-700"
                                          >
                                            Tomorrow
                                          </button>
                                          <button
                                            onClick={() => handleSetFollowUpDays(c, 3)}
                                            className="flex-1 py-1 px-1 bg-white hover:bg-blue-50 border border-slate-200 rounded text-[10px] font-semibold text-slate-700"
                                          >
                                            3 Days
                                          </button>
                                          <button
                                            onClick={() => handleSetFollowUpDays(c, 7)}
                                            className="flex-1 py-1 px-1 bg-white hover:bg-blue-50 border border-slate-200 rounded text-[10px] font-semibold text-slate-700"
                                          >
                                            1 Week
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="date"
                                            value={customDate}
                                            onChange={(e) => setCustomDate(e.target.value)}
                                            className="w-full p-1 text-[10px] border border-slate-200 rounded bg-white"
                                          />
                                          <button
                                            onClick={() => handleSetCustomFollowUp(c)}
                                            disabled={!customDate}
                                            className="p-1 bg-[#0e3aa9] hover:bg-[#0b2d84] text-white rounded text-[10px] disabled:opacity-40"
                                          >
                                            <Check className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Menu Item 2: Mark Urgent */}
                                  <div className="p-1">
                                    <button
                                      onClick={() => handleMarkUrgent(c)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors font-semibold text-xs text-left"
                                    >
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Mark Urgent</span>
                                    </button>
                                  </div>

                                  {/* Menu Item 3: Mark Approved */}
                                  <div className="p-1">
                                    <button
                                      onClick={() => {
                                        onUpdateCompanyStatus(c.id, 'Approved');
                                        setActiveMenuCompanyId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors font-medium text-xs text-left"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Mark Approved</span>
                                    </button>
                                  </div>

                                  {/* Menu Item 4: Copy Email */}
                                  {c.procurementEmail && (
                                    <div className="p-1">
                                      <button
                                        onClick={() => handleCopyEmail(c)}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-xs text-left"
                                      >
                                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                                        <span>
                                          {copiedId === c.id ? 'Copied!' : 'Copy Email'}
                                        </span>
                                      </button>
                                    </div>
                                  )}

                                  {/* Menu Item: Download CSV */}
                                  <div className="p-1">
                                    <button
                                      onClick={() => {
                                        setActiveMenuCompanyId(null);
                                        handleExportCsv(c);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-xs text-left"
                                      title="Download CSV report for this client"
                                    >
                                      <Download className="w-3.5 h-3.5 text-[#0e3aa9]" />
                                      <span>Download CSV</span>
                                    </button>
                                  </div>

                                  {/* Menu Item 5: Delete */}
                                  <div className="p-1">
                                    <button
                                      onClick={() => {
                                        setActiveMenuCompanyId(null);
                                        onDeleteCompany(c.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-rose-600 transition-colors text-xs text-left"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>{filteredCompanies.length} / {companies.length}</span>
          {selectedIds.length > 0 && <span className="text-[#0e3aa9] font-bold">{selectedIds.length} Selected</span>}
        </div>
      </div>

      {/* Persistent Bulk Action Toolbar - appears only when multiple rows are selected */}
      {selectedIds.length > 1 && (
        <div
          role="toolbar"
          aria-label="Bulk Action Toolbar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-2.5 px-4 sm:px-5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ring-1 ring-white/10"
        >
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg font-mono font-bold text-xs">
              {selectedIds.length} Selected
            </span>
            <span className="font-semibold text-slate-200 text-xs hidden sm:inline">
              Bulk Action Toolbar
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Action 1: Assign Representative */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => {
                  setIsAssignRepOpen(!isAssignRepOpen);
                  setIsBulkStatusOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all border shadow-xs cursor-pointer ${
                  isAssignRepOpen
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
                title="Assign representative to selected clients"
                aria-label="Assign Representative"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Assign Representative</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isAssignRepOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAssignRepOpen(false)}
                  />
                  <div className="absolute bottom-full mb-2 left-0 sm:right-0 sm:left-auto w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 p-2 space-y-1.5 text-xs animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-2 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                      <span>Assign Representative</span>
                      <button
                        type="button"
                        onClick={() => setIsAssignRepOpen(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                      {REPRESENTATIVE_PRESETS.map((rep) => (
                        <button
                          key={rep}
                          type="button"
                          onClick={() => handleExecuteBulkAssign(rep)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 hover:text-[#0e3aa9] transition-colors flex items-center justify-between text-xs font-medium cursor-pointer"
                        >
                          <span className="truncate">{rep}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Custom officer..."
                        value={customRepName}
                        onChange={(e) => setCustomRepName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customRepName.trim()) {
                            handleExecuteBulkAssign(customRepName.trim());
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0e3aa9]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customRepName.trim()) {
                            handleExecuteBulkAssign(customRepName.trim());
                          }
                        }}
                        disabled={!customRepName.trim()}
                        className="px-2 py-1 bg-[#0e3aa9] disabled:bg-slate-200 text-white font-semibold rounded-lg text-[11px] cursor-pointer disabled:cursor-not-allowed"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action 2: Bulk Update Status */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => {
                  setIsBulkStatusOpen(!isBulkStatusOpen);
                  setIsAssignRepOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all border shadow-xs cursor-pointer ${
                  isBulkStatusOpen
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
                title="Bulk update registration status for selected clients"
                aria-label="Bulk Update Status"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bulk Update Status</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isBulkStatusOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsBulkStatusOpen(false)}
                  />
                  <div className="absolute bottom-full mb-2 left-0 sm:right-0 sm:left-auto w-56 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 p-2 space-y-1 text-xs animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-2 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                      <span>Target Registration Status</span>
                      <button
                        type="button"
                        onClick={() => setIsBulkStatusOpen(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-0.5 max-h-56 overflow-y-auto">
                      {ALL_REGISTRATION_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleBulkStatusChange(status)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center justify-between text-xs font-medium cursor-pointer"
                        >
                          <span>{status}</span>
                          <Check className="w-3 h-3 text-slate-300 hover:text-emerald-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action 3: Download Selection */}
            <button
              type="button"
              onClick={handleDownloadSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer border border-blue-400/30"
              title="Download CSV export for selected clients only"
              aria-label="Download Selection"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Selection</span>
            </button>

            {/* Delete Selection */}
            <button
              type="button"
              onClick={handleExecuteBulkDelete}
              className="p-1.5 bg-rose-500/80 hover:bg-rose-600 rounded-xl transition-colors text-white cursor-pointer"
              title="Delete selected clients"
              aria-label="Delete Selection"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                setIsAssignRepOpen(false);
                setIsBulkStatusOpen(false);
              }}
              className="p-1.5 hover:bg-white/15 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer"
              title="Clear Selection"
              aria-label="Clear Selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
