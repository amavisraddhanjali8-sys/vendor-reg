import React, { useState } from 'react';
import { X, Mail, MessageSquare, Copy } from 'lucide-react';
import { Company, NotificationLog } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  initialCompanyId?: string;
  notifications: NotificationLog[];
  onAddNotification: (log: NotificationLog) => void;
}

const TEMPLATES = [
  {
    id: 't-init',
    name: 'Registration Initiated',
    event: 'Registration Initiated',
    channel: 'Email' as const,
    body: (c: Company) =>
      `Dear Procurement Team at ${c.name},\n\nWe have initiated vendor registration for INNOVISTA METAL FABRICONIX (PVT) LTD (Aluminium, Glass & Steel Fabrications).\n\nPlease share the supplier prequalification forms and document checklist.\n\nAssigned Officer: ${c.assignedOfficer}\nContact: +94 11 250 8800 | bd@innovista.lk`,
  },
  {
    id: 't-deadline',
    name: 'Follow-up Reminder',
    event: 'Follow-up Deadline Approaching',
    channel: 'WhatsApp' as const,
    body: (c: Company) =>
      `VendorHub: Follow-up reminder for ${c.name} vendor registration. Scheduled date: ${c.nextFollowUpDate || 'Today'}. Officer: ${c.assignedOfficer}.`,
  },
  {
    id: 't-docs-missing',
    name: 'Missing Documents',
    event: 'Documents Missing',
    channel: 'Email' as const,
    body: (c: Company) =>
      `Attention: ${c.procurementContact} (${c.name})\n\nPending documents for vendor prequalification: Form 01, Audited Financials, and QA manual.\n\nPlease advise submission deadline.`,
  },
  {
    id: 't-submitted',
    name: 'Application Submitted',
    event: 'Application Submitted',
    channel: 'Email' as const,
    body: (c: Company) =>
      `Dear Procurement Team at ${c.name},\n\nINNOVISTA has submitted the vendor registration dossier via ${c.submission.channel}.\n\nReference: ${c.submission.referenceNumber || 'Pending'}.\n\nPlease confirm receipt.`,
  },
  {
    id: 't-approved',
    name: 'Vendor Approved',
    event: 'Registration Approved',
    channel: 'WhatsApp' as const,
    body: (c: Company) =>
      `INNOVISTA: Vendor registration for ${c.name} is approved. Vendor Code: ${c.approval.vendorNumber || 'ISSUED'}.`,
  },
];

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  companies,
  initialCompanyId,
  notifications,
  onAddNotification,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    initialCompanyId || (companies[0]?.id || '')
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('t-init');
  const [channel, setChannel] = useState<'Email' | 'WhatsApp'>('Email');
  const [customRecipient, setCustomRecipient] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const template = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

  const effectiveRecipient =
    customRecipient ||
    (channel === 'Email' ? currentCompany?.procurementEmail : currentCompany?.mainTelephone) ||
    '';

  const generatedMessage = customMessage || (currentCompany ? template.body(currentCompany) : '');

  const handleSendNotification = () => {
    if (!currentCompany) return;

    const newLog: NotificationLog = {
      id: 'notif-' + Date.now(),
      companyId: currentCompany.id,
      companyName: currentCompany.name,
      channel: channel,
      recipient: effectiveRecipient,
      event: template.event,
      message: generatedMessage,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Delivered',
    };

    onAddNotification(newLog);

    if (channel === 'WhatsApp' && effectiveRecipient) {
      const cleanPhone = effectiveRecipient.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedMessage)}`;
      window.open(waUrl, '_blank');
    }

    setCustomMessage('');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Alert</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-500 mb-1">Client</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  setCustomRecipient('');
                  setCustomMessage('');
                }}
                className="w-full py-1.5 px-2 border border-slate-200 rounded-lg bg-white text-xs"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  const tmpl = TEMPLATES.find((t) => t.id === e.target.value);
                  if (tmpl) setChannel(tmpl.channel);
                  setCustomMessage('');
                }}
                className="w-full py-1.5 px-2 border border-slate-200 rounded bg-white text-xs"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Channel</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setChannel('Email')}
                  className={`flex-1 py-1 rounded text-xs font-semibold ${
                    channel === 'Email' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('WhatsApp')}
                  className={`flex-1 py-1 rounded text-xs font-semibold ${
                    channel === 'WhatsApp' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  WhatsApp
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Recipient</label>
            <input
              type="text"
              value={effectiveRecipient}
              onChange={(e) => setCustomRecipient(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-200 rounded font-mono text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-500">Message</label>
              <button onClick={handleCopyMessage} className="text-[11px] text-slate-500 hover:text-slate-900">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <textarea
              rows={4}
              value={generatedMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-xs leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900">
            Cancel
          </button>
          <button
            onClick={handleSendNotification}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded"
          >
            Send {channel}
          </button>
        </div>
      </div>
    </div>
  );
};
