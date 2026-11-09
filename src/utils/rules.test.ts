import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateIntelligenceScore,
  calculateCompanyChecklistProgress,
  parseCsvCompanyImport,
  exportCompaniesToCsv,
  calculateDashboardMetrics,
  isCompanyInCategory,
  countCompaniesByCategories,
  getIndustryCategory,
  countCompaniesByIndustryCategory,
  formatScheduleCountdown,
  recordClientWin,
  getUpcomingScheduleAlerts,
  bulkAssignRepresentative,
  bulkUpdateCompanyStatus,
  DEFAULT_INDUSTRY_TYPES,
  validateIndustryTypeName,
} from './rules';
import { createDefaultCompanyChecklist } from '../data/masterChecklist';
import { Company } from '../types';

test('calculateIntelligenceScore correctly weights factors and assigns tiers', () => {
  // Test high-priority target
  const highFactors = {
    businessOpportunity: 90,      // * 0.25 = 22.5
    companySuitability: 85,       // * 0.20 = 17.0
    registrationAccessibility: 80,// * 0.15 = 12.0
    potentialProjectValue: 90,    // * 0.20 = 18.0
    relationshipAccessibility: 70,// * 0.10 = 7.0
    registrationCostEffort: 80,   // * 0.10 = 8.0
  };
  // total = 22.5 + 17 + 12 + 18 + 7 + 8 = 84.5 -> 85
  const resultHigh = calculateIntelligenceScore(highFactors);
  assert.equal(resultHigh.totalScore, 85);
  assert.equal(resultHigh.tier, 'High-priority target');

  // Test low-priority target
  const lowFactors = {
    businessOpportunity: 30,
    companySuitability: 40,
    registrationAccessibility: 20,
    potentialProjectValue: 30,
    relationshipAccessibility: 30,
    registrationCostEffort: 40,
  };
  const resultLow = calculateIntelligenceScore(lowFactors);
  assert.ok(resultLow.totalScore < 50 && resultLow.totalScore >= 30);
  assert.equal(resultLow.tier, 'Low-priority target');
});

test('calculateCompanyChecklistProgress accurately counts 115 master items and computes percentages', () => {
  const checklist = createDefaultCompanyChecklist('Officer Ranil');
  assert.equal(checklist.length, 115, 'Should have exactly 115 checklist items');

  const initialSummary = calculateCompanyChecklistProgress(checklist);
  assert.equal(initialSummary.totalItems, 115);
  assert.equal(initialSummary.completedItems, 0);
  assert.equal(initialSummary.overallPercentage, 0);
  assert.equal(initialSummary.phases.length, 8);

  // Mark 10 items completed and 5 items not applicable
  for (let i = 0; i < 10; i++) {
    checklist[i].status = 'completed';
  }
  for (let i = 10; i < 15; i++) {
    checklist[i].status = 'not_applicable';
  }

  const updatedSummary = calculateCompanyChecklistProgress(checklist);
  assert.equal(updatedSummary.completedItems, 10);
  assert.equal(updatedSummary.notApplicableItems, 5);
  assert.equal(updatedSummary.applicableItems, 110);
  // 10 / 110 = 9.09% -> 9%
  assert.equal(updatedSummary.overallPercentage, 9);
});

test('parseCsvCompanyImport validates headers, extracts valid companies, and reports warnings', () => {
  const csvSample = `Company Name,Industry,Company Type,Website,Main Telephone,Procurement Email,Procurement Contact,Priority,Registration Status,Assigned Officer,Notes
Dialog Axiata PLC,Telecommunications,PLC,https://dialog.lk,+94112223344,procurement@dialog.lk,K. Perera,High,Contacted,BD Ranil,Key telecom tower fabrications
Access Engineering,Construction,PLC,https://access.lk,,purchasing@access.lk,M. Silva,High,Requirements Received,BD Ranil,Missing phone warning
,Banking,PLC,https://bank.lk,+94113334455,info@bank.lk,Manager,Medium,Identified,BD Ranil,Empty company name should fail
`;

  const parsed = parseCsvCompanyImport(csvSample);
  assert.equal(parsed.validRecords.length, 2, 'Should parse 2 valid records');
  assert.equal(parsed.validRecords[0].name, 'Dialog Axiata PLC');
  assert.equal(parsed.validRecords[0].priority, 'High');
  assert.equal(parsed.errors.length, 1, 'Should flag row 4 for empty company name');
  assert.equal(parsed.warnings.length, 1, 'Should warn about missing phone on Access Engineering');
});

