import {
  ChecklistItem,
  Company,
  CompanyPriority,
  RegistrationIntelligence,
  RegistrationPhaseKey,
  RegistrationStatus,
} from '../types';
import { REGISTRATION_PHASES } from '../data/masterChecklist';

export interface ScoreWeights {
  businessOpportunity: number;
  companySuitability: number;
  registrationAccessibility: number;
  potentialProjectValue: number;
  relationshipAccessibility: number;
  registrationCostEffort: number;
}

export const DEFAULT_INTELLIGENCE_WEIGHTS: ScoreWeights = {
  businessOpportunity: 0.25,
  companySuitability: 0.20,
  registrationAccessibility: 0.15,
  potentialProjectValue: 0.20,
  relationshipAccessibility: 0.10,
  registrationCostEffort: 0.10,
};

export function calculateIntelligenceScore(
  factors: Omit<RegistrationIntelligence, 'totalScore' | 'tier'>
): { totalScore: number; tier: RegistrationIntelligence['tier'] } {
  const clamp = (val: number) => Math.max(0, Math.min(100, Number(val) || 0));

  const bo = clamp(factors.businessOpportunity);
  const cs = clamp(factors.companySuitability);
  const ra = clamp(factors.registrationAccessibility);
  const pv = clamp(factors.potentialProjectValue);
  const rel = clamp(factors.relationshipAccessibility);
  const ce = clamp(factors.registrationCostEffort);

  const rawScore =
    bo * DEFAULT_INTELLIGENCE_WEIGHTS.businessOpportunity +
    cs * DEFAULT_INTELLIGENCE_WEIGHTS.companySuitability +
    ra * DEFAULT_INTELLIGENCE_WEIGHTS.registrationAccessibility +
    pv * DEFAULT_INTELLIGENCE_WEIGHTS.potentialProjectValue +
    rel * DEFAULT_INTELLIGENCE_WEIGHTS.relationshipAccessibility +
    ce * DEFAULT_INTELLIGENCE_WEIGHTS.registrationCostEffort;

  const totalScore = Math.round(rawScore);

  let tier: RegistrationIntelligence['tier'];
  if (totalScore >= 75) {
    tier = 'High-priority target';
  } else if (totalScore >= 50) {
    tier = 'Medium-priority target';
  } else if (totalScore >= 30) {
    tier = 'Low-priority target';
  } else {
    tier = 'Registration not currently feasible';
  }

  return { totalScore, tier };
}

export interface PhaseProgress {
  phase: RegistrationPhaseKey;
  phaseName: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  notApplicable: number;
  blocked: number;
  percentage: number;
}

export interface ChecklistProgressSummary {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  notApplicableItems: number;
  blockedItems: number;
  applicableItems: number;
  overallPercentage: number;
  phases: PhaseProgress[];
}

export function calculateCompanyChecklistProgress(checklist: ChecklistItem[]): ChecklistProgressSummary {
  const totalItems = checklist.length;
  let completedItems = 0;
  let inProgressItems = 0;
  let notStartedItems = 0;
  let notApplicableItems = 0;
  let blockedItems = 0;

  const phaseMap = new Map<RegistrationPhaseKey, {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    notApplicable: number;
    blocked: number;
  }>();

  for (const p of REGISTRATION_PHASES) {
    phaseMap.set(p.key, {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      notApplicable: 0,
      blocked: 0,
    });
  }

  for (const item of checklist) {
    const pData = phaseMap.get(item.phase);

    switch (item.status) {
      case 'completed':
        completedItems++;
        if (pData) pData.completed++;
        break;
      case 'in_progress':
        inProgressItems++;
        if (pData) pData.inProgress++;
        break;
      case 'not_applicable':
        notApplicableItems++;
        if (pData) pData.notApplicable++;
        break;
      case 'blocked':
        blockedItems++;
        if (pData) pData.blocked++;
        break;
      case 'not_started':
      default:
        notStartedItems++;
        if (pData) pData.notStarted++;
        break;
    }

    if (pData) pData.total++;
  }

  const applicableItems = totalItems - notApplicableItems;
  const overallPercentage = applicableItems > 0
    ? Math.min(100, Math.round((completedItems / applicableItems) * 100))
    : 0;

  const phases: PhaseProgress[] = REGISTRATION_PHASES.map((p) => {
    const data = phaseMap.get(p.key) || {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      notApplicable: 0,
      blocked: 0,
    };
    const phaseApplicable = data.total - data.notApplicable;
    const phasePercentage = phaseApplicable > 0
      ? Math.min(100, Math.round((data.completed / phaseApplicable) * 100))
      : 0;

    return {
      phase: p.key,
      phaseName: p.name,
      total: data.total,
      completed: data.completed,
      inProgress: data.inProgress,
      notStarted: data.notStarted,
      notApplicable: data.notApplicable,
      blocked: data.blocked,
      percentage: phasePercentage,
    };
  });

  return {
    totalItems,
    completedItems,
    inProgressItems,
    notStartedItems,
    notApplicableItems,
    blockedItems,
    applicableItems,
    overallPercentage,
    phases,
  };
}

