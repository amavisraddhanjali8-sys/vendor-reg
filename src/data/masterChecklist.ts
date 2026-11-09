import { ChecklistItem, RegistrationPhaseKey } from '../types';

export interface PhaseDefinition {
  key: RegistrationPhaseKey;
  name: string;
  description: string;
  expectedItemCount: number;
}

export const REGISTRATION_PHASES: PhaseDefinition[] = [
  {
    key: 'A',
    name: 'Company Research & Identification',
    description: 'Find company, industry, procurement division, legal standing and business opportunities.',
    expectedItemCount: 10,
  },
  {
    key: 'B',
    name: 'Initial Telephone Contact',
    description: 'Call the company, introduce INNOVISTA, establish procurement relations and discover the registration procedure.',
    expectedItemCount: 13,
  },
  {
    key: 'C',
    name: 'Registration Requirements',
    description: 'Obtain vendor application forms, eligibility criteria, mandatory certificates and supplier guidelines.',
    expectedItemCount: 13,
  },
  {
    key: 'D',
    name: 'Document Preparation',
    description: 'Prepare certificates, company profile, financial records, engineering catalogues, QA/HSE and signed declarations.',
    expectedItemCount: 29,
  },
  {
    key: 'E',
    name: 'Application Submission',
    description: 'Complete forms, verify completeness, apply seal, submit through official channels and record references.',
    expectedItemCount: 13,
  },
  {
    key: 'F',
    name: 'Follow-Up & Evaluation',
    description: 'Track queries, submit additional records, attend site inspections or technical prequalification meetings.',
    expectedItemCount: 12,
  },
  {
    key: 'G',
    name: 'Registration Completion',
    description: 'Obtain approved vendor number, portal credentials, authorized trade categories, validity and purchasing instructions.',
    expectedItemCount: 11,
  },
  {
    key: 'H',
    name: 'Post-Registration Evaluation',
    description: 'Evaluate registration speed, procurement responsiveness, quotation access, and maintain quarterly relationship cadence.',
    expectedItemCount: 14,
  },
];

export interface RawChecklistDefinition {
  phase: RegistrationPhaseKey;
  itemNumber: number;
  title: string;
}