test('parseCsvCompanyImport supports bulk client buyer headers and aliases', () => {
  const clientBulkCsv = `Client Company Name,Sector,Company Type,Website,Telephone,Procurement Email,Procurement Manager,Portal URL,Priority Tier,Registration Stage,BD Lead,Remarks
John Keells Holdings PLC,Conglomerate,PLC,https://keells.com,+94112306000,procurement@keells.com,Sunil Mendis,https://supplier.keells.com,High,Identified,Ranil Jayasuriya,Key facade packages
CHEC Port City Colombo,Mega Development,Pvt Ltd,https://portcitycolombo.lk,+94112440000,procure@portcitycolombo.lk,Zhang Wei,https://portal.portcitycolombo.lk,High,Contacted,Kasun Wickrama,Marina curtain wall
`;

  const parsed = parseCsvCompanyImport(clientBulkCsv);
  assert.equal(parsed.validRecords.length, 2);
  assert.equal(parsed.validRecords[0].name, 'John Keells Holdings PLC');
  assert.equal(parsed.validRecords[0].procurementContact, 'Sunil Mendis');
  assert.equal(parsed.validRecords[1].name, 'CHEC Port City Colombo');
  assert.equal(parsed.validRecords[1].registrationStatus, 'Contacted');
  assert.equal(parsed.errors.length, 0);
});

test('calculateDashboardMetrics aggregates correctly across company pipeline', () => {
  const mockCompany = (status: Company['registrationStatus']): Company => ({
    id: 'test-' + Math.random(),
    name: 'Sample Corp',
    industry: 'Engineering',
    companyType: 'PLC',
    website: '',
    headOfficeAddress: '',
    mainTelephone: '0112345678',
    procurementEmail: 'info@sample.com',
    procurementContact: 'Officer',
    priority: 'High',
    registrationStatus: status,
    assignedOfficer: 'BD Team',
    notes: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    intelligence: {
      businessOpportunity: 80,
      companySuitability: 80,
      registrationAccessibility: 80,
      potentialProjectValue: 80,
      relationshipAccessibility: 80,
      registrationCostEffort: 80,
      totalScore: 80,
      tier: 'High-priority target',
    },
    contacts: [],
    checklist: createDefaultCompanyChecklist(),
    documents: [],
    communicationLogs: [],
    submission: { channel: 'Online Vendor Portal', confirmationReceived: false },
    approval: { approvedCategories: [], renewalReminderDays: 30, status: 'Pending' },
    evaluation: {
      overallRating: 4,
      responsiveness: 'High',
      communicationQuality: 'Good',
      opportunityAccess: 'Immediate RFQ access',
      registrationDurationDays: 15,
      lessonsLearned: 'Fast',
    },
    opportunities: [],
  });

  const companies: Company[] = [
    mockCompany('Identified'),
    mockCompany('Contacted'),
    mockCompany('Requirements Received'),
    mockCompany('Submitted'),
    mockCompany('Approved'),
  ];

  const metrics = calculateDashboardMetrics(companies);
  assert.equal(metrics.totalCompanies, 5);
  assert.equal(metrics.approvedVendors, 1);
  assert.equal(metrics.contacted, 4);
  assert.equal(metrics.applicationsActive, 2); // Requirements Received + Submitted
  assert.equal(metrics.successRate, 20); // 1 out of 5 = 20%
});

