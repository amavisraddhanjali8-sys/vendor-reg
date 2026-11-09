import React, { useState, useEffect } from 'react';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CompanyListView } from './components/CompanyListView';
import { PipelineBoardView } from './components/PipelineBoardView';
import { CompanyDetailWorkspace } from './components/CompanyDetailWorkspace';
import { CsvImportModal } from './components/CsvImportModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AddCompanyModal } from './components/AddCompanyModal';
import { WinClientModal } from './components/WinClientModal';
import { ScheduleAlertModal } from './components/ScheduleAlertModal';
import { Company, NotificationLog, RegistrationStatus } from './types';
import { api } from './services/api';
import {
  recordClientWin,
  formatScheduleCountdown,
  getUpcomingScheduleAlerts,
  DEFAULT_INDUSTRY_TYPES,
} from './utils/rules';
import { Check, X, Clock, Trophy, Calendar, Bell, Database, RefreshCw, Trash2, Sparkles, Sliders } from 'lucide-react';

export default function App() {
  // Database State - Clean initialization (no dummy data)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [industryTypes, setIndustryTypes] = useState<string[]>(DEFAULT_INDUSTRY_TYPES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'healthy' | 'syncing' | 'offline'>('syncing');

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState<{
    isOpen: boolean;
    initialCompanyId?: string;
  }>({ isOpen: false });

  // Win Client & Schedule Modals State
  const [winModalCompany, setWinModalCompany] = useState<Company | null>(null);
  const [scheduleModalCompany, setScheduleModalCompany] = useState<Company | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Initial Load from REST Database API
  useEffect(() => {
    // Purge legacy v1 localStorage keys to ensure clean start without dummy data
    try {
      localStorage.removeItem('innovista_vendorhub_companies_v1');
      localStorage.removeItem('innovista_vendorhub_notifications_v1');
    } catch {
      // ignore
    }

    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const [loadedCompanies, loadedNotifications, loadedIndustries] = await Promise.all([
          api.getCompanies(),
          api.getNotifications(),
          api.getIndustryTypes(),
        ]);
        if (isMounted) {
          setCompanies(loadedCompanies);
          setNotifications(loadedNotifications);
          if (Array.isArray(loadedIndustries) && loadedIndustries.length > 0) {
            setIndustryTypes(loadedIndustries);
          }
          setDbStatus('healthy');
        }
      } catch (err) {
        console.error('Failed to load database records:', err);
        if (isMounted) {
          setDbStatus('offline');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Selected company object
  const currentSelectedCompany = companies.find((c) => c.id === selectedCompanyId);

  // Handlers with REST Database API Integration
  const handleUpdateCompany = (updated: Company) => {
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    api.updateCompany(updated.id, updated).catch((err) => {
      console.error('API update company failed:', err);
    });
    showToast(`Updated record for ${updated.name}`);
  };

  const handleDeleteCompany = (companyId: string) => {
    const comp = companies.find((c) => c.id === companyId);
    if (!comp) return;
    if (window.confirm(`Are you sure you want to remove ${comp.name} from the database?`)) {
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      if (selectedCompanyId === companyId) setSelectedCompanyId(null);
      api.deleteCompany(companyId).catch((err) => {
        console.error('API delete company failed:', err);
      });
      showToast(`Removed ${comp.name}`);
    }
  };

  const handleUpdateCompanyStatus = (companyId: string, status: RegistrationStatus) => {
    const isApproved = status === 'Approved';
    let targetUpdated: Company | null = null;
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id === companyId) {
          targetUpdated = {
            ...c,
            registrationStatus: status,
            approval: {
              ...c.approval,
              status: isApproved ? 'Approved' : c.approval.status,
              approvalDate: isApproved ? new Date().toISOString().slice(0, 10) : c.approval.approvalDate,
            },
            updatedAt: new Date().toISOString(),
          };
          return targetUpdated;
        }
        return c;
      })
    );

    if (targetUpdated) {
      api.updateCompany(companyId, targetUpdated).catch((err) => {
        console.error('API status update failed:', err);
      });
    }
    showToast(`Status updated to ${status}`);
  };

  const handleBulkUpdateStatus = (companyIds: string[], status: RegistrationStatus) => {
    if (companyIds.length === 0) return;
    const isApproved = status === 'Approved';
    setCompanies((prev) =>
      prev.map((c) => {
        if (companyIds.includes(c.id)) {
          return {
            ...c,
            registrationStatus: status,
            approval: {
              ...c.approval,
              status: isApproved ? 'Approved' : c.approval.status,
              approvalDate: isApproved ? new Date().toISOString().slice(0, 10) : c.approval.approvalDate,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    api.bulkUpdateStatus(companyIds, status).catch((err) => {
      console.error('API bulk status update failed:', err);
    });
    showToast(`Updated ${companyIds.length} client companies to ${status}`);
  };

  const handleBulkAssignOfficer = (companyIds: string[], officerName: string) => {
    if (companyIds.length === 0 || !officerName) return;
    setCompanies((prev) =>
      prev.map((c) => {
        if (companyIds.includes(c.id)) {
          return {
            ...c,
            assignedOfficer: officerName,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    api.bulkAssignOfficer(companyIds, officerName).catch((err) => {
      console.error('API bulk assign officer failed:', err);
    });
    showToast(`Assigned representative "${officerName}" to ${companyIds.length} clients`);
  };

  const handleBulkDelete = (companyIds: string[]) => {
    if (companyIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${companyIds.length} selected client accounts?`)) {
      setCompanies((prev) => prev.filter((c) => !companyIds.includes(c.id)));
      if (selectedCompanyId && companyIds.includes(selectedCompanyId)) {
        setSelectedCompanyId(null);
      }
      api.bulkDelete(companyIds).catch((err) => {
        console.error('API bulk delete failed:', err);
      });
      showToast(`Deleted ${companyIds.length} client accounts`);
    }
  };

  const handleAddCompany = (newComp: Company) => {
    setCompanies((prev) => [newComp, ...prev]);
    setSelectedCompanyId(newComp.id);

    // If new industry not already in list, track it
    if (newComp.industry && !industryTypes.some((i) => i.toLowerCase() === newComp.industry.toLowerCase())) {
      setIndustryTypes((prev) => [...prev, newComp.industry]);
    }

    api.createCompany(newComp).catch((err) => {
      console.error('API create company failed:', err);
    });
    showToast(`Initialized 115-point registration workflow for ${newComp.name}`);
  };

  const handleImportSuccess = (imported: Company[], mode: 'merge' | 'append') => {
    if (mode === 'merge') {
      const updatedList = [...companies];
      imported.forEach((newItem) => {
        const idx = updatedList.findIndex(
          (c) => c.name.toLowerCase().trim() === newItem.name.toLowerCase().trim()
        );
        if (idx >= 0) {
          updatedList[idx] = newItem;
        } else {
          updatedList.unshift(newItem);
        }
      });
      setCompanies(updatedList);
    } else {
      setCompanies((prev) => [...imported, ...prev]);
    }

    // Capture new industries from import
    const newIndustries = imported
      .map((c) => c.industry)
      .filter((ind): ind is string => !!ind && !industryTypes.some((i) => i.toLowerCase() === ind.toLowerCase()));
    if (newIndustries.length > 0) {
      setIndustryTypes((prev) => [...prev, ...Array.from(new Set(newIndustries))]);
    }

    api.bulkImport(imported, mode)
      .then((res) => {
        if (Array.isArray(res)) setCompanies(res);
      })
      .catch((err) => {
        console.error('API bulk import failed:', err);
      });
    showToast(`Successfully processed ${imported.length} corporate records!`);
  };

  const handleAddNotificationLog = (newLog: NotificationLog) => {
    setNotifications((prev) => [newLog, ...prev]);
    api.createNotification(newLog).catch((err) => {
      console.error('API notification dispatch failed:', err);
    });
    showToast(`Dispatched ${newLog.channel} notification to ${newLog.recipient}`);
  };

  const handleConfirmWin = (
    company: Company,
    options: {
      vendorNumber?: string;
      approvedCategories?: string[];
      approvalDate?: string;
      validUntil?: string;
    }
  ) => {
    const updated = recordClientWin(company, options);
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    api.updateCompany(updated.id, updated).catch((err) => console.error(err));

    // Create celebratory notification log
    const winLog: NotificationLog = {
      id: 'win-' + Date.now(),
      companyId: company.id,
      companyName: company.name,
      channel: 'WhatsApp',
      recipient: company.procurementEmail || company.assignedOfficer,
      event: 'Client Won',
      message: `🎉 Won! Registered as approved vendor (${updated.approval.vendorNumber || 'Pending Code'}). Categories: ${(updated.approval.approvedCategories || []).join(', ') || 'General'}.`,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Delivered',
    };
    setNotifications((prev) => [winLog, ...prev]);
    api.createNotification(winLog).catch((err) => console.error(err));

    showToast(`Won! ${company.name} registered as Approved Vendor`);
    setWinModalCompany(null);
  };

  const handleSaveSchedule = (
    company: Company,
    data: {
      nextFollowUpDate: string;
      channel?: 'Email' | 'WhatsApp';
      notes?: string;
    }
  ) => {
    const updated: Company = {
      ...company,
      nextFollowUpDate: data.nextFollowUpDate,
      updatedAt: new Date().toISOString(),
    };
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    api.updateCompany(updated.id, updated).catch((err) => console.error(err));

    const schedLog: NotificationLog = {
      id: 'sched-' + Date.now(),
      companyId: company.id,
      companyName: company.name,
      channel: data.channel || 'WhatsApp',
      recipient: company.procurementContact || company.assignedOfficer,
      event: 'Schedule Alert',
      message: `Scheduled follow-up for ${data.nextFollowUpDate}${data.notes ? `: ${data.notes}` : ''}`,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Delivered',
    };
    setNotifications((prev) => [schedLog, ...prev]);
    api.createNotification(schedLog).catch((err) => console.error(err));

    showToast(`Scheduled follow-up for ${company.name}`);
    setScheduleModalCompany(null);
  };

  // Industry Settings Handlers
  const handleAddIndustryType = async (name: string): Promise<boolean> => {
    try {
      const updatedList = await api.addIndustryType(name);
      if (Array.isArray(updatedList) && updatedList.length > 0) {
        setIndustryTypes(updatedList);
      } else {
        setIndustryTypes((prev) => [...prev, name.trim()]);
      }
      return true;
    } catch (err) {
      console.error('Failed to add industry type:', err);
      showToast(`Error adding industry "${name}"`);
      return false;
    }
  };

  const handleUpdateIndustryType = async (oldName: string, newName: string, cascade: boolean): Promise<boolean> => {
    try {
      const result = await api.updateIndustryType(oldName, newName, cascade);
      if (Array.isArray(result.industryTypes) && result.industryTypes.length > 0) {
        setIndustryTypes(result.industryTypes);
      }
      if (cascade) {
        const refreshed = await api.getCompanies();
        setCompanies(refreshed);
      }
      return true;
    } catch (err) {
      console.error('Failed to update industry type:', err);
      showToast('Error updating industry type');
      return false;
    }
  };

  const handleDeleteIndustryType = async (name: string): Promise<boolean> => {
    try {
      const updatedList = await api.deleteIndustryType(name);
      if (Array.isArray(updatedList)) {
        setIndustryTypes(updatedList);
      } else {
        setIndustryTypes((prev) => prev.filter((i) => i.toLowerCase() !== name.toLowerCase()));
      }
      return true;
    } catch (err) {
      console.error('Failed to delete industry type:', err);
      showToast('Error removing industry type');
      return false;
    }
  };

  const handleResetIndustryTypes = async (): Promise<boolean> => {
    try {
      const updatedList = await api.resetIndustryTypes();
      if (Array.isArray(updatedList)) {
        setIndustryTypes(updatedList);
      }
      return true;
    } catch (err) {
      console.error('Failed to reset industry types:', err);
      showToast('Error resetting industry types');
      return false;
    }
  };

  // Database Administration Handlers
  const handleClearDatabase = async () => {
    if (window.confirm('Clear all client company records and communication logs from the database?')) {
      try {
        await api.clearDatabase();
        setCompanies([]);
        setNotifications([]);
        setSelectedCompanyId(null);
        showToast('Database reset to clean empty state (0 records)');
      } catch (err) {
        console.error('Failed to clear database:', err);
        showToast('Error resetting database');
      }
    }
  };

  const handleSeedSample = async () => {
    try {
      await api.seedSampleData();
      const [comps, notifs] = await Promise.all([api.getCompanies(), api.getNotifications()]);
      setCompanies(comps);
      setNotifications(notifs);
      showToast(`Loaded ${comps.length} sample template clients`);
    } catch (err) {
      console.error('Failed to load sample demo data:', err);
      showToast('Error loading sample template data');
    }
  };

  const pendingFollowUpsCount = companies.filter((c) => c.nextFollowUpDate).length;

  return (
    <div className="min-h-screen py-4 sm:py-8 px-2 sm:px-6 lg:px-10 flex flex-col items-center justify-start">
      {/* App Canvas Window Frame matching Crescendo layout */}
      <div className="w-full max-w-[1400px] bg-white rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col min-h-[92vh]">
        {/* Top Bar Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedCompanyId(null);
          }}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          pendingFollowUpsCount={pendingFollowUpsCount}
          totalCompaniesCount={companies.length}
        />

        {/* Database Status Strip */}
        <div className="px-6 sm:px-10 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus === 'healthy'
                  ? 'bg-emerald-500'
                  : dbStatus === 'syncing'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-medium text-slate-700">
              Database API: {dbStatus === 'healthy' ? 'Active & Persistent' : dbStatus}
            </span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-slate-600">
              {companies.length} {companies.length === 1 ? 'Client' : 'Clients'}
            </span>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                setSelectedCompanyId(null);
              }}
              className="text-slate-600 hover:text-[#0e3aa9] transition-colors flex items-center gap-1 font-medium"
            >
              <span>{industryTypes.length} Industry Types</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {companies.length > 0 ? (
              <button
                type="button"
                onClick={handleClearDatabase}
                className="inline-flex items-center gap-1 hover:text-rose-600 transition-colors"
                title="Wipe database back to clean empty state"
              >
                <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                <span>Reset Database</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSeedSample}
                className="inline-flex items-center gap-1 text-[#0e3aa9] hover:underline transition-colors font-medium"
                title="Load sample template data for testing"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load Sample Template (Demo)</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 w-full px-6 sm:px-10 py-8">
          {/* Loading Indicator */}
          {isLoading && companies.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0e3aa9]" />
              <p className="text-xs font-medium">Connecting to persistent database...</p>
            </div>
          ) : currentSelectedCompany ? (
            <CompanyDetailWorkspace
              company={currentSelectedCompany}
              onUpdateCompany={handleUpdateCompany}
              onBack={() => setSelectedCompanyId(null)}
              onOpenNotificationModal={(companyId) =>
                setNotificationModalConfig({ isOpen: true, initialCompanyId: companyId })
              }
              onOpenWinModal={(comp) => setWinModalCompany(comp)}
              onOpenScheduleModal={(comp) => setScheduleModalCompany(comp)}
              industryTypes={industryTypes}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  companies={companies}
                  onSelectCompany={(id) => setSelectedCompanyId(id)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onSeedSample={handleSeedSample}
                />
              )}

              {activeTab === 'companies' && (
                <CompanyListView
                  companies={companies}
                  onSelectCompany={(id) => setSelectedCompanyId(id)}
                  onUpdateCompany={handleUpdateCompany}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onDeleteCompany={handleDeleteCompany}
                  onUpdateCompanyStatus={handleUpdateCompanyStatus}
                  onBulkUpdateStatus={handleBulkUpdateStatus}
                  onBulkAssignOfficer={handleBulkAssignOfficer}
                  onBulkDelete={handleBulkDelete}
                  onOpenWinModal={(comp) => setWinModalCompany(comp)}
                  onOpenScheduleModal={(comp) => setScheduleModalCompany(comp)}
                  onShowToast={showToast}
                  onSeedSample={handleSeedSample}
                  onClearDatabase={handleClearDatabase}
                />
              )}

              {activeTab === 'pipeline' && (
                <PipelineBoardView
                  companies={companies}
                  onSelectCompany={(id) => setSelectedCompanyId(id)}
                  onUpdateCompanyStatus={handleUpdateCompanyStatus}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onOpenWinModal={(comp) => setWinModalCompany(comp)}
                  onOpenScheduleModal={(comp) => setScheduleModalCompany(comp)}
                />
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                      Alerts & Comms
                    </h1>

                    <button
                      onClick={() => setNotificationModalConfig({ isOpen: true })}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
                    >
                      + New Alert
                    </button>
                  </div>

                  {/* Upcoming Schedule Alerts & Live Countdowns */}
                  <div className="bg-[#f8faff] border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0e3aa9]" />
                        <h2 className="text-sm font-bold text-slate-900">
                          Upcoming Schedules & Countdowns
                        </h2>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                          {companies.filter((c) => c.nextFollowUpDate).length}
                        </span>
                      </div>
                    </div>

                    {companies.filter((c) => c.nextFollowUpDate).length === 0 ? (
                      <div className="bg-white rounded-xl border border-slate-200/80 p-6 text-center text-xs text-slate-500">
                        No follow-ups currently scheduled. Click the follow-up column or card button on any client to set schedule alerts.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {getUpcomingScheduleAlerts(companies, undefined, 6).map(({ company: c, countdown }) => {
                          const isWon = c.registrationStatus === 'Approved';

                          return (
                            <div
                              key={c.id}
                              className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-blue-300 transition-colors shadow-2xs"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCompanyId(c.id)}
                                    className="font-bold text-xs text-slate-900 hover:text-[#0e3aa9] text-left truncate transition-colors"
                                  >
                                    {c.name}
                                  </button>
                                  {countdown && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${countdown.colorClass}`}
                                    >
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{countdown.label}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {c.industry}
                                </div>

                                <div className="mt-2 text-[11px] font-mono text-slate-600 flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>{c.nextFollowUpDate}</span>
                                  </span>
                                  <span className="text-slate-400 truncate max-w-[100px]">
                                    {c.assignedOfficer.split(' ')[0]}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setScheduleModalCompany(c)}
                                  className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  Reschedule
                                </button>

                                <div className="flex items-center gap-1">
                                  {isWon ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                                      Won ✓
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setWinModalCompany(c)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                      title="Mark client as Won"
                                    >
                                      <Trophy className="w-3 h-3" />
                                      <span>Win</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNotificationModalConfig({ isOpen: true, initialCompanyId: c.id })
                                    }
                                    className="p-1 text-slate-500 hover:text-[#0e3aa9] rounded hover:bg-slate-50"
                                    title="Send alert notification"
                                  >
                                    <Bell className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Notification Logs List */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
                      <span>Logs ({notifications.length})</span>
                    </div>

                    <div className="overflow-x-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          No communication or alert logs recorded yet.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-[11px] text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Company</th>
                              <th className="py-2.5 px-3">Channel</th>
                              <th className="py-2.5 px-3">Recipient</th>
                              <th className="py-2.5 px-3">Trigger</th>
                              <th className="py-2.5 px-3">Message</th>
                              <th className="py-2.5 px-3">Time</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {notifications.map((n) => (
                              <tr key={n.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{n.companyName}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      n.channel === 'WhatsApp'
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {n.channel}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{n.recipient}</td>
                                <td className="py-2.5 px-3 text-slate-700">{n.event}</td>
                                <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{n.message}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{n.sentAt}</td>
                                <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                                  {n.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  companies={companies}
                  onSelectCompany={(id) => setSelectedCompanyId(id)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  companies={companies}
                  industryTypes={industryTypes}
                  onAddIndustryType={handleAddIndustryType}
                  onUpdateIndustryType={handleUpdateIndustryType}
                  onDeleteIndustryType={handleDeleteIndustryType}
                  onResetIndustryTypes={handleResetIndustryTypes}
                  onFilterByIndustry={() => {
                    setActiveTab('companies');
                  }}
                  onClearDatabase={handleClearDatabase}
                  onShowToast={showToast}
                />
              )}
            </>
          )}
        </main>

        {/* Modals */}
        <AddCompanyModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddCompany={handleAddCompany}
          industryTypes={industryTypes}
        />

        <CsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          existingCompanies={companies}
          onImportSuccess={handleImportSuccess}
        />

        <NotificationCenterModal
          isOpen={notificationModalConfig.isOpen}
          initialCompanyId={notificationModalConfig.initialCompanyId}
          onClose={() => setNotificationModalConfig({ isOpen: false })}
          companies={companies}
          notifications={notifications}
          onAddNotification={handleAddNotificationLog}
        />

        <WinClientModal
          isOpen={!!winModalCompany}
          company={winModalCompany}
          onClose={() => setWinModalCompany(null)}
          onConfirmWin={handleConfirmWin}
        />

        <ScheduleAlertModal
          isOpen={!!scheduleModalCompany}
          company={scheduleModalCompany}
          onClose={() => setScheduleModalCompany(null)}
          onSaveSchedule={handleSaveSchedule}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-3.5 py-2 rounded shadow-lg flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Clean Quiet Footer */}
        <footer className="border-t border-slate-100 bg-white px-8 py-5 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">INNOVISTA</span>
            <span className="font-mono text-[11px] text-slate-400">© 2026</span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-[#0e3aa9]" />
              File-backed JSON DB (Clean mode)
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500 font-medium">
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setActiveTab('companies')}>Directory</span>
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setActiveTab('pipeline')}>Checklists</span>
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setActiveTab('reports')}>Compliance</span>
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setActiveTab('settings')}>Settings</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
