import React, { useState } from 'react';
import { Trophy, X, Check, Calendar, ShieldCheck, Tag } from 'lucide-react';
import { Company } from '../types';

interface WinClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onConfirmWin: (
    company: Company,
    options: {
      vendorNumber: string;
      approvedCategories: string[];
      approvalDate: string;
      validUntil: string;
    }
  ) => void;
}

const DEFAULT_CATEGORIES = [
  'Aluminium Fabrications',
  'Curtain Wall & Glazing',
  'Structural Steelwork',
  'Canopies & Skylights',
  'Interior Partitions & Glass Doors',
  'Stainless Steel Railings',
];

export const WinClientModal: React.FC<WinClientModalProps> = ({
  isOpen,
  onClose,
  company,
  onConfirmWin,
}) => {
  if (!isOpen || !company) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const defaultVendorCode =
    company.approval.vendorNumber ||
    `INV-${company.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}-${new Date().getFullYear()}`;

  const [vendorNumber, setVendorNumber] = useState<string>(defaultVendorCode);
  const [approvalDate, setApprovalDate] = useState<string>(company.approval.approvalDate || todayStr);
  const [validUntil, setValidUntil] = useState<string>(company.approval.validUntil || oneYearLater);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    company.approval.approvedCategories.length > 0
      ? company.approval.approvedCategories
      : ['Aluminium Fabrications', 'Curtain Wall & Glazing', 'Structural Steelwork']
  );

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleConfirm = () => {
    onConfirmWin(company, {
      vendorNumber: vendorNumber.trim() || defaultVendorCode,
      approvedCategories: selectedCategories,
      approvalDate,
      validUntil,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-2xs">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Win Client</h2>
              <p className="text-xs text-emerald-100 font-medium">Approved Vendor Registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Client Info */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm truncate max-w-[260px]">
                {company.name}
              </div>
              <div className="text-emerald-800 text-[11px] font-medium">
                {company.industry}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px] uppercase">
              Approved
            </span>
          </div>

          {/* Vendor Code */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vendor Registration Code</span>
            </label>
            <input
              type="text"
              value={vendorNumber}
              onChange={(e) => setVendorNumber(e.target.value)}
              placeholder="e.g. INV-VEND-KEEL-2026"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Approval Date</span>
              </label>
              <input
                type="date"
                value={approvalDate}
                onChange={(e) => setApprovalDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Valid Until</span>
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
              />
            </div>
          </div>

          {/* Approved Supply Categories */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Approved Categories</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Confirm Win</span>
          </button>
        </div>
      </div>
    </div>
  );
};