test('isCompanyInCategory and countCompaniesByCategories correctly filter All, Active, Pending, and Flagged', () => {
  const baseCompany = (override: Partial<Company>): Company => ({
    id: 'test-' + Math.random(),
    name: 'Sample Corp',
    industry: 'Engineering',
    companyType: 'PLC',
    website: '',
    headOfficeAddress: '',
    mainTelephone: '0112345678',
    procurementEmail: 'info@sample.com',
    procurementContact: 'Officer',
    priority: 'Medium',
    registrationStatus: 'Identified',
    assignedOfficer: 'BD Team',
    notes: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    intelligence: {
      businessOpportunity: 70,
      companySuitability: 70,
      registrationAccessibility: 70,
      potentialProjectValue: 70,
      relationshipAccessibility: 70,
      registrationCostEffort: 70,
      totalScore: 70,
      tier: 'Medium-priority target',
    },
    contacts: [],
    checklist: [],
    documents: [],
    communicationLogs: [],
    submission: { channel: 'Online Vendor Portal', confirmationReceived: false },
    approval: { approvedCategories: [], renewalReminderDays: 30, status: 'Pending' },
    evaluation: {
      overallRating: 3,
      responsiveness: 'Moderate',
      communicationQuality: 'Good',
      opportunityAccess: 'Project based',
      registrationDurationDays: 0,
      lessonsLearned: '',
    },
    opportunities: [],
    ...override,
  });

  const testList: Company[] = [
    baseCompany({ name: 'Co1', registrationStatus: 'Identified', priority: 'Low' }),
    baseCompany({ name: 'Co2', registrationStatus: 'Contacted', priority: 'Low' }),
    baseCompany({ name: 'Co3', registrationStatus: 'Submitted', priority: 'Medium' }),
    baseCompany({ name: 'Co4', registrationStatus: 'Under Evaluation', priority: 'High' }),
    baseCompany({ name: 'Co5', registrationStatus: 'Approved', priority: 'Medium' }),
    baseCompany({ name: 'Co6', registrationStatus: 'Rejected', priority: 'Low' }),
  ];

  const counts = countCompaniesByCategories(testList, '2026-11-06');
  assert.equal(counts.All, 6);
  // Active: Contacted, Submitted, Under Evaluation, Approved = 4
  assert.equal(counts.Active, 4);
  // Pending: Submitted, Under Evaluation = 2
  assert.equal(counts.Pending, 2);
  // Flagged: Co4 (High priority) + Co6 (Rejected) = 2
  assert.equal(counts.Flagged, 2);

  // Direct predicate tests
  assert.equal(isCompanyInCategory(testList[0], 'All'), true);
  assert.equal(isCompanyInCategory(testList[0], 'Active'), false);
  assert.equal(isCompanyInCategory(testList[2], 'Pending'), true);
  assert.equal(isCompanyInCategory(testList[4], 'Pending'), false);
  assert.equal(isCompanyInCategory(testList[3], 'Flagged'), true);
});

test('getIndustryCategory and countCompaniesByIndustryCategory correctly categorize sectors', () => {
  assert.equal(getIndustryCategory('Construction & Civil Infrastructure'), 'Construction');
  assert.equal(getIndustryCategory('Special Economic Zone & Megaprojects'), 'Construction');
  assert.equal(getIndustryCategory('Apparel Manufacturing & Industrial Parks'), 'Manufacturing');
  assert.equal(getIndustryCategory('Banking & Financial Institutions'), 'Finance');
  assert.equal(getIndustryCategory('Telecommunications & Digital Services'), 'Telecom');
  assert.equal(getIndustryCategory('Logistics, Shipping & Industrial Solutions'), 'Logistics');
  assert.equal(getIndustryCategory('Hospitality, Maritime & Renewable Power'), 'Hospitality');
  assert.equal(getIndustryCategory('Healthcare, Pharmaceuticals & FMCG'), 'Healthcare');
  assert.equal(getIndustryCategory('Conglomerates & Real Estate Development'), 'Conglomerate');
  assert.equal(getIndustryCategory('Aerospace Defense'), 'Other');

  const dummyCompanies = [
    { industry: 'Construction & Civil Infrastructure' } as Company,
    { industry: 'Special Economic Zone & Megaprojects' } as Company,
    { industry: 'Banking & Financial Institutions' } as Company,
  ];

  const results = countCompaniesByIndustryCategory(dummyCompanies);
  const allOption = results.find((r) => r.key === 'All');
  const constrOption = results.find((r) => r.key === 'Construction');
  const finOption = results.find((r) => r.key === 'Finance');

  assert.equal(allOption?.count, 3);
  assert.equal(constrOption?.count, 2);
  assert.equal(finOption?.count, 1);
});

