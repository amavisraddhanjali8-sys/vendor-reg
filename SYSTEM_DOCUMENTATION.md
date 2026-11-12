# INNOVISTA VendorHub — Complete System Architecture & Documentation

> **Operating Organization**: INNOVISTA METAL FABRICONIX (PVT) LTD.  
> **Platform Purpose**: Multi-Company Corporate Vendor Registration, Procurement Prequalification, and Client Relationship Lifecycle Management.  
> **Version**: 3.0.0 (Cloud SQL PostgreSQL Engine · Firebase Auth · Google Authenticator 2FA)  
> **Runtime Environment**: Node.js 22+ / Express / Vite / React 19 / TypeScript / PostgreSQL / Drizzle ORM / Tailwind CSS v4

---

## Table of Contents
1. [Executive Summary & Core Concept](#1-executive-summary--core-concept)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [PostgreSQL Database Architecture & Schema](#3-postgresql-database-architecture--schema)
4. [Authentication, Password Security & Google Authenticator 2FA](#4-authentication-password-security--google-authenticator-2fa)
5. [Complete REST API Specifications](#5-complete-rest-api-specifications)
6. [The 115-Step Master Registration Lifecycle](#6-the-115-step-master-registration-lifecycle)
7. [The 6-Factor Intelligence Scoring Engine](#7-the-6-factor-intelligence-scoring-engine)
8. [User Interface & Page Interaction Flows](#8-user-interface--page-interaction-flows)
9. [End-to-End Operational Workflows](#9-end-to-end-operational-workflows)
10. [Bulk Data Engine & CSV Import/Export](#10-bulk-data-engine--csv-importexport)
11. [Settings & Industry Category Classification](#11-settings--industry-category-classification)
12. [Testing, Reliability & Quality Gates](#12-testing-reliability--quality-gates)
13. [File & Directory Reference](#13-file--directory-reference)

---

## 1. Executive Summary & Core Concept

### 1.1 The Business Model
INNOVISTA METAL FABRICONIX (PVT) LTD. is a specialized architectural aluminium, facade glazing, and structural steel fabrication engineering contractor. 

In traditional CRM software, companies in the database are treated as accounts buying goods from a vendor. **INNOVISTA VendorHub inverts this relationship**:
- The **Companies** stored in the database are major client conglomerates, public infrastructure authorities, commercial property developers, and tier-1 construction contractors (e.g., Dialog Axiata PLC, John Keells Holdings PLC, Access Engineering PLC, CHEC Colombo Port City).
- **INNOVISTA** is the specialized engineering vendor seeking prequalification, registration approval, and active supplier status within each client's internal SAP/ERP/Procurement portals.
- The platform manages the exhaustive **115-step statutory, financial, technical, and compliance qualification process** required by each client before RFQs (Requests for Quotation) and multi-million-rupee tenders can be awarded.

### 1.2 Core System Capabilities
1. **Cloud SQL PostgreSQL Database**: Enterprise relational storage running PostgreSQL with Drizzle ORM, connection pooling, and JSONB document structures for high throughput and data integrity. Legacy file-based databases have been completely superseded.
2. **Multi-Method Secure Authentication**: Dual login support via Google Sign-In (Firebase Auth) and Username/Password with salted PBKDF2 cryptography.
3. **Google Authenticator Manual TOTP (2FA)**: Time-Based One-Time Password support featuring manual secret key entry (monospace copyable base32 key) and QR code scanning.
4. **Role-Based Password Administration**: Only system administrators have permissions to view all users, provision new usernames, change passwords for any username, or delete/clear user passwords. Individual users can update their own credentials in Settings.
5. **115-Point Rigorous Checklist**: Automates 8 distinct compliance phases from initial procurement intelligence to factory audits, SAP supplier code issuance, and bi-annual renewals.
6. **6-Factor Weighted Intelligence Scoring**: Calculates an algorithmic priority score (0–100) and tiers clients into *High-Priority Targets*, *Medium-Priority Targets*, *Low-Priority Targets*, or *Not Recommended*.
7. **Interactive Kanban Pipeline**: Drag-and-drop or one-click status transitions across 6 pipeline stages with live countdown badges for upcoming follow-up schedules.
8. **Bulk Operations Suite**: High-throughput CSV upload with header aliasing, duplicate detection, batch status updates, batch representative assignments, and 28-field RFC 4180 CSV exports.

---

## 2. System Architecture & Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                   CLIENT TIER                                     |
|  React 19 SPA (Vite 8) | TypeScript 7 | Tailwind CSS v4 | Lucide Icons            |
|  - App.tsx (Auth Gate, Navigation Router, Modal Orchestrator, Toast Dispatcher)   |
|  - LoginView.tsx (Google Auth + Username/Password + 2FA TOTP verification)        |
|  - Views: Overview, Clients (Table), Pipeline (Kanban), Alerts, Reports, Settings|
|  - SettingsView.tsx (User Password Admin, Manual 2FA Setup, Industry Manager)     |
|  - Services: src/services/api.ts (Bearer Token REST Client with Offline Fallback) |
+------------------------------------------+----------------------------------------+
                                           | HTTP / JSON (Port 3000)
                                           v
+-----------------------------------------------------------------------------------+
|                                   SERVER TIER                                     |
|  Node.js 22+ & Express (server.ts running via tsx)                                |
|  - Vite Middlewares (Dev Mode SPA Mounting on Port 3000)                          |
|  - Firebase Admin SDK (Token Verification, Google OAuth Sync)                     |
|  - Auth & TOTP Engine (PBKDF2 Salted Hashes, otplib, qrcode, HMAC Sessions)       |
|  - Drizzle ORM (Type-Safe Query Layer, PostgreSQL Node Driver pg.Pool)            |
+------------------------------------------+----------------------------------------+
                                           | PostgreSQL Protocol
                                           v
+-----------------------------------------------------------------------------------+
|                              PERSISTENCE TIER                                     |
|  Google Cloud SQL (PostgreSQL Developer Edition · region: asia-southeast1)        |
|  - Public Schema: users, companies, settings, notifications                       |
+-----------------------------------------------------------------------------------+
```

---

## 3. PostgreSQL Database Architecture & Schema

All persistence is managed via Cloud SQL for PostgreSQL using Drizzle ORM (`src/db/schema.ts`).

### 3.1 Entity Relationship Diagram & Table Definitions

#### `users` Table
Stores system administrators, procurement officers, credentials, and 2FA secrets.
```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),            // Firebase UID or unique user identifier
  username: text('username').notNull().unique(),  // Login username (e.g. "admin")
  passwordHash: text('password_hash'),            // Salted PBKDF2 hash (salt:hash)
  email: text('email').notNull(),                 // Corporate email address
  role: text('role').notNull().default('admin'),  // 'admin' | 'officer' | 'viewer'
  displayName: text('display_name'),
  twoFactorSecret: text('two_factor_secret'),     // Base32 secret key for Google Authenticator
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### `companies` Table
Stores corporate client accounts seeking vendor prequalification.
```typescript
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
```

#### `settings` Table
Key-value storage for industrial categories and platform preferences.
```typescript
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),            // e.g. 'industryTypes'
  value: jsonb('value').notNull(),                // { list: string[] }
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### `notifications` Table
Audit logs for communications and alert dispatches.
```typescript
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
```

---

## 4. Authentication, Password Security & Google Authenticator 2FA

### 4.1 Multi-Mode Login Workflow
1. **Google OAuth Sign-In**:
   - Client authenticates via `signInWithPopup(auth, googleAuthProvider)`.
   - Client sends Firebase ID Token to `POST /api/auth/google`.
   - Server verifies token with Firebase Admin SDK (`adminAuth.verifyIdToken(idToken)`).
   - If user exists in PostgreSQL `users`, authenticates them; if new, provisions a profile.
2. **Username & Password Sign-In**:
   - User inputs username & password on the login screen.
   - Server queries PostgreSQL `users` table for the username.
   - Verifies salted PBKDF2 hash using `crypto.timingSafeEqual()`.
   - If `twoFactorEnabled === true`:
     - Server issues `{ requires2FA: true }`.
     - Login screen renders a 6-digit TOTP verification code input.
     - User enters code from Google Authenticator.
     - Server validates code with `otplib` (`verifyGoogleAuthenticatorCode()`).
   - Issues a secure HMAC-SHA256 session token stored in browser localStorage.

### 4.2 Manual Google Authenticator 2FA Setup
To accommodate corporate mobile policies and devices without cameras, the system provides **Manual Key Setup**:
1. User navigates to **Settings -> Security & Passwords**.
2. Clicks **"Setup Google Authenticator Manually"**.
3. Server executes `POST /api/auth/2fa/generate`, returning:
   - `manualKey`: Base32 secret string (e.g. `ASADCDXZ7PLSTEPKR67MRQCYNJ342JMB`).
   - `accountName`: e.g. `admin@innovista.lk`.
   - `issuer`: `INNOVISTA Metal Fabriconix`.
   - `qrCodeUrl`: High-resolution base64 PNG QR code.
4. The user copies the manual key with the **Copy Key** button and pastes it into Google Authenticator under *"Enter a setup key"*.
5. The user enters the resulting 6-digit verification code into the modal.
6. Server verifies the code via `POST /api/auth/2fa/verify-and-enable`, setting `twoFactorEnabled = true` in PostgreSQL.

### 4.3 Administrator Password Management
The system enforces strict role-based access:
- **Admin Only Password Changes**: Only users with `role: 'admin'` can change passwords for other usernames (`PUT /api/users/:id/password`).
- **Admin Only Password Deletion**: Only admins can clear/delete passwords (`DELETE /api/users/:id/password`), converting users to Google OAuth or requiring password reassignment.
- **Self-Service Password Updates**: Any authenticated user can change their own password in Settings (`POST /api/auth/change-password`) by providing their current password and new password.

---

## 5. Complete REST API Specifications

All endpoints return JSON and are hosted on Port 3000. Protected routes require `Authorization: Bearer <token>`.

### 5.1 Authentication & Profile APIs
| Method | Endpoint | Description | Request Body | Access |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Username/Password login with 2FA check | `{ username, password, totpCode? }` | Public |
| `POST` | `/api/auth/google` | Google Firebase ID token authentication | `{ idToken: string }` | Public |
| `GET` | `/api/auth/me` | Fetch active user profile | None | Authenticated |
| `POST` | `/api/auth/change-password` | Update current user's password | `{ currentPassword, newPassword }` | Authenticated |
| `POST` | `/api/auth/2fa/generate` | Generate manual TOTP secret and QR code | None | Authenticated |
| `POST` | `/api/auth/2fa/verify-and-enable` | Verify 6-digit code and activate 2FA | `{ secret, code }` | Authenticated |
| `POST` | `/api/auth/2fa/disable` | Disable Google Authenticator 2FA | None | Authenticated |

### 5.2 User Administration APIs (Admin Only)
| Method | Endpoint | Description | Request Body | Access |
|---|---|---|---|---|
| `GET` | `/api/users` | List all system user accounts | None | Admin |
| `POST` | `/api/users` | Create new user account | `{ username, email, password?, role?, displayName? }` | Admin |
| `PUT` | `/api/users/:id/password` | Change password for specific username | `{ newPassword: string }` | Admin |
| `DELETE` | `/api/users/:id/password` | Delete / clear user's password | None | Admin |
| `DELETE` | `/api/users/:id` | Permanently delete user account | None | Admin |

### 5.3 Companies & Qualification APIs (PostgreSQL)
| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/api/companies` | Retrieve all corporate client accounts | None |
| `GET` | `/api/companies/:id` | Retrieve single client by ID | None |
| `POST` | `/api/companies` | Create new client (initializes 115 checklist items) | `Partial<Company>` |
| `PUT` | `/api/companies/:id` | Update company record | `Partial<Company>` |
| `DELETE` | `/api/companies/:id` | Remove company record | None |
| `POST` | `/api/companies/bulk` | Bulk import companies via CSV parser | `{ companies: Company[], mode: "merge" \| "append" }` |
| `POST` | `/api/companies/bulk-status` | Batch update registration status | `{ companyIds: string[], status: RegistrationStatus }` |
| `POST` | `/api/companies/bulk-assign` | Batch assign procurement representative | `{ companyIds: string[], officerName: string }` |
| `POST` | `/api/companies/bulk-delete` | Batch delete selected client accounts | `{ companyIds: string[] }` |

### 5.4 Settings & Industry Types APIs
| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/api/settings` | Retrieve all system settings | None |
| `GET` | `/api/settings/industries` | Retrieve list of configured industry types | None |
| `POST` | `/api/settings/industries` | Add new industry type with duplicate validation | `{ name: string }` |
| `PUT` | `/api/settings/industries/:oldName` | Rename industry type with cascading company update | `{ newName: string, cascadeCompanies?: boolean }` |
| `DELETE` | `/api/settings/industries/:name` | Remove industry type from preset list | None |
| `POST` | `/api/settings/industries/reset` | Restore default industrial presets | None |

### 5.5 System & Health APIs
| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/api/health` | Healthcheck reporting PostgreSQL status and counts | None |
| `DELETE` | `/api/database/clear` | Wipe companies and notifications in PostgreSQL | None |
| `POST` | `/api/database/seed-sample` | Seed 10 sample clients into PostgreSQL | None |

---

## 6. The 115-Step Master Registration Lifecycle

Each registered company possesses an automated 115-item compliance qualification matrix:
- **Phase A (12 Items)**: Initial Outreach & Procurement Intelligence
- **Phase B (15 Items)**: Pre-Qualification Criteria & Gap Analysis
- **Phase C (14 Items)**: Mandatory Statutory & Corporate Documentation
- **Phase D (20 Items)**: Technical, Quality & Machinery Dossier
- **Phase E (12 Items)**: Portal Registration & Submission
- **Phase F (16 Items)**: Evaluation, Audit & Clarification
- **Phase G (14 Items)**: Vendor Code Issuance & Win Onboarding
- **Phase H (12 Items)**: Ongoing Tender Participation & Bi-Annual Renewals

---

## 7. The 6-Factor Intelligence Scoring Engine

The platform calculates a weighted priority score ($0 - 100$):
$$\text{Total Score} = \sum (\text{Factor Score} \times \text{Weight})$$
- **Business Opportunity (25%)**: Annual tender frequency.
- **Company Suitability (20%)**: Technical fit with CNC, facade, and steel capability.
- **Potential Project Value (20%)**: Typical contract valuation.
- **Registration Accessibility (15%)**: Portal transparency vs. closed tender boards.
- **Relationship Accessibility (10%)**: Access to decision makers.
- **Registration Cost/Effort (10%)**: Registration fee and overhead.

---

## 8. User Interface & Page Interaction Flows

```
+---------------------------------------------------------------------------------------+
|  [Innovista Logo]  Overview | Clients | Pipeline | Alerts | Reports | Settings        |
|  [User: admin (Admin)] [Logout]                                                       |
|  [Database: PostgreSQL (Cloud SQL) · Active | 0 Clients | 16 Industry Types | Reset]  |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  - LoginView (Presented if not authenticated; Google Auth or Username/Password/2FA)   |
|  - Overview -> DashboardView (KPIs, Pipeline Value, Priority Targets)                 |
|  - Clients  -> CompanyListView (Filters, Table, Quick Actions, Bulk Toolbar, CSV)     |
|  - Pipeline -> PipelineBoardView (6-Column Kanban Board with Countdowns)               |
|  - Alerts   -> Upcoming Schedule Cards & Permanent Notification Audit Logs            |
|  - Reports  -> ReportsView (Win Rates, Category Analytics, Qualification Velocity)    |
|  - Settings -> SettingsView (Industry Types, Security & Passwords, Reps, DB Backup)   |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

---

## 9. End-to-End Operational Workflows

### 9.1 Signing In with Google Authenticator (2FA)
1. User enters username (`admin`) and password (`Admin@12345`).
2. If 2FA is active, the card transitions to the 2FA verification step.
3. User enters the 6-digit code from Google Authenticator.
4. System validates the code and logs the user into the executive dashboard.

### 9.2 Setting Up Google Authenticator Manually
1. User opens **Settings -> Security & Passwords**.
2. Clicks **"Setup Google Authenticator Manually"**.
3. Modal displays the **Manual Secret Key** (e.g. `ASADCDXZ7PLSTEPKR...`) and QR Code.
4. User clicks **"Copy Key"** and enters it into Google Authenticator.
5. User enters the 6-digit test code into the verification input.
6. The system activates 2FA on the user's PostgreSQL record.

### 9.3 Admin Modifying or Deleting User Passwords
1. Admin opens **Settings -> Security & Passwords -> User & Password Administration**.
2. Table shows all usernames and password statuses.
3. To change password: Admin clicks **"Change Pass"**, types the new password, and clicks **"Set Password"**.
4. To delete password: Admin clicks **"Clear Pass"** and confirms. The password hash is removed.

---

## 10. Bulk Data Engine & CSV Import/Export
- **28-Field RFC 4180 CSV Export**: Generates comprehensive corporate exports including qualification status, checklist progress %, intelligence scores, and vendor codes.
- **Flexible Header Aliasing**: Auto-detects column names like `Client`, `Buyer`, `Sector`, `Purchasing Email`, and `Vendor Portal`.

---

## 11. Settings & Industry Category Classification
- Dynamic preset management with sector auto-classification across 9 industrial categories: `Construction`, `Manufacturing`, `Finance`, `Telecom`, `Logistics`, `Hospitality`, `Healthcare`, `Conglomerate`, `Other`.
- Cascading updates automatically propagate industry renames to all matching companies in PostgreSQL.

---

## 12. Testing, Reliability & Quality Gates

### 12.1 Automated Unit Tests (`node:test`)
```bash
# Run all automated test suites (27 tests across 17 suites)
npx tsx --test src/utils/rules.test.ts src/utils/auth-helpers.test.ts src/utils/db.test.ts
```
- ✅ **PBKDF2 Password Security**: Unique salt generation, SHA-512 rounds, constant-time verification.
- ✅ **Google Authenticator TOTP**: Accurate 6-digit code validation, manual base32 secret generation, otpauth URI creation.
- ✅ **PostgreSQL Schemas**: Validation of Drizzle definitions for `users`, `companies`, `settings`, and `notifications`.
- ✅ **115-Step Master Checklist**: Mathematical weighting and progress aggregation.
- ✅ **CSV Engine**: RFC 4180 escaping and header aliasing.

---

## 13. File & Directory Reference

```
├── src/
│   ├── main.tsx                        # React application bootstrap
│   ├── App.tsx                         # Auth gate, master application state, tab router
│   ├── index.css                       # Global styles and Tailwind CSS v4 import
│   ├── types/
│   │   └── index.ts                    # TypeScript models (Company, UserProfile, TwoFactorSetup)
│   ├── lib/
│   │   ├── firebase.ts                 # Firebase Client SDK initialization
│   │   └── firebase-admin.ts           # Firebase Admin SDK with static JSON import
│   ├── db/
│   │   ├── schema.ts                   # PostgreSQL schema (users, companies, settings, notifications)
│   │   ├── index.ts                    # PostgreSQL connection pool with Drizzle ORM
│   │   └── drizzle.config.ts           # Drizzle Kit admin credentials migration config
│   ├── middleware/
│   │   └── auth.ts                     # Express authentication & admin role middleware
│   ├── services/
│   │   └── api.ts                      # Client REST service with Bearer auth & localStorage cache
│   ├── utils/
│   │   ├── rules.ts                    # Intelligence scoring, CSV export/import, countdown rules
│   │   ├── auth-helpers.ts             # PBKDF2 password hashing, session tokens, Google Authenticator
│   │   ├── auth-helpers.test.ts        # Unit tests for passwords, tokens, and 2FA
│   │   ├── rules.test.ts               # Unit tests for business logic
│   │   └── db.test.ts                  # Schema verification unit tests
│   ├── data/
│   │   ├── masterChecklist.ts          # 115-step master qualification checklist definition
│   │   ├── initialCompanies.ts         # Template reference data for optional demo seeding
│   │   └── notifications.ts            # Template reference notification logs
│   └── components/
│       ├── LoginView.tsx               # Dedicated login screen (Google + Username/Pass + 2FA)
│       ├── Navbar.tsx                  # Top navigation bar with active user and logout
│       ├── DashboardView.tsx           # Overview dashboard with KPIs, pipeline spend, targets
│       ├── CompanyListView.tsx         # Filterable company table, quick actions, bulk toolbar
│       ├── PipelineBoardView.tsx       # 6-column Kanban pipeline board with live countdowns
│       ├── CompanyDetailWorkspace.tsx  # 360-degree client management view
│       ├── SettingsView.tsx            # Industry types, User passwords, Google Authenticator setup
│       ├── ReportsView.tsx             # Executive reports and win analytics
│       ├── AddCompanyModal.tsx         # Single company creation modal
│       ├── CsvImportModal.tsx          # Bulk CSV import modal with validation preview
│       ├── WinClientModal.tsx          # Client win confirmation & vendor code issuance modal
│       ├── ScheduleAlertModal.tsx      # Schedule date picker and notification modal
│       └── NotificationCenterModal.tsx # Alert dispatch and communication logs modal
├── server.ts                           # Express server with PostgreSQL Drizzle REST API
├── firebase-applet-config.json         # Firebase project credentials
├── SYSTEM_DOCUMENTATION.md             # Complete master system documentation
└── README.md                           # Repository introduction
```

---

*Document compiled and verified for INNOVISTA METAL FABRICONIX (PVT) LTD. VendorHub Platform.*
