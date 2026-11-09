import React, { useState } from 'react';
import { Calendar, Clock, X, Bell, MessageSquare, Mail, AlertTriangle, Check } from 'lucide-react';
import { Company } from '../types';
import { formatScheduleCountdown } from '../utils/rules';

interface ScheduleAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onSaveSchedule: (
    company: Company,
    schedule: {
      nextFollowUpDate: string;
      channel?: 'Email' | 'WhatsApp';
      notes?: string;
    }
  ) => void;
}

export const ScheduleAlertModal: React.FC<ScheduleAlertModalProps> = ({
  isOpen,
  onClose,
  company,
  onSaveSchedule,
}) => {
  if (!isOpen || !company) return null;

  const defaultDate =
    company.nextFollowUpDate ||
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [date, setDate] = useState<string>(defaultDate);
  const [channel, setChannel] = useState<'In-App' | 'WhatsApp' | 'Email'>('WhatsApp');
  const [note, setNote] = useState<string>(
    company.notes ? `Follow-up on ${company.notes.slice(0, 40)}` : 'Follow-up on registration progress'
  );

  const countdown = formatScheduleCountdown(date);

  const applyPresetDays = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setDate(d);
  };

  const handleSave = () => {
    if (!date) return;
    onSaveSchedule(company, {
      nextFollowUpDate: date,
      channel: channel === 'WhatsApp' ? 'WhatsApp' : 'Email',
      notes: note,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-[#0e3aa9] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-2xs">
              <Bell className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Schedule Alert</h2>
              <p className="text-xs text-blue-100 font-medium">Follow-up & Live Countdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Company Info */}
          <div className="bg-[#f8faff] border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm truncate max-w-[260px]">
                {company.name}
              </div>
              <div className="text-slate-500 text-[11px]">
                Contact: {company.procurementContact} ({company.assignedOfficer})
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0e3aa9] font-bold text-[10px]">
              {company.priority}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0e3aa9]" />
              <span>Presets</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => applyPresetDays(0)}
                className="py-1.5 px-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg font-semibold text-slate-700 transition-colors text-center text-xs"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(1)}
                className="py-1.5 px-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg font-semibold text-slate-700 transition-colors text-center text-xs"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(3)}
                className="py-1.5 px-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg font-semibold text-slate-700 transition-colors text-center text-xs"
              >
                3 Days
              </button>
              <button
                type="button"
                onClick={() => applyPresetDays(7)}
                className="py-1.5 px-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg font-semibold text-slate-700 transition-colors text-center text-xs"
              >
                1 Week
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Schedule Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0e3aa9] focus:ring-1 focus:ring-[#0e3aa9]"
            />
          </div>

          {/* Real-time Countdown Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              countdown.status === 'overdue'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : countdown.status === 'today'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-[#0e3aa9]'
            }`}
          >
            <div className="flex items-center gap-2">
              {countdown.status === 'overdue' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <div>
                <span className="font-bold text-xs">{countdown.label}</span>
                <div className="text-[10px] opacity-80">
                  {countdown.status === 'overdue'
                    ? 'Action past deadline. Requires immediate contact.'
                    : countdown.status === 'today'
                    ? 'Due today! Scheduled for call/email.'
                    : 'Scheduled automated reminder.'}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded font-mono font-extrabold text-xs bg-white/70 shadow-2xs">
              {countdown.text}
            </span>
          </div>

          {/* Alert Notification Channel */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Alert Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('In-App')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  channel === 'In-App'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>In-App</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('WhatsApp')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  channel === 'WhatsApp'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('Email')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  channel === 'Email'
                    ? 'bg-[#0e3aa9] text-white border-[#0e3aa9] shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Reminder Trigger Note */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Reminder Task</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Call purchasing officer regarding Form 01"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#0e3aa9]"
            />
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
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0e3aa9] hover:bg-[#0b2d84] text-white font-bold shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