export const MASTER_CHECKLIST_DEFINITIONS: RawChecklistDefinition[] = [
  // Phase A: Company research (10)
  { phase: 'A', itemNumber: 1, title: 'Verify legal company name and registration status' },
  { phase: 'A', itemNumber: 2, title: 'Identify industry and business operations' },
  { phase: 'A', itemNumber: 3, title: 'Record company website and head office address' },
  { phase: 'A', itemNumber: 4, title: 'Identify procurement/vendor management division' },
  { phase: 'A', itemNumber: 5, title: 'Identify relevant purchasing categories' },
  { phase: 'A', itemNumber: 6, title: 'Identify potential opportunities for aluminium, glass, steel and construction services' },
  { phase: 'A', itemNumber: 7, title: 'Find procurement manager or purchasing officer' },
  { phase: 'A', itemNumber: 8, title: 'Obtain official telephone number and email address' },
  { phase: 'A', itemNumber: 9, title: 'Identify supplier registration portal or procedure' },
  { phase: 'A', itemNumber: 10, title: 'Assess company suitability and registration priority' },

  // Phase B: Initial telephone contact (13)
  { phase: 'B', itemNumber: 1, title: 'Prepare company introduction and call objectives' },
  { phase: 'B', itemNumber: 2, title: 'Call the company main telephone number' },
  { phase: 'B', itemNumber: 3, title: 'Request procurement or supplier registration department' },
  { phase: 'B', itemNumber: 4, title: 'Record name and designation of person contacted' },
  { phase: 'B', itemNumber: 5, title: "Explain INNOVISTA's business and service capabilities" },
  { phase: 'B', itemNumber: 6, title: 'Ask whether new vendor registrations are accepted' },
  { phase: 'B', itemNumber: 7, title: 'Ask for registration procedure and eligibility criteria' },
  { phase: 'B', itemNumber: 8, title: 'Ask for required documents and application forms' },
  { phase: 'B', itemNumber: 9, title: 'Ask about registration fees, if applicable' },
  { phase: 'B', itemNumber: 10, title: 'Ask about evaluation timeline' },
  { phase: 'B', itemNumber: 11, title: 'Obtain official contact email' },
  { phase: 'B', itemNumber: 12, title: 'Record call outcome and next action' },
  { phase: 'B', itemNumber: 13, title: 'Schedule next follow-up' },

  // Phase C: Registration requirements (13)
  { phase: 'C', itemNumber: 1, title: 'Receive vendor application form' },
  { phase: 'C', itemNumber: 2, title: 'Receive supplier code of conduct' },
  { phase: 'C', itemNumber: 3, title: 'Receive supplier self-declaration' },
  { phase: 'C', itemNumber: 4, title: 'Receive vendor profile or prequalification form' },
  { phase: 'C', itemNumber: 5, title: 'Obtain document checklist' },
  { phase: 'C', itemNumber: 6, title: 'Confirm mandatory registrations and certificates' },
  { phase: 'C', itemNumber: 7, title: 'Confirm financial qualification requirements' },
  { phase: 'C', itemNumber: 8, title: 'Confirm technical qualification requirements' },
  { phase: 'C', itemNumber: 9, title: 'Confirm previous project/reference requirements' },
  { phase: 'C', itemNumber: 10, title: 'Confirm insurance and HSE requirements' },
  { phase: 'C', itemNumber: 11, title: 'Confirm quality management requirements' },
  { phase: 'C', itemNumber: 12, title: 'Confirm payment and banking requirements' },
  { phase: 'C', itemNumber: 13, title: 'Confirm submission deadline and submission method' },

  // Phase D: Document preparation (29)
  { phase: 'D', itemNumber: 1, title: 'Certificate of Incorporation' },
  { phase: 'D', itemNumber: 2, title: 'Company Form 01 / applicable incorporation documents' },
  { phase: 'D', itemNumber: 3, title: 'Latest company profile' },
  { phase: 'D', itemNumber: 4, title: 'Business Registration details, if applicable' },
  { phase: 'D', itemNumber: 5, title: 'TIN certificate' },
  { phase: 'D', itemNumber: 6, title: 'VAT registration certificate, if applicable' },
  { phase: 'D', itemNumber: 7, title: 'Current business address confirmation' },
  { phase: 'D', itemNumber: 8, title: 'Directors and authorized signatory details' },
  { phase: 'D', itemNumber: 9, title: 'Beneficial ownership information, if required' },
  { phase: 'D', itemNumber: 10, title: 'Company bank account confirmation or bank letter' },
  { phase: 'D', itemNumber: 11, title: 'Audited financial statements, if available/required' },
  { phase: 'D', itemNumber: 12, title: 'Management accounts, if requested' },
  { phase: 'D', itemNumber: 13, title: 'Company organizational chart' },
  { phase: 'D', itemNumber: 14, title: 'Company service and product catalogue' },
  { phase: 'D', itemNumber: 15, title: 'Completed project portfolio' },
  { phase: 'D', itemNumber: 16, title: 'Client recommendation letters' },
  { phase: 'D', itemNumber: 17, title: 'Client reference details' },
  { phase: 'D', itemNumber: 18, title: 'Technical capability statement' },
  { phase: 'D', itemNumber: 19, title: 'Machinery and equipment details' },
  { phase: 'D', itemNumber: 20, title: 'Human resource capability statement' },
  { phase: 'D', itemNumber: 21, title: 'Quality assurance policy' },
  { phase: 'D', itemNumber: 22, title: 'HSE policy and safety documentation' },
  { phase: 'D', itemNumber: 23, title: 'Environmental policy, if required' },
  { phase: 'D', itemNumber: 24, title: 'Insurance certificates, if required' },
  { phase: 'D', itemNumber: 25, title: 'Tax compliance documents, if required' },
  { phase: 'D', itemNumber: 26, title: 'Supplier code of conduct signed' },
  { phase: 'D', itemNumber: 27, title: 'Supplier self-declaration completed' },
  { phase: 'D', itemNumber: 28, title: 'All requested declarations signed' },
  { phase: 'D', itemNumber: 29, title: 'Document validity and expiry verification' },

  // Phase E: Application submission (13)
  { phase: 'E', itemNumber: 1, title: 'Complete all application form fields' },
  { phase: 'E', itemNumber: 2, title: 'Verify information against company records' },
  { phase: 'E', itemNumber: 3, title: 'Verify supporting document completeness' },
  { phase: 'E', itemNumber: 4, title: 'Obtain authorized signature' },
  { phase: 'E', itemNumber: 5, title: 'Apply company seal where required' },
  { phase: 'E', itemNumber: 6, title: 'Prepare digital and physical submission copies' },
  { phase: 'E', itemNumber: 7, title: 'Submit application through official channel' },
  { phase: 'E', itemNumber: 8, title: 'Record submission date and time' },
  { phase: 'E', itemNumber: 9, title: 'Record application/reference number' },
  { phase: 'E', itemNumber: 10, title: 'Save submission confirmation' },
  { phase: 'E', itemNumber: 11, title: 'Record recipient and contact person' },
  { phase: 'E', itemNumber: 12, title: 'Confirm receipt with procurement department' },
  { phase: 'E', itemNumber: 13, title: 'Record expected evaluation date' },

  // Phase F: Follow-up and evaluation (12)
  { phase: 'F', itemNumber: 1, title: 'Send submission acknowledgment follow-up' },
  { phase: 'F', itemNumber: 2, title: 'Check application status' },
  { phase: 'F', itemNumber: 3, title: 'Respond to procurement queries' },
  { phase: 'F', itemNumber: 4, title: 'Submit additional requested documents' },
  { phase: 'F', itemNumber: 5, title: 'Arrange requested meetings or interviews' },
  { phase: 'F', itemNumber: 6, title: 'Attend technical assessment if required' },
  { phase: 'F', itemNumber: 7, title: 'Attend financial or compliance assessment if required' },
  { phase: 'F', itemNumber: 8, title: 'Record site inspection requirements' },
  { phase: 'F', itemNumber: 9, title: 'Record assessment feedback' },
  { phase: 'F', itemNumber: 10, title: 'Resolve deficiencies or non-conformities' },
  { phase: 'F', itemNumber: 11, title: 'Confirm final evaluation decision' },
  { phase: 'F', itemNumber: 12, title: 'Record decision communication and date' },

  // Phase G: Registration completion (11)
  { phase: 'G', itemNumber: 1, title: 'Receive formal approval confirmation' },
  { phase: 'G', itemNumber: 2, title: 'Receive approved vendor number' },
  { phase: 'G', itemNumber: 3, title: 'Receive vendor portal login, if applicable' },
  { phase: 'G', itemNumber: 4, title: 'Confirm approved service/product categories' },
  { phase: 'G', itemNumber: 5, title: 'Confirm registration validity period' },
  { phase: 'G', itemNumber: 6, title: 'Confirm renewal requirements' },
  { phase: 'G', itemNumber: 7, title: 'Confirm procurement contact details' },
  { phase: 'G', itemNumber: 8, title: 'Obtain purchasing and quotation submission instructions' },
  { phase: 'G', itemNumber: 9, title: 'Verify vendor record is active' },
  { phase: 'G', itemNumber: 10, title: 'Archive final approval documents' },
  { phase: 'G', itemNumber: 11, title: 'Update company status to Approved' },

  // Phase H: Post-registration evaluation (14)
  { phase: 'H', itemNumber: 1, title: 'Evaluate overall registration experience' },
  { phase: 'H', itemNumber: 2, title: 'Calculate total registration duration' },
  { phase: 'H', itemNumber: 3, title: 'Evaluate procurement department responsiveness' },
  { phase: 'H', itemNumber: 4, title: 'Evaluate communication quality' },
  { phase: 'H', itemNumber: 5, title: 'Assess approved service categories against INNOVISTA capabilities' },
  { phase: 'H', itemNumber: 6, title: 'Identify quotation invitation opportunities' },
  { phase: 'H', itemNumber: 7, title: 'Identify upcoming procurement projects' },
  { phase: 'H', itemNumber: 8, title: 'Establish ongoing procurement contact' },
  { phase: 'H', itemNumber: 9, title: 'Request introduction to relevant project teams' },
  { phase: 'H', itemNumber: 10, title: 'Plan quarterly relationship follow-up' },
  { phase: 'H', itemNumber: 11, title: 'Record lessons learned' },
  { phase: 'H', itemNumber: 12, title: 'Evaluate registration cost and time' },
  { phase: 'H', itemNumber: 13, title: 'Assign future business development actions' },
  { phase: 'H', itemNumber: 14, title: 'Set next review date' },
];

export function createDefaultCompanyChecklist(responsiblePerson: string = 'Business Development'): ChecklistItem[] {
  return MASTER_CHECKLIST_DEFINITIONS.map((def) => {
    const phaseInfo = REGISTRATION_PHASES.find((p) => p.key === def.phase);
    return {
      id: `${def.phase}-${String(def.itemNumber).padStart(2, '0')}`,
      phase: def.phase,
      phaseName: phaseInfo ? phaseInfo.name : `Phase ${def.phase}`,
      title: def.title,
      status: 'not_started',
      responsiblePerson: responsiblePerson,
      isVerified: false,
      activityHistory: [
        {
          timestamp: new Date().toISOString(),
          action: 'Item initialized in master registration checklist',
          user: 'System',
        },
      ],
    };
  });
}