test('formatScheduleCountdown accurately calculates overdue, today, tomorrow, and upcoming days', () => {
  const ref = '2026-11-06';

  const overdue = formatScheduleCountdown('2026-11-04', ref);
  assert.equal(overdue.status, 'overdue');
  assert.equal(overdue.text, '2d ago');
  assert.equal(overdue.daysDiff, -2);

  const today = formatScheduleCountdown('2026-11-06', ref);
  assert.equal(today.status, 'today');
  assert.equal(today.text, 'Today');
  assert.equal(today.daysDiff, 0);

  const tomorrow = formatScheduleCountdown('2026-11-07', ref);
  assert.equal(tomorrow.status, 'tomorrow');
  assert.equal(tomorrow.text, 'Tomorrow');
  assert.equal(tomorrow.daysDiff, 1);

  const inFiveDays = formatScheduleCountdown('2026-11-11', ref);
  assert.equal(inFiveDays.status, 'upcoming');
  assert.equal(inFiveDays.text, 'In 5d');
  assert.equal(inFiveDays.daysDiff, 5);

  const empty = formatScheduleCountdown(undefined, ref);
  assert.equal(empty.status, 'none');
  assert.equal(empty.text, '—');
});

test('recordClientWin updates company to Approved, assigns vendorNumber, and marks Phase G items', () => {
  const initialCompany: Company = {
    id: 'test-co',
    name: 'Access Engineering PLC',
    industry: 'Construction & Civil Infrastructure',
    companyType: 'PLC',
    website: '',
    headOfficeAddress: '',
    mainTelephone: '0112345678',
    procurementEmail: 'info@sample.com',
    procurementContact: 'Officer',
    priority: 'Medium',
    registrationStatus: 'Submitted',
    assignedOfficer: 'Ranil',
    notes: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    intelligence: {
      businessOpportunity: 80,
      companySuitability: 80,
      registrationAccessibility: 80,
      potentialProjectValue: 80,
      relationshipAccessibility: 80,
      registrationCostEffort: 80,
      totalScore: 80,
      tier: 'High-priority target',
    },
    contacts: [],
    checklist: createDefaultCompanyChecklist('Ranil'),
    documents: [],
    communicationLogs: [],
    submission: { channel: 'Online Vendor Portal', confirmationReceived: true },
    approval: { approvedCategories: [], renewalReminderDays: 30, status: 'Pending' },
    evaluation: {
      overallRating: 4,
      responsiveness: 'High',
      communicationQuality: 'Good',
      opportunityAccess: 'Immediate RFQ access',
      registrationDurationDays: 14,
      lessonsLearned: 'Smooth approval',
    },
    opportunities: [],
  };

  const won = recordClientWin(initialCompany, {
    vendorNumber: 'VEND-AC-999',
    approvedCategories: ['Aluminium Fabrications', 'Curtain Wall'],
    approvalDate: '2026-11-06',
  });

  assert.equal(won.registrationStatus, 'Approved');
  assert.equal(won.approval.status, 'Approved');
  assert.equal(won.approval.vendorNumber, 'VEND-AC-999');
  assert.deepEqual(won.approval.approvedCategories, ['Aluminium Fabrications', 'Curtain Wall']);
  assert.equal(won.approval.approvalDate, '2026-11-06');
});

