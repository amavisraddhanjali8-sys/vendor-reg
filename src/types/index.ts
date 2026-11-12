export type RegistrationPhaseKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type ChecklistItemStatus = 'not_started' | 'in_progress' | 'completed' | 'not_applicable' | 'blocked';

export interface ChecklistItem {
  id: string;
  phase: RegistrationPhaseKey;
  phaseName: string;
  title: string;
  status: ChecklistItemStatus;
  responsiblePerson: string;
  startDate?: string;
  deadline?: string;
  completionDate?: string;
  followUpDate?: string;
  notes?: string;
  evidenceAttachment?: string;
  isVerified?: boolean;
  activityHistory?: Array<{
    timestamp: string;
    action: string;
    user: string;
  }>;
}

export type CompanyPriority = 'High' | 'Medium' | 'Low' | 'Not Feasible';

export type RegistrationStatus =
  | 'Identified'
  | 'Contacted'
  | 'Requirements Received'
  | 'Documents In Preparation'
  | 'Submitted'
  | 'Under Evaluation'
  | 'Approved'
  | 'Conditionally Approved'
  | 'Rejected'
  | 'On Hold';

export interface RegistrationIntelligence {
  businessOpportunity: number;      // 0 - 100, weight 25%
  companySuitability: number;        // 0 - 100, weight 20%
  registrationAccessibility: number; // 0 - 100, weight 15%
  potentialProjectValue: number;     // 0 - 100, weight 20%
  relationshipAccessibility: number; // 0 - 100, weight 10%
  registrationCostEffort: number;    // 0 - 100, weight 10%
  totalScore: number;                // 0 - 100
  tier: 'High-priority target' | 'Medium-priority target' | 'Low-priority target' | 'Registration not currently feasible';
  justificationNotes?: string;
}

export interface CompanyContact {
  id: string;
  name: string;
  designation: string;
  department: 'Procurement' | 'Purchasing' | 'Engineering / Technical' | 'Finance' | 'Executive' | 'Site Management';
  email: string;
  phone: string;
  isPrimary: boolean;
  notes?: string;
}

export interface CommunicationLog {
  id: string;
  date: string;
  type: 'Call' | 'Email' | 'WhatsApp' | 'Meeting' | 'Site Visit';
  contactPerson: string;
  summary: string;
  outcome: string;
  nextFollowUpDate?: string;
  loggedBy: string;
}

export interface CompanyDocument {
  id: string;
  title: string;
  category: 'Legal & Incorporation' | 'Tax & Financial' | 'Technical & QA' | 'HSE & Safety' | 'Past Projects & References' | 'Vendor Forms';
  status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Missing' | 'Submitted';
  issueDate?: string;
  expiryDate?: string;
  fileName?: string;
  fileSize?: string;
  notes?: string;
  isMandatory: boolean;
}

export interface SubmissionDetails {
  submissionDate?: string;
  referenceNumber?: string;
  channel: 'Online Vendor Portal' | 'Official Procurement Email' | 'Physical Courier' | 'In-Person Submission';
  recipientName?: string;
  recipientDesignation?: string;
  confirmationReceived: boolean;
  expectedEvaluationDate?: string;
  notes?: string;
}

export interface ApprovalDetails {
  vendorNumber?: string;
  portalLogin?: string;
  approvedCategories: string[];
  approvalDate?: string;
  validUntil?: string;
  renewalReminderDays: number;
  status: 'Approved' | 'Conditionally Approved' | 'Pending' | 'Rejected';
  notes?: string;
}

export interface ProcurementOpportunity {
  id: string;
  title: string;
  category: string;
  estimatedValue: number;
  rfqDate: string;
  deadline: string;
  status: 'Identified' | 'Under Bid' | 'Submitted' | 'Won' | 'Lost';
  referenceNo?: string;
}

export interface PostRegistrationEvaluation {
  overallRating: number; // 1 to 5
  responsiveness: 'High' | 'Moderate' | 'Slow';
  communicationQuality: 'Excellent' | 'Good' | 'Average' | 'Poor';
  opportunityAccess: 'Immediate RFQ access' | 'Annual tenders only' | 'Project based' | 'Minimal opportunities';
  registrationDurationDays: number;
  lessonsLearned: string;
  nextReviewDate?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  companyType: 'PLC' | 'Pvt Ltd' | 'Government / Semi-Gov' | 'Multinational' | 'Joint Venture';
  website: string;
  headOfficeAddress: string;
  mainTelephone: string;
  procurementEmail: string;
  procurementContact: string;
  registrationPortal?: string;
  priority: CompanyPriority;
  registrationStatus: RegistrationStatus;
  assignedOfficer: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  nextFollowUpDate?: string;

  // Intelligence scoring
  intelligence: RegistrationIntelligence;

  // Contacts
  contacts: CompanyContact[];

  // 115-item Master Checklist
  checklist: ChecklistItem[];

  // Documents
  documents: CompanyDocument[];

  // Communication logs
  communicationLogs: CommunicationLog[];

  // Submission info
  submission: SubmissionDetails;

  // Approval info
  approval: ApprovalDetails;

  // Post evaluation
  evaluation: PostRegistrationEvaluation;

  // Opportunities / RFQs
  opportunities: ProcurementOpportunity[];
}

export interface NotificationLog {
  id: string;
  companyId: string;
  companyName: string;
  channel: 'Email' | 'WhatsApp';
  recipient: string;
  event: string;
  message: string;
  sentAt: string;
  status: 'Delivered' | 'Queued' | 'Failed';
  readAt?: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  username: string;
  email: string;
  role: 'admin' | 'officer' | 'viewer';
  displayName?: string;
  twoFactorEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TwoFactorSetupData {
  secret: string;
  manualKey: string;
  qrCodeUrl: string;
  accountName: string;
  issuer: string;
}

