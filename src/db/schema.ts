import { boolean, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// User account entity with authentication, roles, passwords, and Google Authenticator 2FA
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or unique username ID
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'), // Hashed password for username/password authentication
  email: text('email').notNull(),
  role: text('role').notNull().default('admin'), // 'admin' | 'officer' | 'viewer'
  displayName: text('display_name'),
  twoFactorSecret: text('two_factor_secret'), // Manual base32 secret key for Google Authenticator
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Corporate client accounts seeking vendor prequalification
export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  industry: text('industry').notNull(),
  companyType: text('company_type').notNull(),
  website: text('website').notNull().default(''),
  headOfficeAddress: text('head_office_address').notNull().default(''),
  mainTelephone: text('main_telephone').notNull().default(''),
  procurementEmail: text('procurement_email').notNull().default(''),
  procurementContact: text('procurement_contact').notNull().default(''),
  registrationPortal: text('registration_portal').default(''),
  priority: text('priority').notNull().default('Medium'),
  registrationStatus: text('registration_status').notNull().default('Identified'),
  assignedOfficer: text('assigned_officer').notNull().default('General SCM Desk'),
  notes: text('notes').default(''),
  nextFollowUpDate: text('next_follow_up_date').default(''),
  intelligence: jsonb('intelligence').notNull(),
  contacts: jsonb('contacts').notNull(),
  checklist: jsonb('checklist').notNull(),
  documents: jsonb('documents').notNull(),
  communicationLogs: jsonb('communication_logs').notNull(),
  opportunities: jsonb('opportunities').notNull(),
  submission: jsonb('submission'),
  approval: jsonb('approval').notNull(),
  evaluation: jsonb('evaluation'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// System settings (e.g. industry types taxonomy)
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit and alert notification logs
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  companyId: text('company_id'),
  companyName: text('company_name'),
  recipient: text('recipient'),
  status: text('status').notNull(),
  timestamp: text('timestamp').notNull(),
});
