import { Company, CompanyDocument } from '../types';
import { createDefaultCompanyChecklist } from './masterChecklist';
import { calculateIntelligenceScore } from '../utils/rules';

const defaultDocsTemplate = (): CompanyDocument[] => [
  {
    id: 'doc-01',
    title: 'Certificate of Incorporation (PVT LTD)',
    category: 'Legal & Incorporation',
    status: 'Valid',
    issueDate: '2021-03-15',
    fileName: 'INNOVISTA_Certificate_of_Incorporation.pdf',
    fileSize: '1.4 MB',
    isMandatory: true,
  },
  {
    id: 'doc-02',
    title: 'Company Form 01 (Articles & Registry)',
    category: 'Legal & Incorporation',
    status: 'Valid',
    issueDate: '2021-03-15',
    fileName: 'INNOVISTA_Form_01_Registration.pdf',
    fileSize: '2.1 MB',
    isMandatory: true,
  },
  {
    id: 'doc-03',
    title: 'TIN Certificate (Inland Revenue)',
    category: 'Tax & Financial',
    status: 'Valid',
    issueDate: '2021-04-10',
    fileName: 'INNOVISTA_TIN_Certificate.pdf',
    fileSize: '820 KB',
    isMandatory: true,
  },
  {
    id: 'doc-04',
    title: 'VAT Registration Certificate',
    category: 'Tax & Financial',
    status: 'Valid',
    issueDate: '2021-05-02',
    fileName: 'INNOVISTA_VAT_Registration.pdf',
    fileSize: '750 KB',
    isMandatory: true,
  },
  {
    id: 'doc-05',
    title: 'Audited Financial Statements (Last 3 Years)',
    category: 'Tax & Financial',
    status: 'Valid',
    issueDate: '2025-09-30',
    expiryDate: '2026-12-31',
    fileName: 'Audited_Financials_FY2023_2025.pdf',
    fileSize: '6.8 MB',
    isMandatory: true,
  },
  {
    id: 'doc-06',
    title: 'Bank Reference Letter (Commercial Bank)',
    category: 'Tax & Financial',
    status: 'Valid',
    issueDate: '2026-01-10',
    expiryDate: '2026-07-10',
    fileName: 'Commercial_Bank_Creditworthiness_Letter.pdf',
    fileSize: '640 KB',
    isMandatory: true,
  },
  {
    id: 'doc-07',
    title: 'Quality Assurance (QA) Policy Manual & ISO Plan',
    category: 'Technical & QA',
    status: 'Valid',
    issueDate: '2025-06-01',
    fileName: 'INNOVISTA_QA_Quality_Manual.pdf',
    fileSize: '3.2 MB',
    isMandatory: true,
  },
  {
    id: 'doc-08',
    title: 'HSE Safety Policy & Site Protocol Documentation',
    category: 'HSE & Safety',
    status: 'Valid',
    issueDate: '2025-07-15',
    fileName: 'INNOVISTA_HSE_Safety_Guidelines.pdf',
    fileSize: '2.8 MB',
    isMandatory: true,
  },
  {
    id: 'doc-09',
    title: 'Completed Project Portfolio (Aluminium, Glass & Steel)',
    category: 'Past Projects & References',
    status: 'Valid',
    issueDate: '2026-02-01',
    fileName: 'INNOVISTA_Major_Projects_Portfolio_2026.pdf',
    fileSize: '14.5 MB',
    isMandatory: true,
  },
  {
    id: 'doc-10',
    title: 'Machinery & Laser / CNC Fabrication Capability Statement',
    category: 'Technical & QA',
    status: 'Valid',
    issueDate: '2026-01-20',
    fileName: 'Fabrication_Plant_Machinery_List.pdf',
    fileSize: '4.1 MB',
    isMandatory: true,
  },
  {
    id: 'doc-11',
    title: 'Client Reference & Completion Letters',
    category: 'Past Projects & References',
    status: 'Valid',
    issueDate: '2025-11-12',
    fileName: 'Client_Testimonials_Reference_Letters.pdf',
    fileSize: '3.9 MB',
    isMandatory: false,
  },
];

export const INITIAL_COMPANIES: Company[] = [];

