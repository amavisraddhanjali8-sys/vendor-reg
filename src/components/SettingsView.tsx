import React, { useState, useMemo, useEffect } from 'react';
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
  Shield,
  KeyRound,
  Lock,
  Smartphone,
  Copy,
  CheckCheck,
  UserPlus,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { Company, UserProfile, TwoFactorSetupData } from '../types';
import {
  getIndustryCategory,
  validateIndustryTypeName,
  IndustryCategory,
  DEFAULT_INDUSTRY_TYPES,
} from '../utils/rules';
import { api } from '../services/api';

interface SettingsViewProps {
  companies: Company[];
  industryTypes: string[];
  currentUser?: UserProfile | null;
  onAddIndustryType: (name: string) => Promise<boolean>;
  onUpdateIndustryType: (oldName: string, newName: string, cascade: boolean) => Promise<boolean>;
  onDeleteIndustryType: (name: string) => Promise<boolean>;
  onResetIndustryTypes: () => Promise<boolean>;
  onFilterByIndustry?: (industry: string) => void;
  onClearDatabase?: () => void;
  onShowToast: (msg: string) => void;
  onUserUpdated?: (user: UserProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companies,
  industryTypes,
  currentUser,
  onAddIndustryType,
  onUpdateIndustryType,
  onDeleteIndustryType,
  onResetIndustryTypes,
  onFilterByIndustry,
  onClearDatabase,
  onShowToast,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'industries' | 'officers' | 'security' | 'database'>('industries');

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

  // -------------------------------------------------------------
  // Security & User Management State
  // -------------------------------------------------------------
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Change own password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingOwnPassword, setIsChangingOwnPassword] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Admin Change Password Modal State
  const [adminTargetUser, setAdminTargetUser] = useState<UserProfile | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [isAdminSubmittingPass, setIsAdminSubmittingPass] = useState(false);

  // Admin Create User Modal State
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'officer'>('officer');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // 2FA Google Authenticator Setup State
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [totpSetupData, setTotpSetupData] = useState<TwoFactorSetupData | null>(null);
  const [totpVerificationCode, setTotpVerificationCode] = useState('');
  const [isGenerating2FA, setIsGenerating2FA] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch users when on Security tab
  useEffect(() => {
    if (activeTab === 'security' && currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab, currentUser]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersList = await api.getUsers();
      setAllUsers(usersList);
    } catch (err: any) {
      console.warn('Could not load users list:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

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

  // Handlers for Industries
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
    onShowToast(`Imported ${addedCount} new industry types`);
  };

  const handleStartEdit = (ind: string) => {
    setEditingOldName(ind);
    setEditingNewName(ind);
    setCascadeToCompanies(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOldName) return;

    if (!editingNewName.trim()) {
      onShowToast('Industry name cannot be empty');
      return;
    }

    if (editingNewName.trim().toLowerCase() === editingOldName.toLowerCase()) {
      setEditingOldName(null);
      return;
    }

    const success = await onUpdateIndustryType(editingOldName, editingNewName.trim(), cascadeToCompanies);
    if (success) {
      onShowToast(`Renamed "${editingOldName}" to "${editingNewName.trim()}"`);
      setEditingOldName(null);
    }
  };

  const handleDelete = async (ind: string) => {
    const usage = industryUsageMap.get(ind.toLowerCase()) || 0;
    if (usage > 0) {
      const confirmDelete = window.confirm(
        `"${ind}" is currently assigned to ${usage} company(ies). Deleting it will keep those companies assigned, but removes it from the industry options list. Proceed?`
      );
      if (!confirmDelete) return;
    }

    const success = await onDeleteIndustryType(ind);
    if (success) {
      onShowToast(`Deleted industry "${ind}"`);
    }
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(
      'Reset all industry types to the standard 16 presets? Existing client records will not be deleted.'
    );
    if (confirmReset) {
      const success = await onResetIndustryTypes();
      if (success) {
        onShowToast('Restored standard industrial presets');
      }
    }
  };

  // -------------------------------------------------------------
  // Handlers for Security & Password Management
  // -------------------------------------------------------------
  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      onShowToast('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('New password and confirmation do not match');
      return;
    }

    setIsChangingOwnPassword(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        onShowToast('Your password was updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        onShowToast(res.message || 'Failed to update password');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error updating password');
    } finally {
      setIsChangingOwnPassword(false);
    }
  };

  // Admin Change Password for Any Username
  const handleAdminSubmitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTargetUser) return;
    if (adminNewPassword.length < 6) {
      onShowToast('Password must be at least 6 characters');
      return;
    }