test('exportCompaniesToCsv produces valid CSV with all reporting columns and proper escaping', () => {
  const sampleCompany: Company = {
    id: 'comp-export-test',
    name: 'Acme "Global" Holdings, PLC',
    industry: 'Construction & Civil Infrastructure',
    companyType: 'PLC',
    website: 'https://acme.example.com',
    headOfficeAddress: '123 Harbor Rd, Colombo 01',
    mainTelephone: '+94 11 234 5678',
    procurementEmail: 'procure@acme.example.com',
    procurementContact: 'Jane Doe (Head of SCM)',
    registrationPortal: 'https://vendor.acme.example.com',
    priority: 'High',
    registrationStatus: 'Approved',
    assignedOfficer: 'Ranil Jayasuriya',
    notes: 'Key target with Q4 tender pipelines',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-11-06T00:00:00Z',
    nextFollowUpDate: '2026-11-15',
    intelligence: {
      businessOpportunity: 90,
      companySuitability: 85,
      registrationAccessibility: 80,
      potentialProjectValue: 90,
      relationshipAccessibility: 75,
      registrationCostEffort: 80,
      totalScore: 85,
      tier: 'High-priority target',
    },
    contacts: [
      {
        id: 'c1',
        name: 'Jane Doe',
        designation: 'Head of SCM',
        department: 'Procurement',
        email: 'jane@acme.example.com',
        phone: '+94 77 123 4567',
        isPrimary: true,
      },
    ],
    checklist: createDefaultCompanyChecklist('Ranil Jayasuriya'),
    documents: [],
    communicationLogs: [],
    submission: {
      channel: 'Online Vendor Portal',
      confirmationReceived: true,
      submissionDate: '2026-10-15',
    },
    approval: {
      status: 'Approved',
      vendorNumber: 'VEND-ACME-2026',
      approvedCategories: ['Structural Steel', 'Aluminium Fabrications'],
      approvalDate: '2026-11-01',
      validUntil: '2027-11-01',
      renewalReminderDays: 30,
    },
    evaluation: {
      overallRating: 5,
      responsiveness: 'High',
      communicationQuality: 'Excellent',
      opportunityAccess: 'Immediate RFQ access',
      registrationDurationDays: 12,
      lessonsLearned: 'All criteria met promptly',
    },
    opportunities: [
      {
        id: 'opp-1',
        title: 'Glass Facade Project',
        category: 'Aluminium Fabrication',
        estimatedValue: 12500000,
        rfqDate: '2026-11-01',
        deadline: '2026-12-01',
        status: 'Identified',
      },
    ],
  };

  const csv = exportCompaniesToCsv([sampleCompany]);
  const lines = csv.split('\n');

  assert.equal(lines.length, 2); // 1 header line + 1 data line
  assert.ok(lines[0].includes('Company ID'));
  assert.ok(lines[0].includes('Company Name'));
  assert.ok(lines[0].includes('Checklist Progress %'));
  assert.ok(lines[0].includes('Total Opportunity Value (LKR)'));

  // Verify escaping of quotes in company name
  assert.ok(lines[1].includes('"Acme ""Global"" Holdings, PLC"'));
  assert.ok(lines[1].includes('comp-export-test'));
  assert.ok(lines[1].includes('VEND-ACME-2026'));
  assert.ok(lines[1].includes('Structural Steel; Aluminium Fabrications'));
  assert.ok(lines[1].includes('12500000'));
});

test('bulkAssignRepresentative updates assignedOfficer for selected company IDs only', () => {
  const c1: Company = {
    id: 'c-1',
    name: 'Corp 1',
    industry: 'Tech',
    companyType: 'PLC',
    website: '',
    headOfficeAddress: '',
    mainTelephone: '0112345678',
    procurementEmail: 'c1@test.com',
    procurementContact: 'Contact 1',
    priority: 'Medium',
    registrationStatus: 'Identified',
    assignedOfficer: 'Kasun Wickrama',
    notes: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    intelligence: {
      businessOpportunity: 80,
      companySuitability: 80,
      registrationAccessibility: 80,
      potentialProjectValue: 80,
      relationshipAccessibility: 80,
      registrationCostEffort: 80,
      totalScore: 80,
      tier: 'High-priority target',
    },
    contacts: [],
    checklist: [],
    documents: [],
    communicationLogs: [],
    submission: { channel: 'Online Vendor Portal', confirmationReceived: false },
    approval: { approvedCategories: [], renewalReminderDays: 30, status: 'Pending' },
    evaluation: {
      overallRating: 4,
      responsiveness: 'High',
      communicationQuality: 'Good',
      opportunityAccess: 'Immediate RFQ access',
      registrationDurationDays: 10,
      lessonsLearned: '',
    },
    opportunities: [],
  };

  const c2 = { ...c1, id: 'c-2', name: 'Corp 2', assignedOfficer: 'Kasun Wickrama' };
  const c3 = { ...c1, id: 'c-3', name: 'Corp 3', assignedOfficer: 'Kasun Wickrama' };

  const updated = bulkAssignRepresentative([c1, c2, c3], ['c-1', 'c-3'], 'Ranil Jayasuriya');
  assert.equal(updated.find((c) => c.id === 'c-1')?.assignedOfficer, 'Ranil Jayasuriya');
  assert.equal(updated.find((c) => c.id === 'c-2')?.assignedOfficer, 'Kasun Wickrama');
  assert.equal(updated.find((c) => c.id === 'c-3')?.assignedOfficer, 'Ranil Jayasuriya');
});