export const SAMPLE_TEMPLATE_COMPANIES: Company[] = [
  {
    id: 'comp-dialog-01',
    name: 'Dialog Axiata PLC',
    industry: 'Telecommunications & Digital Services',
    companyType: 'PLC',
    website: 'https://www.dialog.lk',
    headOfficeAddress: '475 Union Place, Colombo 02, Sri Lanka',
    mainTelephone: '+94 11 769 0000',
    procurementEmail: 'procurement@dialog.lk',
    procurementContact: 'Sudath Wickramasinghe (Head of Group Procurement)',
    registrationPortal: 'https://supplier.dialog.lk/portal',
    priority: 'High',
    registrationStatus: 'Approved',
    assignedOfficer: 'Ranil Jayasuriya (Sr. BD Manager)',
    notes: 'Major telecom conglomerate. Approved for structural steel antenna mounts, architectural aluminium retail storefronts, and interior glass cladding.',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-10-20T14:30:00Z',
    nextFollowUpDate: '2026-11-20',
    intelligence: {
      businessOpportunity: 95,
      companySuitability: 92,
      registrationAccessibility: 85,
      potentialProjectValue: 90,
      relationshipAccessibility: 80,
      registrationCostEffort: 85,
      ...calculateIntelligenceScore({
        businessOpportunity: 95,
        companySuitability: 92,
        registrationAccessibility: 85,
        potentialProjectValue: 90,
        relationshipAccessibility: 80,
        registrationCostEffort: 85,
      }),
      justificationNotes: 'Massive recurring RFQs for telecom tower structural fabrication and retail experience stores across Sri Lanka.',
    },
    contacts: [
      {
        id: 'c-dia-1',
        name: 'Sudath Wickramasinghe',
        designation: 'Head of Group Procurement',
        department: 'Procurement',
        email: 'sudath.w@dialog.lk',
        phone: '+94 77 733 4455',
        isPrimary: true,
      },
      {
        id: 'c-dia-2',
        name: 'Chamara Perera',
        designation: 'Senior Category Manager - Infrastructure & Works',
        department: 'Purchasing',
        email: 'chamara.p@dialog.lk',
        phone: '+94 77 799 1122',
        isPrimary: false,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Ranil Jayasuriya');
      // Mark phases A to G completed for approved vendor
      list.forEach((item) => {
        if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(item.phase)) {
          item.status = 'completed';
          item.completionDate = '2026-09-15';
          item.isVerified = true;
        } else if (item.phase === 'H') {
          // In progress evaluation
          item.status = item.id === 'H-01' || item.id === 'H-02' ? 'completed' : 'in_progress';
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-dia-1',
        date: '2026-02-04 10:30 AM',
        type: 'Call',
        contactPerson: 'Sudath Wickramasinghe',
        summary: 'Introductory call discussing INNOVISTA metal fabrication & glass curtain capabilities for retail stores.',
        outcome: 'Procurement team shared vendor onboarding link and supplier code of conduct.',
        nextFollowUpDate: '2026-02-18',
        loggedBy: 'Ranil Jayasuriya',
      },
      {
        id: 'log-dia-2',
        date: '2026-04-12 02:00 PM',
        type: 'Site Visit',
        contactPerson: 'Chamara Perera & Technical Inspection Team',
        summary: 'Factory audit of INNOVISTA CNC bending, laser cutting and powder coating facility.',
        outcome: 'Audit passed with 94% technical score. Prequalification criteria fully met.',
        loggedBy: 'Ranil Jayasuriya',
      },
      {
        id: 'log-dia-3',
        date: '2026-09-15 11:15 AM',
        type: 'Email',
        contactPerson: 'Dialog Vendor Management Unit',
        summary: 'Received official vendor registration confirmation letter and SAP supplier ID.',
        outcome: 'Approved vendor status activated.',
        loggedBy: 'Ranil Jayasuriya',
      },
    ],
    submission: {
      submissionDate: '2026-05-10',
      referenceNumber: 'DIA-SUP-2026-VR-9081',
      channel: 'Online Vendor Portal',
      recipientName: 'Dialog Vendor Registration Committee',
      recipientDesignation: 'Group SCM',
      confirmationReceived: true,
      expectedEvaluationDate: '2026-06-30',
      notes: 'Submitted all 29 documentation requirements digitally with digital signatures.',
    },
    approval: {
      vendorNumber: 'DIA-VND-2026-084',
      portalLogin: 'https://supplier.dialog.lk (User: INNOVISTA_LTD)',
      approvedCategories: [
        'Architectural Aluminium Fabrication',
        'Structural Steel & Antenna Mounts',
        'Commercial Facades & Tempered Glass Glazing',
        'Custom Metal Louvres & Cladding',
      ],
      approvalDate: '2026-09-15',
      validUntil: '2028-09-15',
      renewalReminderDays: 60,
      status: 'Approved',
      notes: 'Valid for 2-year cycle. Tier-1 preferred contractor status for regional retail refurbishments.',
    },
    evaluation: {
      overallRating: 5,
      responsiveness: 'High',
      communicationQuality: 'Excellent',
      opportunityAccess: 'Immediate RFQ access',
      registrationDurationDays: 38,
      lessonsLearned: 'Dialog values ISO compliance, factory safety audits, and automated CNC machinery capacity.',
      nextReviewDate: '2026-12-15',
    },
    opportunities: [
      {
        id: 'opp-dia-1',
        title: 'Dialog Axiata Regional Experience Hub - Aluminium Facade & Canopies',
        category: 'Architectural Aluminium Fabrication',
        estimatedValue: 14500000,
        rfqDate: '2026-10-05',
        deadline: '2026-11-28',
        status: 'Under Bid',
        referenceNo: 'RFQ/DIA/FAC/2026/044',
      },
      {
        id: 'opp-dia-2',
        title: 'Transmission Substation Structural Steel Support Frames',
        category: 'Structural Steel & Antenna Mounts',
        estimatedValue: 8200000,
        rfqDate: '2026-10-18',
        deadline: '2026-12-05',
        status: 'Identified',
        referenceNo: 'RFQ/DIA/TEL/2026/089',
      },
    ],
  },
  {
    id: 'comp-jkh-02',
    name: 'John Keells Holdings PLC',
    industry: 'Conglomerates & Real Estate Development',
    companyType: 'PLC',
    website: 'https://www.keells.com',
    headOfficeAddress: '117 Sir Chittampalam A. Gardiner Mawatha, Colombo 02',
    mainTelephone: '+94 11 230 6000',
    procurementEmail: 'procurement@keells.com',
    procurementContact: 'Priyantha Fernando (Vice President - Procurement)',
    registrationPortal: 'https://procure.keells.com/supplier',
    priority: 'High',
    registrationStatus: 'Submitted',
    assignedOfficer: 'Nadeeka Senanayake (Business Development Lead)',
    notes: 'Major real estate & leisure developer (Cinnamon Hotels & Resorts, Waterfront Properties). High volume for architectural glass and structural steel.',
    createdAt: '2026-03-01T08:30:00Z',
    updatedAt: '2026-10-28T16:00:00Z',
    nextFollowUpDate: '2026-11-12',
    intelligence: {
      businessOpportunity: 90,
      companySuitability: 90,
      registrationAccessibility: 80,
      potentialProjectValue: 95,
      relationshipAccessibility: 75,
      registrationCostEffort: 80,
      ...calculateIntelligenceScore({
        businessOpportunity: 90,
        companySuitability: 90,
        registrationAccessibility: 80,
        potentialProjectValue: 95,
        relationshipAccessibility: 75,
        registrationCostEffort: 80,
      }),
      justificationNotes: 'Massive capital expenditure in Cinnamon hospitality refurbishments and residential high-rise steel/glass projects.',
    },
    contacts: [
      {
        id: 'c-jkh-1',
        name: 'Priyantha Fernando',
        designation: 'Vice President - Group Procurement',
        department: 'Procurement',
        email: 'priyantha.f@keells.com',
        phone: '+94 11 230 6114',
        isPrimary: true,
      },
      {
        id: 'c-jkh-2',
        name: 'Dulan Samarasinghe',
        designation: 'Lead Project Engineer - Property Sector',
        department: 'Engineering / Technical',
        email: 'dulan.s@keells.com',
        phone: '+94 71 889 0011',
        isPrimary: false,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Nadeeka Senanayake');
      // Phases A, B, C, D completed, E completed (submitted)
      list.forEach((item) => {
        if (['A', 'B', 'C', 'D', 'E'].includes(item.phase)) {
          item.status = 'completed';
          item.completionDate = '2026-10-25';
          item.isVerified = true;
        } else if (item.phase === 'F') {
          item.status = 'in_progress';
          item.startDate = '2026-10-26';
          item.deadline = '2026-11-15';
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-jkh-1',
        date: '2026-03-10 11:00 AM',
        type: 'Call',
        contactPerson: 'Priyantha Fernando',
        summary: 'Initiated supplier inquiry with JKH Property & Infrastructure procurement unit.',
        outcome: 'Received invitation to submit prequalification dossier.',
        loggedBy: 'Nadeeka Senanayake',
      },
      {
        id: 'log-jkh-2',
        date: '2026-10-25 03:30 PM',
        type: 'Meeting',
        contactPerson: 'Dulan Samarasinghe',
        summary: 'Prequalification dossier submitted and confirmed via JKH procurement desk.',
        outcome: 'Evaluation in progress; committee review scheduled.',
        nextFollowUpDate: '2026-11-12',
        loggedBy: 'Nadeeka Senanayake',
      },
    ],
    submission: {
      submissionDate: '2026-10-25',
      referenceNumber: 'JKH-PROC-9921/2026',
      channel: 'Online Vendor Portal',
      recipientName: 'JKH Central Procurement Division',
      confirmationReceived: true,
      expectedEvaluationDate: '2026-11-20',
      notes: 'Complete 29-item submission file uploaded to JKH Vendor Portal with audited balance sheets.',
    },
    approval: {
      approvedCategories: [
        'Curtain Walling & Commercial Glazing',
        'Structural Steel Canopies & Walkways',
        'Architectural Metal Mesh & Cladding',
      ],
      renewalReminderDays: 45,
      status: 'Pending',
    },
    evaluation: {
      overallRating: 4,
      responsiveness: 'Moderate',
      communicationQuality: 'Good',
      opportunityAccess: 'Annual tenders only',
      registrationDurationDays: 22,
      lessonsLearned: 'Strict bank reference and audited balance sheet scrutiny.',
    },
    opportunities: [
      {
        id: 'opp-jkh-1',
        title: 'Cinnamon Lakeside Pavilion Structural Steel & Glass Enclosure',
        category: 'Curtain Walling & Commercial Glazing',
        estimatedValue: 28000000,
        rfqDate: '2026-10-28',
        deadline: '2026-12-10',
        status: 'Identified',
        referenceNo: 'JKH/CIN/2026/112',
      },
    ],
  },
  {
    id: 'comp-access-03',
    name: 'Access Engineering PLC',
    industry: 'Construction & Civil Infrastructure',
    companyType: 'PLC',
    website: 'https://www.accesseng.lk',
    headOfficeAddress: 'Access Towers, 278 Union Place, Colombo 02',
    mainTelephone: '+94 11 760 6606',
    procurementEmail: 'purchasing@accesseng.lk',
    procurementContact: 'Rohan Abeysekara (Director - Procurement)',
    registrationPortal: 'https://accesseng.lk/procurement',
    priority: 'High',
    registrationStatus: 'Under Evaluation',
    assignedOfficer: 'Ranil Jayasuriya (Sr. BD Manager)',
    notes: 'Major civil and infrastructure contractor. Seeking trusted specialized metal fabrication and bridge balustrade subcontractor.',
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-10-30T11:20:00Z',
    nextFollowUpDate: '2026-11-08',
    intelligence: {
      businessOpportunity: 88,
      companySuitability: 88,
      registrationAccessibility: 85,
      potentialProjectValue: 92,
      relationshipAccessibility: 80,
      registrationCostEffort: 85,
      ...calculateIntelligenceScore({
        businessOpportunity: 88,
        companySuitability: 88,
        registrationAccessibility: 85,
        potentialProjectValue: 92,
        relationshipAccessibility: 80,
        registrationCostEffort: 85,
      }),
      justificationNotes: 'Ongoing bridge, flyover, and commercial building developments requiring heavy structural steel fabrications.',
    },
    contacts: [
      {
        id: 'c-acc-1',
        name: 'Rohan Abeysekara',
        designation: 'Director - Procurement & Subcontracts',
        department: 'Procurement',
        email: 'rohan.a@accesseng.lk',
        phone: '+94 11 760 6610',
        isPrimary: true,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Ranil Jayasuriya');
      list.forEach((item) => {
        if (['A', 'B', 'C', 'D', 'E'].includes(item.phase)) {
          item.status = 'completed';
          item.isVerified = true;
        } else if (item.phase === 'F') {
          item.status = item.id === 'F-01' || item.id === 'F-02' ? 'completed' : 'in_progress';
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-acc-1',
        date: '2026-05-18 09:30 AM',
        type: 'Call',
        contactPerson: 'Rohan Abeysekara',
        summary: 'Discussed prequalification for stainless steel bridge railings and heavy metal brackets.',
        outcome: 'Form sent for sub-tier contractor registration.',
        loggedBy: 'Ranil Jayasuriya',
      },
      {
        id: 'log-acc-2',
        date: '2026-10-30 02:00 PM',
        type: 'Meeting',
        contactPerson: 'Access Engineering Prequalification Board',
        summary: 'Technical interview and presentation of INNOVISTA weld inspection and galvanizing testing logs.',
        outcome: 'Clarifications answered satisfactorily. Final evaluation decision expected next week.',
        nextFollowUpDate: '2026-11-08',
        loggedBy: 'Ranil Jayasuriya',
      },
    ],
    submission: {
      submissionDate: '2026-09-12',
      referenceNumber: 'AEL-SUB-2026/884',
      channel: 'Official Procurement Email',
      recipientName: 'Subcontracts Division',
      confirmationReceived: true,
      expectedEvaluationDate: '2026-11-10',
    },
    approval: {
      approvedCategories: ['Structural Steel Fabrications', 'Stainless Steel Railings & Balustrades'],
      renewalReminderDays: 30,
      status: 'Pending',
    },
    evaluation: {
      overallRating: 4,
      responsiveness: 'High',
      communicationQuality: 'Good',
      opportunityAccess: 'Project based',
      registrationDurationDays: 30,
      lessonsLearned: 'Access Engineering insists on welding inspection certificates and CIDA accreditation.',
    },
    opportunities: [
      {
        id: 'opp-acc-1',
        title: 'Central Highway Elevated Section Metal Crash Barriers & Railings',
        category: 'Structural Steel Fabrications',
        estimatedValue: 35000000,
        rfqDate: '2026-10-15',
        deadline: '2026-11-30',
        status: 'Under Bid',
        referenceNo: 'AEL/INFRA/2026/092',
      },
    ],
  },
  {
    id: 'comp-combank-04',
    name: 'Commercial Bank of Ceylon PLC',
    industry: 'Banking & Financial Institutions',
    companyType: 'PLC',
    website: 'https://www.combank.lk',
    headOfficeAddress: 'Commercial House, 21 Sir Razik Fareed Mawatha, Colombo 01',
    mainTelephone: '+94 11 248 6000',
    procurementEmail: 'premises_procurement@combank.net',
    procurementContact: 'Lalith De Silva (Senior Manager - Premises & Maintenance)',
    registrationPortal: 'https://www.combank.lk/procurement',
    priority: 'High',
    registrationStatus: 'Requirements Received',
    assignedOfficer: 'Kasun Wickrama (BD Executive)',
    notes: 'Largest private commercial bank in Sri Lanka with 270+ branches. Recurring requirements for security glass, ATM kiosks, and aluminium composite panels.',
    createdAt: '2026-06-01T09:00:00Z',
    updatedAt: '2026-10-22T15:10:00Z',
    nextFollowUpDate: '2026-11-10',
    intelligence: {
      businessOpportunity: 85,
      companySuitability: 86,
      registrationAccessibility: 82,
      potentialProjectValue: 80,
      relationshipAccessibility: 78,
      registrationCostEffort: 80,
      ...calculateIntelligenceScore({
        businessOpportunity: 85,
        companySuitability: 86,
        registrationAccessibility: 82,
        potentialProjectValue: 80,
        relationshipAccessibility: 78,
        registrationCostEffort: 80,
      }),
      justificationNotes: 'Branch refurbishment tenders released bi-annually. Requires bullet-resistant glass and architectural aluminium cladding.',
    },
    contacts: [
      {
        id: 'c-cb-1',
        name: 'Lalith De Silva',
        designation: 'Senior Manager - Premises & Maintenance',
        department: 'Procurement',
        email: 'lalith_ds@combank.net',
        phone: '+94 11 248 6190',
        isPrimary: true,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Kasun Wickrama');
      list.forEach((item) => {
        if (['A', 'B'].includes(item.phase)) {
          item.status = 'completed';
          item.isVerified = true;
        } else if (item.phase === 'C') {
          item.status = 'completed';
          item.isVerified = true;
        } else if (item.phase === 'D') {
          item.status = 'in_progress';
          item.startDate = '2026-10-20';
          item.deadline = '2026-11-15';
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-cb-1',
        date: '2026-06-12 11:30 AM',
        type: 'Call',
        contactPerson: 'Lalith De Silva',
        summary: 'Inquired about annual vendor list registration for branch fit-out contractors.',
        outcome: 'Forms and supplier declaration guidelines received via email.',
        loggedBy: 'Kasun Wickrama',
      },
    ],
    submission: {
      channel: 'Physical Courier',
      confirmationReceived: false,
    },
    approval: {
      approvedCategories: ['Security Glass & Partitions', 'Aluminium Composite Panel Cladding'],
      renewalReminderDays: 30,
      status: 'Pending',
    },
    evaluation: {
      overallRating: 3,
      responsiveness: 'Moderate',
      communicationQuality: 'Good',
      opportunityAccess: 'Annual tenders only',
      registrationDurationDays: 0,
      lessonsLearned: 'Bank vendor registration requires hardcopy submissions with notary attestation.',
    },
    opportunities: [],
  },
  {
    id: 'comp-portcity-05',
    name: 'Colombo Port City Economic Commission (CHEC)',
    industry: 'Special Economic Zone & Megaprojects',
    companyType: 'Joint Venture',
    website: 'https://www.portcitycolombo.lk',
    headOfficeAddress: 'Port City Colombo, Financial Centre Boulevard, Colombo',
    mainTelephone: '+94 11 211 5000',
    procurementEmail: 'vendor.reg@portcitycolombo.lk',
    procurementContact: 'Zhang Wei / H. Jinadasa (Contracts Dept)',
    registrationPortal: 'https://portal.portcitycolombo.lk/procure',
    priority: 'High',
    registrationStatus: 'Documents In Preparation',
    assignedOfficer: 'Ranil Jayasuriya (Sr. BD Manager)',
    notes: 'Sri Lanka’s flagship offshore financial city. Huge demand for marine-grade architectural aluminium, structural steel trusses, and acoustic facade glazing.',
    createdAt: '2026-05-15T11:00:00Z',
    updatedAt: '2026-10-29T10:45:00Z',
    nextFollowUpDate: '2026-11-14',
    intelligence: {
      businessOpportunity: 98,
      companySuitability: 94,
      registrationAccessibility: 75,
      potentialProjectValue: 98,
      relationshipAccessibility: 70,
      registrationCostEffort: 75,
      ...calculateIntelligenceScore({
        businessOpportunity: 98,
        companySuitability: 94,
        registrationAccessibility: 75,
        potentialProjectValue: 98,
        relationshipAccessibility: 70,
        registrationCostEffort: 75,
      }),
      justificationNotes: 'Multi-million dollar construction packages for marina, luxury villas, and financial plaza.',
    },
    contacts: [
      {
        id: 'c-pc-1',
        name: 'H. Jinadasa',
        designation: 'Senior Procurement Specialist',
        department: 'Procurement',
        email: 'h.jinadasa@portcitycolombo.lk',
        phone: '+94 11 211 5088',
        isPrimary: true,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Ranil Jayasuriya');
      list.forEach((item) => {
        if (['A', 'B', 'C'].includes(item.phase)) {
          item.status = 'completed';
          item.isVerified = true;
        } else if (item.phase === 'D') {
          // Half completed
          if (parseInt(item.id.replace('D-', ''), 10) <= 15) {
            item.status = 'completed';
          } else {
            item.status = 'in_progress';
          }
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-pc-1',
        date: '2026-05-25 02:00 PM',
        type: 'Meeting',
        contactPerson: 'H. Jinadasa',
        summary: 'Met with Port City engineering procurement cell to present INNOVISTA facade capabilities.',
        outcome: 'Received custom multi-lingual vendor registration dossier requirements.',
        loggedBy: 'Ranil Jayasuriya',
      },
    ],
    submission: {
      channel: 'Online Vendor Portal',
      confirmationReceived: false,
    },
    approval: {
      approvedCategories: [
        'Marine-Grade Architectural Aluminium',
        'Structural Steel Trusses',
        'Curtain Wall Acoustic Glazing',
      ],
      renewalReminderDays: 60,
      status: 'Pending',
    },
    evaluation: {
      overallRating: 4,
      responsiveness: 'Moderate',
      communicationQuality: 'Good',
      opportunityAccess: 'Project based',
      registrationDurationDays: 0,
      lessonsLearned: 'Requires specialized marine-grade powder coating warranty certificates.',
    },
    opportunities: [],
  },
  {
    id: 'comp-brandix-06',
    name: 'Brandix Apparel Limited',
    industry: 'Apparel Manufacturing & Industrial Parks',
    companyType: 'Pvt Ltd',
    website: 'https://brandix.com',
    headOfficeAddress: '25 Rheinland Place, Colombo 03',
    mainTelephone: '+94 11 472 7000',
    procurementEmail: 'procurement@brandix.com',
    procurementContact: 'Dhammika Bandara (General Manager - Facilities & Capex)',
    registrationPortal: 'https://brandix.com/suppliers',
    priority: 'High',
    registrationStatus: 'Approved',
    assignedOfficer: 'Nadeeka Senanayake (Business Development Lead)',
    notes: 'Green factory leader. Approved for eco-certified aluminium louvres, industrial steel mezzanines, and factory canopy renovations.',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-09-30T14:00:00Z',
    nextFollowUpDate: '2026-11-25',
    intelligence: {
      businessOpportunity: 88,
      companySuitability: 90,
      registrationAccessibility: 85,
      potentialProjectValue: 84,
      relationshipAccessibility: 85,
      registrationCostEffort: 85,
      ...calculateIntelligenceScore({
        businessOpportunity: 88,
        companySuitability: 90,
        registrationAccessibility: 85,
        potentialProjectValue: 84,
        relationshipAccessibility: 85,
        registrationCostEffort: 85,
      }),
      justificationNotes: 'Ongoing green facility retrofits and industrial warehouse roofing across 28 factory complexes.',
    },
    contacts: [
      {
        id: 'c-brx-1',
        name: 'Dhammika Bandara',
        designation: 'General Manager - Facilities & Capex',
        department: 'Procurement',
        email: 'dhammika.b@brandix.com',
        phone: '+94 77 123 9988',
        isPrimary: true,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Nadeeka Senanayake');
      list.forEach((item) => {
        if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(item.phase)) {
          item.status = 'completed';
          item.isVerified = true;
        } else if (item.phase === 'H') {
          item.status = 'completed';
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-brx-1',
        date: '2026-03-02 10:00 AM',
        type: 'Call',
        contactPerson: 'Dhammika Bandara',
        summary: 'Registration initiation for industrial steel fabrication and metal roofing.',
        outcome: 'Completed online registration.',
        loggedBy: 'Nadeeka Senanayake',
      },
      {
        id: 'log-brx-2',
        date: '2026-08-14 02:30 PM',
        type: 'Email',
        contactPerson: 'Brandix SCM',
        summary: 'Received official vendor code and onboarding approval.',
        outcome: 'Vendor ID generated.',
        loggedBy: 'Nadeeka Senanayake',
      },
    ],
    submission: {
      submissionDate: '2026-06-18',
      referenceNumber: 'BRX-VREG-2026-302',
      channel: 'Online Vendor Portal',
      recipientName: 'Facilities Capex Board',
      confirmationReceived: true,
      expectedEvaluationDate: '2026-07-30',
    },
    approval: {
      vendorNumber: 'BRX-SUP-4109',
      portalLogin: 'https://brandix.com/suppliers (ID: INNOVISTA_4109)',
      approvedCategories: [
        'Industrial Steel Mezzanines & Roofing',
        'Eco-Certified Aluminium Louvres',
        'Metal Rainwater Gutters & Cladding',
      ],
      approvalDate: '2026-08-14',
      validUntil: '2027-08-14',
      renewalReminderDays: 60,
      status: 'Approved',
    },
    evaluation: {
      overallRating: 5,
      responsiveness: 'High',
      communicationQuality: 'Excellent',
      opportunityAccess: 'Immediate RFQ access',
      registrationDurationDays: 28,
      lessonsLearned: 'Brandix emphasizes ISO 14001 Environmental and WRAP compliance.',
      nextReviewDate: '2026-11-25',
    },
    opportunities: [
      {
        id: 'opp-brx-1',
        title: 'Mirigama Apparel Park Solar Roof Mounting Steel Substructure',
        category: 'Industrial Steel Mezzanines & Roofing',
        estimatedValue: 18500000,
        rfqDate: '2026-10-10',
        deadline: '2026-11-20',
        status: 'Submitted',
        referenceNo: 'RFQ/BRX/CAPEX/2026/89',
      },
    ],
  },
  {
    id: 'comp-hayleys-07',
    name: 'Hayleys PLC / Advantis',
    industry: 'Logistics, Shipping & Industrial Solutions',
    companyType: 'PLC',
    website: 'https://www.hayleys.com',
    headOfficeAddress: 'Hayley Building, 400 Deans Road, Colombo 10',
    mainTelephone: '+94 11 262 7000',
    procurementEmail: 'group_procurement@hayleys.com',
    procurementContact: 'Sanjeewa Gunawardena (Head of SCM)',
    registrationPortal: 'https://procurement.hayleys.com',
    priority: 'Medium',
    registrationStatus: 'Contacted',
    assignedOfficer: 'Kasun Wickrama (BD Executive)',
    notes: 'Major conglomerate with logistics park expansions in Kelaniya & Katunayake. Requires pre-engineered metal buildings, heavy racking and industrial aluminium fixtures.',
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-10-15T11:00:00Z',
    nextFollowUpDate: '2026-11-09',
    intelligence: {
      businessOpportunity: 78,
      companySuitability: 82,
      registrationAccessibility: 75,
      potentialProjectValue: 80,
      relationshipAccessibility: 70,
      registrationCostEffort: 75,
      ...calculateIntelligenceScore({
        businessOpportunity: 78,
        companySuitability: 82,
        registrationAccessibility: 75,
        potentialProjectValue: 80,
        relationshipAccessibility: 70,
        registrationCostEffort: 75,
      }),
      justificationNotes: 'Logistics warehousing expansion tenders periodically floated.',
    },
    contacts: [
      {
        id: 'c-hay-1',
        name: 'Sanjeewa Gunawardena',
        designation: 'Head of SCM',
        department: 'Procurement',
        email: 'sanjeewa.g@hayleys.com',
        phone: '+94 11 262 7118',
        isPrimary: true,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Kasun Wickrama');
      list.forEach((item) => {
        if (item.phase === 'A') {
          item.status = 'completed';
          item.isVerified = true;
        } else if (item.phase === 'B') {
          // Half done
          if (parseInt(item.id.replace('B-', ''), 10) <= 6) {
            item.status = 'completed';
          } else {
            item.status = 'in_progress';
          }
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-hay-1',
        date: '2026-07-15 10:15 AM',
        type: 'Call',
        contactPerson: 'Sanjeewa Gunawardena',
        summary: 'Introduced INNOVISTA capabilities. Advised to wait for annual vendor renewal window in Q4.',
        outcome: 'Follow-up set for November 2026.',
        nextFollowUpDate: '2026-11-09',
        loggedBy: 'Kasun Wickrama',
      },
    ],
    submission: {
      channel: 'Online Vendor Portal',
      confirmationReceived: false,
    },
    approval: {
      approvedCategories: ['Pre-Engineered Metal Buildings', 'Industrial Aluminium Fixtures'],
      renewalReminderDays: 30,
      status: 'Pending',
    },
    evaluation: {
      overallRating: 3,
      responsiveness: 'Moderate',
      communicationQuality: 'Good',
      opportunityAccess: 'Annual tenders only',
      registrationDurationDays: 0,
      lessonsLearned: 'Strict fixed annual window for vendor additions.',
    },
    opportunities: [],
  },
  {
    id: 'comp-hemas-08',
    name: 'Hemas Holdings PLC',
    industry: 'Healthcare, Pharmaceuticals & FMCG',
    companyType: 'PLC',
    website: 'https://www.hemas.com',
    headOfficeAddress: 'Hemas House, 75 Braybrooke Place, Colombo 02',
    mainTelephone: '+94 11 473 1731',
    procurementEmail: 'procurement@hemas.com',
    procurementContact: 'Nuwan Jayathilake (Head of Group Procurement)',
    registrationPortal: 'https://hemas.com/vendor-portal',
    priority: 'Medium',
    registrationStatus: 'Identified',
    assignedOfficer: 'Kasun Wickrama (BD Executive)',
    notes: 'Hospital facility expansions in Thalawathugoda & Wattala, plus pharma cleanroom partitions. Cleanroom grade aluminium & hermetic glass doors needed.',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
    nextFollowUpDate: '2026-11-18',
    intelligence: {
      businessOpportunity: 72,
      companySuitability: 75,
      registrationAccessibility: 70,
      potentialProjectValue: 70,
      relationshipAccessibility: 65,
      registrationCostEffort: 75,
      ...calculateIntelligenceScore({
        businessOpportunity: 72,
        companySuitability: 75,
        registrationAccessibility: 70,
        potentialProjectValue: 70,
        relationshipAccessibility: 65,
        registrationCostEffort: 75,
      }),
      justificationNotes: 'Healthcare cleanroom standards required for pharmaceutical partitions.',
    },
    contacts: [
      {
        id: 'c-hem-1',
        name: 'Nuwan Jayathilake',
        designation: 'Head of Group Procurement',
        department: 'Procurement',
        email: 'nuwan.j@hemas.com',
        phone: '+94 11 473 1890',
        isPrimary: true,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Kasun Wickrama');
      list.forEach((item) => {
        if (item.phase === 'A') {
          // Some completed
          if (parseInt(item.id.replace('A-', ''), 10) <= 7) {
            item.status = 'completed';
          }
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [],
    submission: {
      channel: 'Online Vendor Portal',
      confirmationReceived: false,
    },
    approval: {
      approvedCategories: ['Cleanroom Aluminium Partitions', 'Acoustic Glass Doors'],
      renewalReminderDays: 30,
      status: 'Pending',
    },
    evaluation: {
      overallRating: 3,
      responsiveness: 'Moderate',
      communicationQuality: 'Average',
      opportunityAccess: 'Project based',
      registrationDurationDays: 0,
      lessonsLearned: 'Pending initial call.',
    },
    opportunities: [],
  },
  {
    id: 'comp-aitken-09',
    name: 'Aitken Spence PLC',
    industry: 'Hospitality, Maritime & Renewable Power',
    companyType: 'PLC',
    website: 'https://aitkenspence.com',
    headOfficeAddress: 'Aitken Spence Tower, 305 Vauxhall Street, Colombo 02',
    mainTelephone: '+94 11 230 8308',
    procurementEmail: 'procure@aitkenspence.lk',
    procurementContact: 'Rukshan Dias (VP - Strategic Sourcing)',
    registrationPortal: 'https://suppliers.aitkenspence.com',
    priority: 'High',
    registrationStatus: 'Conditionally Approved',
    assignedOfficer: 'Ranil Jayasuriya (Sr. BD Manager)',
    notes: 'Resort hotel refurbishments (Heritance hotels) and maritime engineering facilities. Conditional approval pending submission of updated ISO 9001:2015 recertification copy.',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-10-27T11:00:00Z',
    nextFollowUpDate: '2026-11-15',
    intelligence: {
      businessOpportunity: 86,
      companySuitability: 88,
      registrationAccessibility: 82,
      potentialProjectValue: 88,
      relationshipAccessibility: 78,
      registrationCostEffort: 80,
      ...calculateIntelligenceScore({
        businessOpportunity: 86,
        companySuitability: 88,
        registrationAccessibility: 82,
        potentialProjectValue: 88,
        relationshipAccessibility: 78,
        registrationCostEffort: 80,
      }),
      justificationNotes: 'High-end hospitality architectural metalwork, frameless glass balustrades and stainless steel work.',
    },
    contacts: [
      {
        id: 'c-asp-1',
        name: 'Rukshan Dias',
        designation: 'VP - Strategic Sourcing',
        department: 'Procurement',
        email: 'rukshan.d@aitkenspence.lk',
        phone: '+94 77 344 5566',
        isPrimary: true,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Ranil Jayasuriya');
      list.forEach((item) => {
        if (['A', 'B', 'C', 'D', 'E', 'F'].includes(item.phase)) {
          item.status = 'completed';
          item.isVerified = true;
        } else if (item.phase === 'G') {
          // Almost done, waiting for condition
          if (item.id === 'G-01' || item.id === 'G-02') item.status = 'completed';
          else if (item.id === 'G-06') item.status = 'blocked'; // renewal / condition
          else item.status = 'in_progress';
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-asp-1',
        date: '2026-04-05 10:00 AM',
        type: 'Call',
        contactPerson: 'Rukshan Dias',
        summary: 'Initiated registration for Heritance hotel renovation supplier list.',
        outcome: 'Registration dossier invited.',
        loggedBy: 'Ranil Jayasuriya',
      },
      {
        id: 'log-asp-2',
        date: '2026-10-27 04:00 PM',
        type: 'Email',
        contactPerson: 'Aitken Spence Sourcing Board',
        summary: 'Received conditional approval letter. Requested updated ISO 9001 audit certificate.',
        outcome: 'Conditional status; awaiting updated audit upload.',
        nextFollowUpDate: '2026-11-15',
        loggedBy: 'Ranil Jayasuriya',
      },
    ],
    submission: {
      submissionDate: '2026-07-20',
      referenceNumber: 'ASP-VEN-2026/102',
      channel: 'Online Vendor Portal',
      recipientName: 'Strategic Sourcing Unit',
      confirmationReceived: true,
      expectedEvaluationDate: '2026-09-15',
    },
    approval: {
      vendorNumber: 'ASP-CND-7721',
      portalLogin: 'https://suppliers.aitkenspence.com (User: INNOVISTA_PVT)',
      approvedCategories: [
        'Resort Frameless Glass Balustrades',
        'Stainless Steel Marine Hardware',
        'Architectural Sun Louvres',
      ],
      approvalDate: '2026-10-25',
      validUntil: '2027-10-25',
      renewalReminderDays: 30,
      status: 'Conditionally Approved',
      notes: 'Condition: Upload updated ISO 9001 surveillance audit report by November 30.',
    },
    evaluation: {
      overallRating: 4,
      responsiveness: 'High',
      communicationQuality: 'Good',
      opportunityAccess: 'Immediate RFQ access',
      registrationDurationDays: 35,
      lessonsLearned: 'Strict requirement for aesthetic architectural sample boards and finish quality.',
    },
    opportunities: [
      {
        id: 'opp-asp-1',
        title: 'Heritance Ahungalla Oceanfront Villa Glass Balustrades & Pergolas',
        category: 'Resort Frameless Glass Balustrades',
        estimatedValue: 16200000,
        rfqDate: '2026-10-20',
        deadline: '2026-12-01',
        status: 'Under Bid',
        referenceNo: 'ASP/HER/2026/041',
      },
    ],
  },
  {
    id: 'comp-mas-10',
    name: 'MAS Holdings',
    industry: 'Apparel & Tech Innovation',
    companyType: 'Pvt Ltd',
    website: 'https://masholdings.com',
    headOfficeAddress: '10th Floor, Aitken Spence Tower II, 315 Vauxhall Street, Colombo 02',
    mainTelephone: '+94 11 479 6444',
    procurementEmail: 'capex_procurement@masholdings.com',
    procurementContact: 'Dinesh Weerakkody (Head of Capex SCM)',
    registrationPortal: 'https://procure.masholdings.com',
    priority: 'Medium',
    registrationStatus: 'Contacted',
    assignedOfficer: 'Nadeeka Senanayake (Business Development Lead)',
    notes: 'Apparel tech innovation hubs and automated logistics lines. Modular steel platforms, laser-cut partition panels and acoustic double-glazed glass enclosures.',
    createdAt: '2026-06-25T10:00:00Z',
    updatedAt: '2026-10-24T14:00:00Z',
    nextFollowUpDate: '2026-11-16',
    intelligence: {
      businessOpportunity: 80,
      companySuitability: 82,
      registrationAccessibility: 76,
      potentialProjectValue: 80,
      relationshipAccessibility: 72,
      registrationCostEffort: 75,
      ...calculateIntelligenceScore({
        businessOpportunity: 80,
        companySuitability: 82,
        registrationAccessibility: 76,
        potentialProjectValue: 80,
        relationshipAccessibility: 72,
        registrationCostEffort: 75,
      }),
      justificationNotes: 'High volume modern interior steel and glass fit-outs for R&D centers.',
    },
    contacts: [
      {
        id: 'c-mas-1',
        name: 'Dinesh Weerakkody',
        designation: 'Head of Capex SCM',
        department: 'Procurement',
        email: 'dinesh.w@masholdings.com',
        phone: '+94 11 479 6520',
        isPrimary: true,
      },
    ],
    checklist: (() => {
      const list = createDefaultCompanyChecklist('Nadeeka Senanayake');
      list.forEach((item) => {
        if (item.phase === 'A') {
          item.status = 'completed';
          item.isVerified = true;
        } else if (item.phase === 'B') {
          if (parseInt(item.id.replace('B-', ''), 10) <= 8) {
            item.status = 'completed';
          } else {
            item.status = 'in_progress';
          }
        }
      });
      return list;
    })(),
    documents: defaultDocsTemplate(),
    communicationLogs: [
      {
        id: 'log-mas-1',
        date: '2026-07-08 02:00 PM',
        type: 'Call',
        contactPerson: 'Dinesh Weerakkody',
        summary: 'Call regarding MAS Capex contractor prequalification procedure.',
        outcome: 'Vendor portal registration invitation expected next week.',
        nextFollowUpDate: '2026-11-16',
        loggedBy: 'Nadeeka Senanayake',
      },
    ],
    submission: {
      channel: 'Online Vendor Portal',
      confirmationReceived: false,
    },
    approval: {
      approvedCategories: ['Modular Steel Platforms', 'Laser-Cut Partition Panels'],
      renewalReminderDays: 30,
      status: 'Pending',
    },
    evaluation: {
      overallRating: 4,
      responsiveness: 'Moderate',
      communicationQuality: 'Good',
      opportunityAccess: 'Project based',
      registrationDurationDays: 0,
      lessonsLearned: 'Strict non-disclosure agreements (NDA) required before engineering drawings are shared.',
    },
    opportunities: [],
  },
];
