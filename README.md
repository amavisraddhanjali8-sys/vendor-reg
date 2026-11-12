# INNOVISTA VendorHub

> **Enterprise Vendor Registration & Corporate Client Qualification Relationship Management**  
> **Company**: INNOVISTA METAL FABRICONIX (PVT) LTD.  
> **Platform Version**: 3.0.0 (Cloud SQL PostgreSQL Relational Engine · Firebase Auth · Google Authenticator 2FA)  
> **Stack**: Node.js 22+ · Express · Vite · React 19 · TypeScript · PostgreSQL · Drizzle ORM · Tailwind CSS v4

---

## Complete System Documentation
The exhaustive, full-scale system architecture manual, PostgreSQL database schemas, REST APIs, 115-step master qualification lifecycle, 6-factor intelligence scoring engine, page interactions, manual Google Authenticator setup, and operational workflows are documented in:

- **[SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md)**

---

## Quick Start

### 1. Start Development Server
```bash
npm run dev
```
The application boots an Express server hosting the REST API (`/api/*`) on Port 3000 alongside Vite's React frontend.

### 2. Default Administrator Credentials
- **Username**: `admin`
- **Password**: `Admin@12345`
- **Role**: `admin`
- *(Can also sign in via Google OAuth or configure additional accounts and passwords in Settings)*

### 3. Run Test Suite
```bash
# 27 tests across 17 suites: intelligence scoring, 115-step checklist, passwords, 2FA, PostgreSQL schema
npx tsx --test src/utils/rules.test.ts src/utils/auth-helpers.test.ts src/utils/db.test.ts
```

### 4. Build & Typecheck
```bash
npm run build
npm run lint
```

---

## Core System Highlights

1. **Enterprise Cloud SQL (PostgreSQL)**: Scalable relational database running PostgreSQL with Drizzle ORM, connection pooling, and JSONB structures, replacing legacy file-based databases.
2. **Dedicated Login & Multi-Method Auth**: Supports Google Sign-In (Firebase Auth) and Username/Password with salted PBKDF2 hashing.
3. **Google Authenticator Manual Setup (2FA)**: Time-Based One-Time Password support with copyable manual Base32 secret keys and QR codes.
4. **Role-Based Password Controls**: Only administrators can change or delete passwords for any username, and provision new accounts. Users can also change their own credentials.
5. **Client Conglomerate Relationship Model**: Inverts traditional CRM logic — companies are prospective corporate clients where INNOVISTA seeks vendor prequalification.
6. **115-Step Master Qualification Checklist**: Automates 8 distinct compliance phases from initial procurement intelligence to factory audits, SAP supplier code issuance, and bi-annual renewals.
7. **6-Factor Weighted Intelligence Scoring**: Calculates an algorithmic priority score (0–100) and tiers clients into *High-Priority Targets*, *Medium-Priority Targets*, *Low-Priority Targets*, or *Not Recommended*.
8. **Interactive Kanban Pipeline**: Drag-and-drop or one-click status transitions across 6 pipeline stages with live countdown badges for upcoming follow-up schedules.
9. **Bulk Operations Suite**: High-throughput CSV upload with header aliasing, duplicate detection, batch status updates, batch representative assignments, and 28-field RFC 4180 CSV exports.
10. **Centralized Settings & Industry Management**: Dynamic corporate industry taxonomy with automatic sector classification and cascading renames.

For full architectural blueprints and API specifications, refer to [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md).