test('bulkUpdateCompanyStatus updates registrationStatus and approval records for selected IDs', () => {
  const c1: Company = {
    id: 'c-1',
    name: 'Corp 1',
    industry: 'Tech',
    companyType: 'PLC',
    website: '',
    headOfficeAddress: '',
    mainTelephone: '0112345678',
    procurementEmail: 'c1@test.com',
    procurementContact: 'Contact 1',
    priority: 'Medium',
    registrationStatus: 'Identified',
    assignedOfficer: 'Ranil',
    notes: '',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    intelligence: {
      businessOpportunity: 80,
      companySuitability: 80,
      registrationAccessibility: 80,
      potentialProjectValue: 80,
      relationshipAccessibility: 80,
      registrationCostEffort: 80,
      totalScore: 80,
      tier: 'High-priority target',
    },
    contacts: [],
    checklist: [],
    documents: [],
    communicationLogs: [],
    submission: { channel: 'Online Vendor Portal', confirmationReceived: false },
    approval: { approvedCategories: [], renewalReminderDays: 30, status: 'Pending' },
    evaluation: {
      overallRating: 4,
      responsiveness: 'High',
      communicationQuality: 'Good',
      opportunityAccess: 'Immediate RFQ access',
      registrationDurationDays: 10,
      lessonsLearned: '',
    },
    opportunities: [],
  };

  const c2 = { ...c1, id: 'c-2', name: 'Corp 2' };

  const updated = bulkUpdateCompanyStatus([c1, c2], ['c-2'], 'Approved');
  assert.equal(updated.find((c) => c.id === 'c-1')?.registrationStatus, 'Identified');
  assert.equal(updated.find((c) => c.id === 'c-2')?.registrationStatus, 'Approved');
  assert.equal(updated.find((c) => c.id === 'c-2')?.approval.status, 'Approved');
  assert.ok(updated.find((c) => c.id === 'c-2')?.approval.approvalDate);
});

test('validateIndustryTypeName validates name length, emptiness, and duplicates', () => {
  const existing = ['Construction & Civil Infrastructure', 'Banking & Finance'];

  // Empty string
  const emptyRes = validateIndustryTypeName('   ', existing);
  assert.equal(emptyRes.valid, false);
  assert.equal(emptyRes.error, 'Industry name cannot be empty.');

  // Too short
  const shortRes = validateIndustryTypeName('A', existing);
  assert.equal(shortRes.valid, false);

  // Duplicate (case-insensitive)
  const dupRes = validateIndustryTypeName('banking & finance', existing);
  assert.equal(dupRes.valid, false);
  assert.ok(dupRes.error?.includes('already exists'));

  // Valid new industry
  const validRes = validateIndustryTypeName('Renewable Energy & Solar Parks', existing);
  assert.equal(validRes.valid, true);

  // Default presets list contains key corporate sectors
  assert.ok(DEFAULT_INDUSTRY_TYPES.length >= 10);
  assert.ok(DEFAULT_INDUSTRY_TYPES.includes('Construction & Civil Infrastructure'));
  assert.ok(DEFAULT_INDUSTRY_TYPES.includes('Telecommunications & Digital Services'));
});