    setIsAdminSubmittingPass(true);
    try {
      const res = await api.changeUserPassword(adminTargetUser.id, adminNewPassword);
      if (res.success) {
        onShowToast(`Password updated for ${adminTargetUser.username}!`);
        setAdminTargetUser(null);
        setAdminNewPassword('');
        fetchUsers();
      } else {
        onShowToast(res.message || 'Failed to change user password');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to change user password');
    } finally {
      setIsAdminSubmittingPass(false);
    }
  };

  // Admin Delete / Clear Password for Username
  const handleAdminDeletePassword = async (user: UserProfile) => {
    const confirm = window.confirm(
      `Are you sure you want to delete the password for "${user.username}"? The user will have no active password and must sign in with Google or receive a new password.`
    );
    if (!confirm) return;

    try {
      const res = await api.deleteUserPassword(user.id);
      if (res.success) {
        onShowToast(`Password deleted for ${user.username}`);
        fetchUsers();
      } else {
        onShowToast(res.message || 'Failed to delete password');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete password');
    }
  };

  // Admin Delete User Account
  const handleAdminDeleteUser = async (user: UserProfile) => {
    const confirm = window.confirm(
      `Permanently delete account for "${user.username}" (${user.email})? This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      const res = await api.deleteUser(user.id);
      if (res.success) {
        onShowToast(`User ${user.username} deleted`);
        fetchUsers();
      } else {
        onShowToast(res.message || 'Failed to delete user');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete user');
    }
  };

  // Admin Create User
  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserEmail.trim()) {
      onShowToast('Username and email are required');
      return;
    }

    setIsCreatingUser(true);
    try {
      await api.createUser({
        username: newUsername.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim() || undefined,
        role: newUserRole,
        displayName: newUserDisplayName.trim() || newUsername.trim(),
      });
      onShowToast(`User "${newUsername.trim()}" created successfully!`);
      setIsCreateUserOpen(false);
      setNewUsername('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserDisplayName('');
      fetchUsers();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Google Authenticator Manual Setup
  const handleOpen2FASetup = async () => {
    setIsGenerating2FA(true);
    try {
      const setup = await api.generate2FASetup();
      setTotpSetupData(setup);
      setTotpVerificationCode('');
      setCopiedKey(false);
      setIs2FAModalOpen(true);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to initiate Google Authenticator setup');
    } finally {
      setIsGenerating2FA(false);
    }
  };

  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpSetupData || totpVerificationCode.length < 6) return;

    setIsVerifying2FA(true);
    try {
      const res = await api.verifyAndEnable2FA(totpSetupData.secret, totpVerificationCode);
      if (res.success) {
        onShowToast('Google Authenticator 2FA enabled successfully!');
        setIs2FAModalOpen(false);
        if (currentUser && onUserUpdated) {
          onUserUpdated({ ...currentUser, twoFactorEnabled: true });
        }
        if (activeTab === 'security' && currentUser?.role === 'admin') {
          fetchUsers();
        }
      } else {
        onShowToast(res.message || 'Verification failed');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Verification failed');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    const confirm = window.confirm(
      'Are you sure you want to disable Google Authenticator 2FA on your account?'
    );
    if (!confirm) return;

    try {
      const res = await api.disable2FA();
      if (res.success) {
        onShowToast('Google Authenticator 2FA disabled');
        if (currentUser && onUserUpdated) {
          onUserUpdated({ ...currentUser, twoFactorEnabled: false });
        }
        if (activeTab === 'security' && currentUser?.role === 'admin') {
          fetchUsers();
        }
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to disable 2FA');
    }
  };

  const copyManualSecretKey = () => {
    if (totpSetupData?.manualKey) {
      navigator.clipboard.writeText(totpSetupData.manualKey);
      setCopiedKey(true);
      onShowToast('Manual secret key copied to clipboard!');
      setTimeout(() => setCopiedKey(false), 3000);
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
            Configure industry sectors, user passwords, Google Authenticator 2FA, and PostgreSQL persistence.
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
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-white text-[#0e3aa9] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security & Passwords</span>
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
            PostgreSQL DB
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
              <form onSubmit={handleCreateIndustry} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newIndustryName}
                      onChange={(e) => {
                        setNewIndustryName(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      placeholder="e.g. Renewable Energy & Solar Parks, Power Generation & Utilities"
                      className={`w-full text-xs px-3.5 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        validationError
                          ? 'border-rose-300 focus:ring-rose-200 text-rose-900'
                          : 'border-slate-200 focus:border-[#0e3aa9] focus:ring-sky-100'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingNew || !newIndustryName.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-2xs shrink-0"
                  >
                    {isSubmittingNew ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Add Industry</span>
                  </button>
                </div>

                {validationError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Search, Filter, and Industry Count Strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search industry names..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0e3aa9]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:border-[#0e3aa9]"
                >
                  <option value="All">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleReset}
                  title="Reset to 16 default industry types"
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Industry List */}
            <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
              {filteredIndustries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No industry types match your search criteria.
                </div>
              ) : (
                filteredIndustries.map((ind) => {
                  const usageCount = industryUsageMap.get(ind.toLowerCase()) || 0;
                  const isEditing = editingOldName === ind;
                  const category = getIndustryCategory(ind);

                  return (
                    <div
                      key={ind}
                      className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                        isEditing ? 'bg-sky-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                          <input
                            type="text"
                            value={editingNewName}
                            onChange={(e) => setEditingNewName(e.target.value)}
                            className="text-xs px-2.5 py-1.5 border border-[#0e3aa9] rounded-lg bg-white flex-1 focus:outline-none"
                            autoFocus
                          />
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-600 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cascadeToCompanies}
                              onChange={(e) => setCascadeToCompanies(e.target.checked)}
                              className="rounded text-[#0e3aa9] focus:ring-0"
                            />
                            <span>Update on {usageCount} existing client(s)</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Save changes"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingOldName(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-[#0e3aa9] shrink-0" />
                            <span className="text-xs font-semibold text-slate-800 truncate">{ind}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                              {category}
                            </span>
                            {usageCount > 0 && (
                              <button
                                type="button"
                                onClick={() => onFilterByIndustry && onFilterByIndustry(ind)}
                                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                                title="View companies in this industry"
                              >
                                {usageCount} {usageCount === 1 ? 'company' : 'companies'}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(ind)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Rename industry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ind)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete industry"
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
        </div>
      )}

      {/* Tab 2: Security & Password Management */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Section A: Current User Account & Google Authenticator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0e3aa9]" />
                  <span>My Security & Authentication</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Manage your personal login password and Google Authenticator 2FA setup.
                </p>
              </div>

              {currentUser && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">Active User:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-[#0e3aa9] text-xs font-bold font-mono">
                    {currentUser.username}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {currentUser.role}
                  </span>
                </div>
              )}
            </div>

            {/* Google Authenticator Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50/70 to-indigo-50/50 border border-sky-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-sky-200 flex items-center justify-center text-[#0e3aa9] shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">Google Authenticator (2FA)</h3>
                    {currentUser?.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Secure your account with 6-digit Time-Based One-Time Passwords (TOTP) generated on your phone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {currentUser?.twoFactorEnabled ? (
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpen2FASetup}
                    disabled={isGenerating2FA}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    {isGenerating2FA ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                    <span>Setup Google Authenticator Manually</span>
                  </button>
                )}
              </div>
            </div>

            {/* Change Own Password Form */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-3">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Change My Password</span>
              </h3>
              <form onSubmit={handleChangeOwnPassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0e3aa9]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">New Password (min 6 chars)</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0e3aa9]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Confirm New Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0e3aa9]"
                    />
                    <button
                      type="submit"
                      disabled={isChangingOwnPassword || !newPassword}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-xl shrink-0 transition"
                    >
                      {isChangingOwnPassword ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Section B: Admin User & Password Management (Admin Only) */}
          {currentUser?.role === 'admin' ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#0e3aa9]" />
                      <span>User & Password Administration</span>
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      Admin Privilege Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Only administrators can change or delete passwords for any username, and create new system user accounts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-xl shadow-xs transition self-start sm:self-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Create User</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Email & Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Password</th>
                      <th className="px-4 py-3">2FA</th>
                      <th className="px-4 py-3 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                          Loading users from PostgreSQL...
                        </td>
                      </tr>
                    ) : allUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          No users registered in database.
                        </td>
                      </tr>
                    ) : (
                      allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-bold font-mono text-slate-900">
                            {u.username}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{u.displayName || u.username}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {(u as any).hasPassword ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">None (Google Only)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {u.twoFactorEnabled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                2FA Active
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Off</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Change Password button (Admin only) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminTargetUser(u);
                                  setAdminNewPassword('');
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-[#0e3aa9] hover:bg-sky-50 rounded-lg border border-sky-100 transition"
                                title="Change user password"
                              >
                                Change Pass
                              </button>

                              {/* Delete Password button (Admin only) */}
                              <button
                                type="button"
                                onClick={() => handleAdminDeletePassword(u)}
                                className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded-lg border border-amber-200 transition"
                                title="Delete user password"
                              >
                                Clear Pass
                              </button>

                              {/* Delete User button */}
                              {u.username !== 'admin' && u.id !== currentUser.id && (
                                <button
                                  type="button"
                                  onClick={() => handleAdminDeleteUser(u)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete user account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              User password administration is restricted to System Administrators.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Representatives */}
      {activeTab === 'officers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0e3aa9]" />
              <span>Procurement Officers & Representatives</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              INNOVISTA team members assigned to lead qualification and registration submissions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'Kavindu Perera', title: 'Senior SCM Lead', email: 'kavindu@innovista.lk' },
              { name: 'Tharindu Silva', title: 'Facade Engineering Lead', email: 'tharindu@innovista.lk' },
              { name: 'Naveen Jayawardena', title: 'Tendering & Estimating Manager', email: 'naveen@innovista.lk' },
              { name: 'Sachini Fernando', title: 'QA/QC Compliance Auditor', email: 'sachini@innovista.lk' },
              { name: 'General SCM Desk', title: 'Default Intake Queue', email: 'procurement@innovista.lk' },
            ].map((officer) => {
              const assignedCount = companies.filter((c) => c.assignedOfficer === officer.name).length;
              return (
                <div key={officer.name} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                  <div className="font-bold text-xs text-slate-900">{officer.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{officer.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{officer.email}</div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Active Accounts:</span>
                    <span className="font-bold text-[#0e3aa9] font-mono">{assignedCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Database Persistence */}
      {activeTab === 'database' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0e3aa9]" />
              <span>PostgreSQL Database & System Persistence</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Production status of Cloud SQL PostgreSQL relational storage with Drizzle ORM.
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
              <div className="text-[10px] text-slate-400 mt-0.5">Stored in PostgreSQL table</div>
            </div>

            <div className="bg-[#f8faff] border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Industry Types
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {industryTypes.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Configured in settings table</div>
            </div>

            <div className="bg-[#f8faff] border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Storage Engine
              </div>
              <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>PostgreSQL (Cloud SQL)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Drizzle ORM Connection Pool</div>
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

      {/* ----------------------------------------------------------- */}
      {/* MODAL 1: Setup Google Authenticator Manually                */}
      {/* ----------------------------------------------------------- */}
      {is2FAModalOpen && totpSetupData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIs2FAModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0e3aa9] flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Setup Google Authenticator</h3>
                <p className="text-xs text-slate-500">Manual Key Entry or QR Code Scan</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step 1: Manual Secret Key Entry */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Manual Setup Key (Enter in App)
                  </span>
                  <button
                    type="button"
                    onClick={copyManualSecretKey}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0e3aa9] hover:underline"
                  >
                    {copiedKey ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className="font-mono text-sm tracking-wider font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 select-all break-all text-center">
                  {totpSetupData.manualKey}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                  <div>Account Name: <span className="font-semibold text-slate-700">{totpSetupData.accountName}</span></div>
                  <div>Type: <span className="font-semibold text-slate-700">Time-based (TOTP)</span></div>
                </div>
              </div>

              {/* Step 2: Or scan QR Code */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                <img
                  src={totpSetupData.qrCodeUrl}
                  alt="Google Authenticator QR Code"
                  className="w-28 h-28 rounded-lg border border-slate-200 shadow-2xs bg-white shrink-0"
                />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <p className="font-semibold text-slate-900 mb-1">Instructions:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                    <li>Open <strong>Google Authenticator</strong> on your phone.</li>
                    <li>Tap <strong>+</strong> and select <strong>'Enter a setup key'</strong> (or scan the QR code).</li>
                    <li>Paste the manual key above and tap <strong>Add</strong>.</li>
                    <li>Enter the generated 6-digit code below to activate.</li>
                  </ol>
                </div>
              </div>

              {/* Step 3: Enter 6-digit verification code */}
              <form onSubmit={handleVerifyAndEnable2FA} className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-800">
                  Enter 6-Digit Code from Google Authenticator:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={totpVerificationCode}
                    onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.4em] font-mono text-lg py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#0e3aa9]"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying2FA || totpVerificationCode.length < 6}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] disabled:opacity-40 rounded-xl shrink-0 transition"
                  >
                    {isVerifying2FA ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 2: Admin Change User Password                         */}
      {/* ----------------------------------------------------------- */}
      {adminTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setAdminTargetUser(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Password (Admin)</h3>
                <p className="text-xs text-slate-500">
                  Target Username: <span className="font-mono font-bold text-purple-700">{adminTargetUser.username}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminSubmitPasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password for {adminTargetUser.username}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0e3aa9]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminTargetUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdminSubmittingPass || adminNewPassword.length < 6}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] disabled:opacity-40 rounded-xl shadow-xs transition"
                >
                  {isAdminSubmittingPass ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 3: Admin Create User                                  */}
      {/* ----------------------------------------------------------- */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0e3aa9] flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create New User Account</h3>
                <p className="text-xs text-slate-500">Admin provisioning with role & password</p>
              </div>
            </div>

            <form onSubmit={handleAdminCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. tharindu_silva"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0e3aa9]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. tharindu@innovista.lk"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0e3aa9]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Leave blank for Google Sign-In only, or enter password"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0e3aa9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'officer')}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0e3aa9]"
                  >
                    <option value="officer">Procurement Officer</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newUserDisplayName}
                    onChange={(e) => setNewUserDisplayName(e.target.value)}
                    placeholder="Full name"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0e3aa9]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser || !newUsername.trim() || !newUserEmail.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] disabled:opacity-40 rounded-xl shadow-xs transition"
                >
                  {isCreatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