export interface ParsedCsvResult {
  validRecords: Array<{
    name: string;
    industry: string;
    companyType: Company['companyType'];
    website: string;
    mainTelephone: string;
    procurementEmail: string;
    procurementContact: string;
    registrationPortal: string;
    priority: CompanyPriority;
    registrationStatus: RegistrationStatus;
    assignedOfficer: string;
    notes: string;
  }>;
  errors: Array<{
    row: number;
    error: string;
    rawText: string;
  }>;
  warnings: Array<{
    row: number;
    company: string;
    warning: string;
  }>;
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvCompanyImport(csvText: string): ParsedCsvResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const result: ParsedCsvResult = {
    validRecords: [],
    errors: [],
    warnings: [],
  };

  if (lines.length === 0) {
    return result;
  }

  // Parse header
  const rawHeaders = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const headerIndices = {
    name: rawHeaders.findIndex((h) => h.includes('company') || h.includes('client') || h.includes('buyer') || h.includes('enterprise') || h.includes('name')),
    industry: rawHeaders.findIndex((h) => h.includes('industry') || h.includes('sector')),
    companyType: rawHeaders.findIndex((h) => h.includes('type')),
    website: rawHeaders.findIndex((h) => h.includes('website') || h.includes('url')),
    mainTelephone: rawHeaders.findIndex((h) => h.includes('phone') || h.includes('telephone') || h.includes('tel')),
    procurementEmail: rawHeaders.findIndex((h) => h.includes('email') || h.includes('mail')),
    procurementContact: rawHeaders.findIndex((h) => h.includes('contact') || h.includes('officer') || h.includes('manager') || h.includes('person')),
    registrationPortal: rawHeaders.findIndex((h) => h.includes('portal') || h.includes('link')),
    priority: rawHeaders.findIndex((h) => h.includes('priority') || h.includes('tier')),
    registrationStatus: rawHeaders.findIndex((h) => h.includes('status') || h.includes('stage')),
    assignedOfficer: rawHeaders.findIndex((h) => h.includes('assigned') || h.includes('owner') || h.includes('lead') || h.includes('officer')),
    notes: rawHeaders.findIndex((h) => h.includes('note') || h.includes('remark') || h.includes('comment')),
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCsvLine(line);
    const rowNum = i + 1;

    const getVal = (idx: number, fallback: string = '') => {
      if (idx >= 0 && idx < cols.length) {
        return cols[idx].replace(/^"|"$/g, '').trim();
      }
      return fallback;
    };

    const name = getVal(headerIndices.name >= 0 ? headerIndices.name : 0);

    if (!name) {
      result.errors.push({
        row: rowNum,
        error: 'Mandatory field "Company Name" is missing or empty',
        rawText: line,
      });
      continue;
    }

    const industry = getVal(headerIndices.industry, 'Diversified / Corporate');
    let rawType = getVal(headerIndices.companyType, 'PLC');
    let companyType: Company['companyType'] = 'PLC';
    if (/pvt|private/i.test(rawType)) companyType = 'Pvt Ltd';
    else if (/gov|state|semi/i.test(rawType)) companyType = 'Government / Semi-Gov';
    else if (/multi|mnc/i.test(rawType)) companyType = 'Multinational';
    else if (/joint/i.test(rawType)) companyType = 'Joint Venture';

    const website = getVal(headerIndices.website, '');
    const mainTelephone = getVal(headerIndices.mainTelephone, '');
    const procurementEmail = getVal(headerIndices.procurementEmail, '');
    const procurementContact = getVal(headerIndices.procurementContact, 'Procurement Division');
    const registrationPortal = getVal(headerIndices.registrationPortal, '');

    let rawPriority = getVal(headerIndices.priority, 'Medium');
    let priority: CompanyPriority = 'Medium';
    if (/high/i.test(rawPriority)) priority = 'High';
    else if (/low/i.test(rawPriority)) priority = 'Low';
    else if (/not|infeasible/i.test(rawPriority)) priority = 'Not Feasible';

    let rawStatus = getVal(headerIndices.registrationStatus, 'Identified');
    let registrationStatus: RegistrationStatus = 'Identified';
    if (/contact/i.test(rawStatus)) registrationStatus = 'Contacted';
    else if (/req/i.test(rawStatus)) registrationStatus = 'Requirements Received';
    else if (/prep|doc/i.test(rawStatus)) registrationStatus = 'Documents In Preparation';
    else if (/submit/i.test(rawStatus)) registrationStatus = 'Submitted';
    else if (/eval/i.test(rawStatus)) registrationStatus = 'Under Evaluation';
    else if (/approve/i.test(rawStatus)) registrationStatus = 'Approved';
    else if (/reject/i.test(rawStatus)) registrationStatus = 'Rejected';

    const assignedOfficer = getVal(headerIndices.assignedOfficer, 'BD Team');
    const notes = getVal(headerIndices.notes, '');

    if (!mainTelephone) {
      result.warnings.push({
        row: rowNum,
        company: name,
        warning: 'Main telephone number is missing',
      });
    }

    if (!procurementEmail) {
      result.warnings.push({
        row: rowNum,
        company: name,
        warning: 'Procurement email is missing',
      });
    }

    result.validRecords.push({
      name,
      industry,
      companyType,
      website,
      mainTelephone,
      procurementEmail,
      procurementContact,
      registrationPortal,
      priority,
      registrationStatus,
      assignedOfficer,
      notes,
    });
  }

