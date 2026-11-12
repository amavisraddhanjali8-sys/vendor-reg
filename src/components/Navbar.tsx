import React from 'react';
import { Building2, Plus, Upload, Bell, FileSpreadsheet, User } from 'lucide-react';
import { UserProfile } from '../types';

export type ActiveNavTab = 'dashboard' | 'companies' | 'pipeline' | 'notifications' | 'reports' | 'settings';

interface NavbarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  pendingFollowUpsCount: number;
  totalCompaniesCount: number;
  currentUser?: UserProfile | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenImportModal,
  pendingFollowUpsCount,
  totalCompaniesCount,
  currentUser,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-100">
      <div className="w-full px-6 sm:px-10">
        <div className="flex items-center justify-between gap-8 h-20">
          {/* Zone 1: Brand Wordmark (matching Crescendo typography) */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              Innovista
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                activeTab === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                activeTab === 'companies' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              Clients
              <span className="ml-1 text-[11px] text-slate-400 font-normal">({totalCompaniesCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                activeTab === 'pipeline' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                activeTab === 'notifications' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              Alerts
              {pendingFollowUpsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
                  {pendingFollowUpsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                activeTab === 'reports' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                activeTab === 'settings' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Zone 3: Primary Action & User Auth */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenImportModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#0e3aa9]" />
              <span>Import</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            {currentUser && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  title="View Security & Account Settings"
                >
                  <User className="w-3.5 h-3.5 text-[#0e3aa9]" />
                  <span className="font-mono text-[11px]">{currentUser.username}</span>
                  {currentUser.role === 'admin' && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-700">
                      Admin
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
