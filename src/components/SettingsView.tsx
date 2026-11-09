import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Search,
  Building2,
  Users,
  Database,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Company } from '../types';
import {
  getIndustryCategory,
  validateIndustryTypeName,
  IndustryCategory,
  DEFAULT_INDUSTRY_TYPES,
} from '../utils/rules';

interface SettingsViewProps {
  companies: Company[];
  industryTypes: string[];
  onAddIndustryType: (name: string) => Promise<boolean>;
  onUpdateIndustryType: (oldName: string, newName: string, cascade: boolean) => Promise<boolean>;
  onDeleteIndustryType: (name: string) => Promise<boolean>;
  onResetIndustryTypes: () => Promise<boolean>;
  onFilterByIndustry?: (industry: string) => void;
  onClearDatabase?: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companies,
  industryTypes,
  onAddIndustryType,
  onUpdateIndustryType,
  onDeleteIndustryType,
  onResetIndustryTypes,
  onFilterByIndustry,
  onClearDatabase,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'industries' | 'officers' | 'database'>('industries');

  // Industry creation state
  const [newIndustryName, setNewIndustryName] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Bulk add modal/input state
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  // Industry search/filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Editing industry state
  const [editingOldName, setEditingOldName] = useState<string | null>(null);
  const [editingNewName, setEditingNewName] = useState('');
  const [cascadeToCompanies, setCascadeToCompanies] = useState(true);