  return result;
}

export function exportCompaniesToCsv(companies: Company[]): string {
  const headers = [
    'Company ID',
    'Company Name',
    'Industry',
    'Company Type',
    'Priority',
    'Registration Status',
    'Intelligence Score',
    'Intelligence Tier',
    'Checklist Progress %',
    'Completed Checklist Items',
    'Total Applicable Items',
    'Assigned Officer',
    'Procurement Contact',
    'Procurement Email',
    'Main Telephone',
    'Website',
    'Head Office Address',
    'Registration Portal',
    'Vendor Number',
    'Approved Categories',
    'Approval Date',
    'Valid Until',
    'Next Follow-Up',
    'RFQs Count',
    'Total Opportunity Value (LKR)',
    'Contacts Count',
    'History Logs Count',
    'Notes',
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    const str = val === undefined || val === null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = companies.map((c) => {
    const progress = calculateCompanyChecklistProgress(c.checklist);
    const totalRfqValue = (c.opportunities || []).reduce(
      (sum, opp) => sum + (Number(opp.estimatedValue) || 0),
      0
    );
    const approvedCats = (c.approval?.approvedCategories || []).join('; ');

    return [
      escapeCsv(c.id),
      escapeCsv(c.name),
      escapeCsv(c.industry),
      escapeCsv(c.companyType),
      escapeCsv(c.priority),
      escapeCsv(c.registrationStatus),
      escapeCsv(c.intelligence?.totalScore ?? ''),
      escapeCsv(c.intelligence?.tier ?? ''),
      escapeCsv(progress.overallPercentage),
      escapeCsv(progress.completedItems),
      escapeCsv(progress.applicableItems),
      escapeCsv(c.assignedOfficer),
      escapeCsv(c.procurementContact),
      escapeCsv(c.procurementEmail),
      escapeCsv(c.mainTelephone),
      escapeCsv(c.website),
      escapeCsv(c.headOfficeAddress),
      escapeCsv(c.registrationPortal),
      escapeCsv(c.approval?.vendorNumber ?? ''),
      escapeCsv(approvedCats),
      escapeCsv(c.approval?.approvalDate ?? ''),
      escapeCsv(c.approval?.validUntil ?? ''),
      escapeCsv(c.nextFollowUpDate ?? ''),
      escapeCsv(c.opportunities?.length || 0),
      escapeCsv(totalRfqValue),
      escapeCsv(c.contacts?.length || 0),
      escapeCsv(c.communicationLogs?.length || 0),
      escapeCsv(c.notes),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export interface DashboardMetrics {
  totalCompanies: number;
  contacted: number;
  applicationsActive: number;
  approvedVendors: number;
  pendingApprovals: number;
  monthlyProcurementSpend: number;
  pendingFollowUps: number;
  rejectedOrInactive: number;
  successRate: number;
  averageTurnaroundDays: number;
  pipelineStages: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

export function calculateDashboardMetrics(companies: Company[]): DashboardMetrics {
  const total = companies.length;
  if (total === 0) {
    return {
      totalCompanies: 0,
      contacted: 0,
      applicationsActive: 0,
      approvedVendors: 0,
      pendingApprovals: 0,
      monthlyProcurementSpend: 0,
      pendingFollowUps: 0,
      rejectedOrInactive: 0,
      successRate: 0,
      averageTurnaroundDays: 0,
      pipelineStages: [],
    };
  }

  let contactedCount = 0;
  let activeCount = 0;
  let approvedCount = 0;
  let pendingApprovalsCount = 0;
  let totalSpend = 0;
  let rejectedCount = 0;
  let pendingFollowUpCount = 0;
  let totalApprovalDays = 0;
  let approvedWithDuration = 0;

  // Stage counters for funnel
  let sIdentified = 0;
  let sContacted = 0;
  let sRequirements = 0;
  let sSubmitted = 0;
  let sApproved = 0;

  for (const c of companies) {
    const s = c.registrationStatus;

    if (s !== 'Identified') contactedCount++;

    if (s === 'Requirements Received' || s === 'Documents In Preparation' || s === 'Submitted' || s === 'Under Evaluation') {
      activeCount++;
    }

    if (s === 'Submitted' || s === 'Under Evaluation') {
      pendingApprovalsCount++;
    }

    if (s === 'Approved' || s === 'Conditionally Approved') {
      approvedCount++;
      if (c.evaluation.registrationDurationDays > 0) {
        totalApprovalDays += c.evaluation.registrationDurationDays;
        approvedWithDuration++;
      }
    }

    // Accumulate opportunities estimated values as monthly procurement volume
    if (c.opportunities && c.opportunities.length > 0) {
      for (const opp of c.opportunities) {
        totalSpend += opp.estimatedValue || 0;
      }
    }

    if (s === 'Rejected' || s === 'On Hold') {
      rejectedCount++;
    }

    if (c.nextFollowUpDate) {
      pendingFollowUpCount++;
    }

    // Funnel accumulation:
    sIdentified++;
    if (s !== 'Identified') sContacted++;
    if (s === 'Requirements Received' || s === 'Documents In Preparation' || s === 'Submitted' || s === 'Under Evaluation' || s === 'Approved' || s === 'Conditionally Approved') {
      sRequirements++;
    }
    if (s === 'Submitted' || s === 'Under Evaluation' || s === 'Approved' || s === 'Conditionally Approved') {
      sSubmitted++;
    }
    if (s === 'Approved' || s === 'Conditionally Approved') {
      sApproved++;
    }
  }

  const successRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
  const averageTurnaroundDays = approvedWithDuration > 0 ? Math.round(totalApprovalDays / approvedWithDuration) : 24;

  const pipelineStages = [
    { stage: 'Identified', count: sIdentified, percentage: Math.round((sIdentified / total) * 100) },
    { stage: 'Contacted', count: sContacted, percentage: Math.round((sContacted / total) * 100) },
    { stage: 'Requirements Received', count: sRequirements, percentage: Math.round((sRequirements / total) * 100) },
    { stage: 'Application Submitted', count: sSubmitted, percentage: Math.round((sSubmitted / total) * 100) },
    { stage: 'Approved Vendor', count: sApproved, percentage: Math.round((sApproved / total) * 100) },
  ];

  return {
    totalCompanies: total,
    contacted: contactedCount,
    applicationsActive: activeCount,
    approvedVendors: approvedCount,
    pendingApprovals: pendingApprovalsCount,
    monthlyProcurementSpend: totalSpend,
    pendingFollowUps: pendingFollowUpCount,
    rejectedOrInactive: rejectedCount,
    successRate,
    averageTurnaroundDays,
    pipelineStages,
  };
}

export type VendorCategory = 'All' | 'Active' | 'Pending' | 'Flagged';

export function isCompanyInCategory(
  company: Company,
  category: VendorCategory,
  todayStr: string = new Date().toISOString().slice(0, 10)
): boolean {
  if (category === 'All') return true;

  if (category === 'Active') {
    return [
      'Contacted',
      'Requirements Received',
      'Documents In Preparation',
      'Submitted',
      'Under Evaluation',
      'Approved',
      'Conditionally Approved',
    ].includes(company.registrationStatus);
  }

  if (category === 'Pending') {
    return (
      company.registrationStatus === 'Submitted' ||
      company.registrationStatus === 'Under Evaluation'
    );
  }

  if (category === 'Flagged') {
    const isHighPriority = company.priority === 'High';
    const isSpecialAttention =
      company.registrationStatus === 'Rejected' ||
      company.registrationStatus === 'Conditionally Approved';
    const isOverdueFollowUp = Boolean(
      company.nextFollowUpDate && company.nextFollowUpDate <= todayStr
    );
    const hasBlockedChecklist = company.checklist?.some(
      (item) => item.status === 'blocked'
    );

    return isHighPriority || isSpecialAttention || isOverdueFollowUp || hasBlockedChecklist;
  }

  return true;
}

export function countCompaniesByCategories(
  companies: Company[],
  todayStr: string = new Date().toISOString().slice(0, 10)
): Record<VendorCategory, number> {
  const counts: Record<VendorCategory, number> = {
    All: companies.length,
    Active: 0,
    Pending: 0,
    Flagged: 0,
  };

  for (const c of companies) {
    if (isCompanyInCategory(c, 'Active', todayStr)) counts.Active++;
    if (isCompanyInCategory(c, 'Pending', todayStr)) counts.Pending++;
    if (isCompanyInCategory(c, 'Flagged', todayStr)) counts.Flagged++;
  }

  return counts;
}

export const DEFAULT_INDUSTRY_TYPES: string[] = [
  'Telecommunications & Digital Services',
  'Conglomerates & Real Estate Development',
  'Construction & Civil Infrastructure',
  'Banking & Financial Institutions',
  'Special Economic Zone & Megaprojects',
  'Apparel Manufacturing & Industrial Parks',
  'Logistics, Shipping & Industrial Solutions',
  'Healthcare, Pharmaceuticals & FMCG',
  'Hospitality, Maritime & Renewable Power',
  'Apparel & Tech Innovation',
  'Renewable Energy & Solar Parks',
  'Power Generation & Utilities',
  'Aviation & Airport Infrastructure',
  'Automotive & Heavy Equipment',
  'Food & Beverage Processing',
  'Information Technology & Data Centers',
];

export function validateIndustryTypeName(name: string, existing: string[]): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Industry name cannot be empty.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Industry name must be at least 2 characters long.' };
  }
  if (trimmed.length > 80) {
    return { valid: false, error: 'Industry name cannot exceed 80 characters.' };
  }
  const exists = existing.some((item) => item.toLowerCase().trim() === trimmed.toLowerCase());
  if (exists) {
    return { valid: false, error: `Industry "${trimmed}" already exists.` };
  }
  return { valid: true };
}

export type IndustryCategory =
  | 'All'
  | 'Construction'
  | 'Manufacturing'
  | 'Finance'
  | 'Telecom'
  | 'Logistics'
  | 'Hospitality'
  | 'Healthcare'
  | 'Conglomerate'
  | 'Other';

export function getIndustryCategory(industryStr: string): IndustryCategory {
  if (!industryStr) return 'Other';
  const s = industryStr.toLowerCase();

  if (s.includes('conglomerate')) {
    return 'Conglomerate';
  }
  if (
    s.includes('logistics') ||
    s.includes('shipping') ||
    s.includes('freight') ||
    s.includes('supply chain')
  ) {
    return 'Logistics';
  }
  if (
    s.includes('hospitality') ||
    s.includes('hotel') ||
    s.includes('tourism') ||
    s.includes('maritime') ||
    s.includes('renewable power')
  ) {
    return 'Hospitality';
  }
  if (
    s.includes('health') ||
    s.includes('pharma') ||
    s.includes('fmcg') ||
    s.includes('medical')
  ) {
    return 'Healthcare';
  }
  if (
    s.includes('telecom') ||
    s.includes('digital') ||
    s.includes('broadband') ||
    s.includes('software')
  ) {
    return 'Telecom';
  }
  if (s.includes('bank') || s.includes('financ') || s.includes('insurance')) {
    return 'Finance';
  }
  if (
    s.includes('construction') ||
    s.includes('infrastructure') ||
    s.includes('megaproject') ||
    s.includes('civil') ||
    s.includes('zone') ||
    s.includes('estate')
  ) {
    return 'Construction';
  }
  if (
    s.includes('apparel') ||
    s.includes('manufacturing') ||
    s.includes('industrial') ||
    s.includes('fabric') ||
    s.includes('textile')
  ) {
    return 'Manufacturing';
  }

  return 'Other';
}

export interface IndustryCategoryOption {
  key: IndustryCategory;
  label: string;
  count: number;
}

export function countCompaniesByIndustryCategory(companies: Company[]): IndustryCategoryOption[] {
  const countsMap = new Map<IndustryCategory, number>();
  countsMap.set('All', companies.length);

  for (const c of companies) {
    const cat = getIndustryCategory(c.industry);
    countsMap.set(cat, (countsMap.get(cat) || 0) + 1);
  }

  // Predefined preferred ordering
  const order: IndustryCategory[] = [
    'All',
    'Construction',
    'Manufacturing',
    'Finance',
    'Telecom',
    'Logistics',
    'Hospitality',
    'Healthcare',
    'Conglomerate',
    'Other',
  ];

  const results: IndustryCategoryOption[] = [];
  for (const cat of order) {
    const count = countsMap.get(cat) || 0;
    if (cat === 'All' || count > 0) {
      results.push({
        key: cat,
        label: cat,
        count,
      });
    }
  }

  return results;
}

export interface CountdownResult {
  text: string;
  label: string;
  status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';
  daysDiff: number;
  colorClass: string;
}

export function formatScheduleCountdown(
  dateStr?: string,
  referenceDateStr: string = new Date().toISOString().slice(0, 10)
): CountdownResult {
  if (!dateStr) {
    return {
      text: '—',
      label: 'None',
      status: 'none',
      daysDiff: 0,
      colorClass: 'text-slate-400 bg-slate-50 border-slate-200',
    };
  }

  const target = new Date(dateStr + 'T00:00:00');
  const ref = new Date(referenceDateStr + 'T00:00:00');
  const diffMs = target.getTime() - ref.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: `${overdueDays}d ago`,
      label: `Overdue ${overdueDays}d`,
      status: 'overdue',
      daysDiff: diffDays,
      colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
    };
  }

  if (diffDays === 0) {
    return {
      text: 'Today',
      label: 'Due Today',
      status: 'today',
      daysDiff: 0,
      colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
    };
  }

  if (diffDays === 1) {
    return {
      text: 'Tomorrow',
      label: 'Due Tomorrow',
      status: 'tomorrow',
      daysDiff: 1,
      colorClass: 'text-sky-800 bg-sky-50 border-sky-200',
    };
  }

  return {
    text: `In ${diffDays}d`,
    label: `In ${diffDays} Days`,
    status: 'upcoming',
    daysDiff: diffDays,
    colorClass: 'text-blue-800 bg-blue-50 border-blue-200',
  };
}

export function recordClientWin(
  company: Company,
  options?: {
    vendorNumber?: string;
    approvedCategories?: string[];
    approvalDate?: string;
    validUntil?: string;
  }
): Company {
  const approvalDate = options?.approvalDate || new Date().toISOString().slice(0, 10);
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const validUntil = options?.validUntil || oneYearLater;
  const vendorNumber = options?.vendorNumber || `INV-VEND-${company.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}-${new Date().getFullYear()}`;
  const approvedCategories =
    options?.approvedCategories && options.approvedCategories.length > 0
      ? options.approvedCategories
      : ['Aluminium Fabrications', 'Glass & Curtain Wall', 'Structural Steel'];

  // Update checklist items in Phase G (Registration decision) to completed
  const updatedChecklist = company.checklist.map((item) => {
    if (item.phase === 'G' && (item.title.toLowerCase().includes('approved') || item.title.toLowerCase().includes('decision') || item.title.toLowerCase().includes('certificate') || item.title.toLowerCase().includes('vendor number'))) {
      return {
        ...item,
        status: 'completed' as const,
        completionDate: approvalDate,
      };
    }
    return item;
  });

  return {
    ...company,
    registrationStatus: 'Approved',
    priority: 'High',
    approval: {
      ...company.approval,
      status: 'Approved',
      vendorNumber,
      approvalDate,
      validUntil,
      approvedCategories,
    },
    intelligence: {
      ...company.intelligence,
      totalScore: Math.max(92, company.intelligence.totalScore),
      tier: 'High-priority target',
    },
    checklist: updatedChecklist,
    updatedAt: new Date().toISOString(),
  };
}

export interface UpcomingScheduleAlert {
  company: Company;
  countdown: CountdownResult;
}

export function getUpcomingScheduleAlerts(
  companies: Company[],
  referenceDateStr: string = new Date().toISOString().slice(0, 10),
  limit: number = 8
): UpcomingScheduleAlert[] {
  const withSchedule = companies
    .filter((c) => Boolean(c.nextFollowUpDate))
    .map((c) => ({
      company: c,
      countdown: formatScheduleCountdown(c.nextFollowUpDate, referenceDateStr),
    }))
    .sort((a, b) => a.countdown.daysDiff - b.countdown.daysDiff);

  return withSchedule.slice(0, limit);
}

export const REPRESENTATIVE_PRESETS: string[] = [
  'Ranil Jayasuriya (Sr. BD Manager)',
  'Nadeeka Senanayake (Business Development Lead)',
  'Kasun Wickrama (BD Executive)',
  'Amara Fernando (Key Account Manager)',
  'Dinesh Silva (Corporate Relations)',
];

export const ALL_REGISTRATION_STATUSES: RegistrationStatus[] = [
  'Identified',
  'Contacted',
  'Requirements Received',
  'Documents In Preparation',
  'Submitted',
  'Under Evaluation',
  'Approved',
  'Conditionally Approved',
  'Rejected',
  'On Hold',
];

export function bulkAssignRepresentative(
  companies: Company[],
  companyIds: string[],
  officerName: string
): Company[] {
  if (!companyIds || companyIds.length === 0 || !officerName) return companies;
  const now = new Date().toISOString();
  return companies.map((c) => {
    if (companyIds.includes(c.id)) {
      return {
        ...c,
        assignedOfficer: officerName,
        updatedAt: now,
      };
    }
    return c;
  });
}

export function bulkUpdateCompanyStatus(
  companies: Company[],
  companyIds: string[],
  status: RegistrationStatus
): Company[] {
  if (!companyIds || companyIds.length === 0) return companies;
  const isApproved = status === 'Approved';
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  return companies.map((c) => {
    if (companyIds.includes(c.id)) {
      return {
        ...c,
        registrationStatus: status,
        approval: {
          ...c.approval,
          status: isApproved ? 'Approved' : c.approval.status,
          approvalDate: isApproved ? today : c.approval.approvalDate,
        },
        updatedAt: now,
      };
    }
    return c;
  });
}

