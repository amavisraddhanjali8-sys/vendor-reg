import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { Company, CompanyPriority, RegistrationStatus } from '../types';
import { createDefaultCompanyChecklist } from '../data/masterChecklist';
import { calculateIntelligenceScore } from '../utils/rules';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (company: Company) => void;
  industryTypes?: string[];
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  onAddCompany,
  industryTypes = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    industry: industryTypes[0] || 'Commercial Construction & Real Estate',
    companyType: 'PLC' as Company['companyType'],
    website: '',
    headOfficeAddress: '',
    mainTelephone: '',
    procurementEmail: '',
    procurementContact: '',
    registrationPortal: '',
    priority: 'High' as CompanyPriority,
    registrationStatus: 'Identified' as RegistrationStatus,
    assignedOfficer: 'Ranil Jayasuriya',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const intelligenceFactors = {
      businessOpportunity: formData.priority === 'High' ? 85 : 70,
      companySuitability: 80,
      registrationAccessibility: 75,
      potentialProjectValue: formData.priority === 'High' ? 85 : 65,
      relationshipAccessibility: 70,
      registrationCostEffort: 75,
    };
    const score = calculateIntelligenceScore(intelligenceFactors);

    const newComp: Company = {
      id: 'comp-' + Date.now(),
      name: formData.name.trim(),
      industry: formData.industry,
      companyType: formData.companyType,
      website: formData.website,
      headOfficeAddress: formData.headOfficeAddress || 'Colombo, Sri Lanka',
      mainTelephone: formData.mainTelephone,
      procurementEmail: formData.procurementEmail,
      procurementContact: formData.procurementContact || 'Procurement',
      registrationPortal: formData.registrationPortal,
      priority: formData.priority,
      registrationStatus: formData.registrationStatus,
      assignedOfficer: formData.assignedOfficer,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextFollowUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      intelligence: {
        ...intelligenceFactors,
        totalScore: score.totalScore,
        tier: score.tier,
      },
      contacts: formData.procurementContact
        ? [
            {
              id: 'c-' + Date.now(),
              name: formData.procurementContact,
              designation: 'Procurement Specialist',
              department: 'Procurement',
              email: formData.procurementEmail,
              phone: formData.mainTelephone,
              isPrimary: true,
            },
          ]
        : [],
      checklist: createDefaultCompanyChecklist(formData.assignedOfficer),
      documents: [],
      communicationLogs: [],
      submission: {
        channel: 'Online Vendor Portal',
        confirmationReceived: false,
      },
      approval: {
        approvedCategories: ['Architectural Aluminium Fabrication'],
        renewalReminderDays: 30,
        status: 'Pending',
      },
      evaluation: {
        overallRating: 3,
        responsiveness: 'Moderate',
        communicationQuality: 'Good',
        opportunityAccess: 'Project based',
        registrationDurationDays: 0,
        lessonsLearned: '',
      },
      opportunities: [],
    };

    onAddCompany(newComp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Add</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-500 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Company Name"
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-[#0e3aa9]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-500">Industry</label>
                <span className="text-[10px] text-slate-400">Select or type custom</span>
              </div>
              <input
                type="text"
                list="add-modal-industry-types"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Select or enter industry..."
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#0e3aa9]"
              />
              <datalist id="add-modal-industry-types">
                {industryTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Type</label>
              <select
                value={formData.companyType}
                onChange={(e) => setFormData({ ...formData, companyType: e.target.value as any })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg"
              >
                <option value="PLC">PLC</option>
                <option value="Pvt Ltd">Pvt Ltd</option>
                <option value="Government / Semi-Gov">Government</option>
                <option value="Multinational">Multinational</option>
                <option value="Joint Venture">Joint Venture</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Phone</label>
              <input
                type="text"
                value={formData.mainTelephone}
                onChange={(e) => setFormData({ ...formData, mainTelephone: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={formData.procurementEmail}
                onChange={(e) => setFormData({ ...formData, procurementEmail: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Contact</label>
              <input
                type="text"
                value={formData.procurementContact}
                onChange={(e) => setFormData({ ...formData, procurementContact: e.target.value })}
                placeholder="Contact"
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Officer</label>
              <input
                type="text"
                value={formData.assignedOfficer}
                onChange={(e) => setFormData({ ...formData, assignedOfficer: e.target.value })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Status</label>
              <select
                value={formData.registrationStatus}
                onChange={(e) => setFormData({ ...formData, registrationStatus: e.target.value as any })}
                className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg"
              >
                <option value="Identified">Identified</option>
                <option value="Contacted">Contacted</option>
                <option value="Requirements Received">Requirements</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0e3aa9] hover:bg-[#0b2d84] rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