  // Industry usage map (counts how many companies use each industry)
  const industryUsageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of companies) {
      if (c.industry) {
        const key = c.industry.trim().toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [companies]);

  // Filtered industry list
  const filteredIndustries = useMemo(() => {
    return industryTypes.filter((ind) => {
      const matchesSearch = ind.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const cat = getIndustryCategory(ind);
      const matchesCat = categoryFilter === 'All' || cat === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [industryTypes, searchQuery, categoryFilter]);

  // Categories present in the current industries
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    industryTypes.forEach((ind) => set.add(getIndustryCategory(ind)));
    return Array.from(set).sort();
  }, [industryTypes]);

  // Handlers
  const handleCreateIndustry = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    const validation = validateIndustryTypeName(newIndustryName, industryTypes);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid industry name');
      return;
    }

    setIsSubmittingNew(true);
    const success = await onAddIndustryType(newIndustryName.trim());
    setIsSubmittingNew(false);

    if (success) {
      setNewIndustryName('');
      onShowToast(`Added industry: "${newIndustryName.trim()}"`);
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (lines.length === 0) {
      onShowToast('Please provide at least one industry type.');
      return;
    }

    let addedCount = 0;
    for (const item of lines) {
      const val = validateIndustryTypeName(item, industryTypes);
      if (val.valid) {
        await onAddIndustryType(item);
        addedCount++;
      }
    }

    setBulkInput('');
    setIsBulkAddOpen(false);
    onShowToast(`Successfully added ${addedCount} new industry types!`);
  };

  const handleStartEdit = (name: string) => {
    setEditingOldName(name);
    setEditingNewName(name);
    setCascadeToCompanies(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOldName || !editingNewName.trim()) return;
    const trimmed = editingNewName.trim();

    if (trimmed.toLowerCase() !== editingOldName.toLowerCase()) {
      const validation = validateIndustryTypeName(trimmed, industryTypes);
      if (!validation.valid) {
        onShowToast(validation.error || 'Invalid name');
        return;
      }
    }

    const success = await onUpdateIndustryType(editingOldName, trimmed, cascadeToCompanies);
    if (success) {
      setEditingOldName(null);
      setEditingNewName('');
      onShowToast(`Updated industry to "${trimmed}"`);
    }
  };

  const handleDelete = async (name: string) => {
    const usageCount = industryUsageMap.get(name.toLowerCase().trim()) || 0;
    let message = `Are you sure you want to remove "${name}" from the industry types list?`;
    if (usageCount > 0) {
      message = `Notice: ${usageCount} ${usageCount === 1 ? 'client company' : 'client companies'} currently belong to "${name}". Deleting it will remove it from the preset list, but existing company records will retain their data. Proceed?`;
    }

    if (window.confirm(message)) {
      const success = await onDeleteIndustryType(name);
      if (success) {
        onShowToast(`Removed "${name}" from industry types`);
      }
    }
  };

  const handleResetPresets = async () => {
    if (window.confirm('Reset industry types back to standard industrial presets? Any custom additions will be restored to defaults.')) {
      const success = await onResetIndustryTypes();
      if (success) {
        onShowToast('Restored standard industrial presets');
      }
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      companiesCount: companies.length,
      companies,
      industryTypes,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `innovista_vendorhub_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Exported database backup JSON');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-[#0e3aa9]" />
            <span>Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure industry sectors, procurement officers, and database settings.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('industries')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'industries'
                ? 'bg-white text-[#0e3aa9] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Industry Types ({industryTypes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('officers')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'officers'
                ? 'bg-white text-[#0e3aa9] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Representatives
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'database'
                ? 'bg-white text-[#0e3aa9] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Database
          </button>
        </div>
      </div>

      {/* Tab 1: Industry Types Management */}
      {activeTab === 'industries' && (
        <div className="space-y-6">
          {/* Add New Industry Form Card */}
          <div className="bg-[#f8faff] border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#0e3aa9]" />
                  <span>Add Industry Type</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Define new industry categories for client qualification, bulk uploads, and automated sector matching.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBulkAddOpen(!isBulkAddOpen)}
                className="text-xs font-semibold text-[#0e3aa9] hover:underline transition-colors self-start sm:self-auto"
              >
                {isBulkAddOpen ? 'Single Add' : '+ Bulk Add Industries'}
              </button>
            </div>

            {isBulkAddOpen ? (
              <div className="space-y-3 pt-2 border-t border-slate-200/60">
                <label className="block text-xs font-semibold text-slate-700">
                  Paste Multiple Industry Types (separated by commas or new lines):
                </label>
                <textarea
                  rows={3}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="e.g. Renewable Energy & Solar, Aviation Infrastructure, Food Processing & Cold Storage"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#0e3aa9] focus:ring-1 focus:ring-[#0e3aa9]"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkAdd}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-lg transition-colors shadow-xs"
                  >
                    Import Industries
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkAddOpen(false);
                      setBulkInput('');
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateIndustry} className="space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newIndustryName}
                      onChange={(e) => {
                        setNewIndustryName(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      placeholder="e.g. Renewable Energy & Solar Parks, Automotive Assembly, Aviation..."
                      className="w-full pl-3 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#0e3aa9] focus:ring-1 focus:ring-[#0e3aa9] transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingNew || !newIndustryName.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Industry</span>
                  </button>
                </div>

                {validationError && (
                  <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationError}</span>
                  </p>
                )}

                {newIndustryName.trim() && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <span>Auto-classified sector:</span>
                    <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                      {getIndustryCategory(newIndustryName)}
                    </span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter industry types..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0e3aa9] transition-all"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none shrink-0"
              >
                <option value="All">All Sectors</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                {filteredIndustries.length} of {industryTypes.length}
              </span>
              <button
                type="button"
                onClick={handleResetPresets}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                title="Restore default industrial presets"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Industry Types List */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
            {filteredIndustries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No industry types match your filter criteria.
              </div>
            ) : (
              filteredIndustries.map((industry, index) => {
                const isEditing = editingOldName === industry;
                const usageCount = industryUsageMap.get(industry.toLowerCase().trim()) || 0;
                const category = getIndustryCategory(industry);

                return (
                  <div
                    key={industry}
                    className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingNewName}
                            onChange={(e) => setEditingNewName(e.target.value)}
                            className="flex-1 py-1 px-2.5 text-xs font-semibold border border-blue-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0e3aa9]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="p-1.5 text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-lg transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOldName(null)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {usageCount > 0 && (
                          <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cascadeToCompanies}
                              onChange={(e) => setCascadeToCompanies(e.target.checked)}
                              className="rounded border-slate-300 accent-[#0e3aa9]"
                            />
                            <span>
                              Update industry on {usageCount} existing {usageCount === 1 ? 'client' : 'clients'}
                            </span>
                          </label>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[11px] font-mono text-slate-400 w-6 shrink-0 text-right">
                            {index + 1}.
                          </span>

                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 truncate">
                              {industry}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {category}
                              </span>
                              {usageCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => onFilterByIndustry && onFilterByIndustry(industry)}
                                  className="text-[10px] text-[#0e3aa9] hover:underline font-medium flex items-center gap-0.5"
                                  title="View companies in this industry"
                                >
                                  <span>{usageCount} {usageCount === 1 ? 'client' : 'clients'}</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">0 clients</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(industry)}
                            className="p-1.5 text-slate-500 hover:text-[#0e3aa9] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit industry name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(industry)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete industry type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Procurement Representatives */}
      {activeTab === 'officers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0e3aa9]" />
              <span>Assigned Procurement Officers</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              INNOVISTA business development and procurement officers managing client registration accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              {
                name: 'Ranil Jayasuriya',
                title: 'Senior BD & SCM Manager',
                department: 'Enterprise BD',
                email: 'ranil.j@innovistametal.com',
                clientsCount: companies.filter((c) => c.assignedOfficer.includes('Ranil')).length,
              },
              {
                name: 'Kasun Wickrama',
                title: 'Business Development Executive',
                department: 'Commercial & Tenders',
                email: 'kasun.w@innovistametal.com',
                clientsCount: companies.filter((c) => c.assignedOfficer.includes('Kasun')).length,
              },
              {
                name: 'Nadeeka Senanayake',
                title: 'Business Development Lead',
                department: 'Industrial Projects',
                email: 'nadeeka.s@innovistametal.com',
                clientsCount: companies.filter((c) => c.assignedOfficer.includes('Nadeeka')).length,
              },
              {
                name: 'General BD Cell',
                title: 'Central Procurement Desk',
                department: 'Tender Operations',
                email: 'tenders@innovistametal.com',
                clientsCount: companies.filter((c) => c.assignedOfficer.includes('General')).length,
              },
            ].map((rep) => (
              <div
                key={rep.name}
                className="bg-[#f8faff] border border-slate-200/80 rounded-xl p-4 flex items-start justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{rep.name}</div>
                  <div className="text-[11px] text-[#0e3aa9] font-medium">{rep.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{rep.email}</div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {rep.clientsCount} {rep.clientsCount === 1 ? 'Client' : 'Clients'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Database & Backup Management */}
      {activeTab === 'database' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0e3aa9]" />
              <span>Database & System Persistence</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Production status of file-backed JSON persistence and database operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#f8faff] border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Companies
              </div>
              <div className="text-xl font-bold font-mono text-[#0e3aa9] mt-1">
                {companies.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Stored in data/db.json</div>
            </div>

            <div className="bg-[#f8faff] border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Industry Types
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {industryTypes.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Configured in settings</div>
            </div>

            <div className="bg-[#f8faff] border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Storage Engine
              </div>
              <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>JSON REST API</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Atomic file synchronization</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#0e3aa9]" />
              <span>Export Full Database Backup (JSON)</span>
            </button>

            {onClearDatabase && (
              <button
                type="button"
                onClick={onClearDatabase}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Database to Clean State</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
