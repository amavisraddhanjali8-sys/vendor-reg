import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { SAMPLE_TEMPLATE_COMPANIES } from './src/data/initialCompanies';
import { SAMPLE_TEMPLATE_NOTIFICATIONS } from './src/data/notifications';
import { DEFAULT_INDUSTRY_TYPES } from './src/utils/rules';

interface DatabaseSettings {
  industryTypes: string[];
}

interface DatabaseSchema {
  companies: any[];
  notifications: any[];
  settings?: DatabaseSettings;
}

const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure database directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        companies: Array.isArray(parsed.companies) ? parsed.companies : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        settings: {
          industryTypes:
            Array.isArray(parsed.settings?.industryTypes) && parsed.settings.industryTypes.length > 0
              ? parsed.settings.industryTypes
              : [...DEFAULT_INDUSTRY_TYPES],
        },
      };
    }
  } catch (err) {
    console.error('Error reading db.json, returning empty database:', err);
  }
  return {
    companies: [],
    notifications: [],
    settings: { industryTypes: [...DEFAULT_INDUSTRY_TYPES] },
  };
}

function writeDb(data: DatabaseSchema): void {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing db.json:', err);
    throw err;
  }
}

// Ensure db file is created on startup if missing
if (!fs.existsSync(DB_FILE)) {
  writeDb({
    companies: [],
    notifications: [],
    settings: { industryTypes: [...DEFAULT_INDUSTRY_TYPES] },
  });
}

const app = express();
app.use(express.json({ limit: '25mb' }));

// -------------------------------------------------------------
// Database Health & Stats
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({
    status: 'healthy',
    mode: process.env.NODE_ENV || 'development',
    counts: {
      companies: db.companies.length,
      notifications: db.notifications.length,
      industryTypes: db.settings?.industryTypes?.length || 0,
    },
    databasePath: 'data/db.json',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Settings & Industry Types API
// -------------------------------------------------------------
app.get('/api/settings', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, data: db.settings });
});

app.get('/api/settings/industries', (_req: Request, res: Response) => {
  const db = readDb();
  const list = db.settings?.industryTypes || DEFAULT_INDUSTRY_TYPES;
  res.json({ success: true, count: list.length, data: list });
});

app.post('/api/settings/industries', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Industry name is required' });
  }

  const trimmed = name.trim();
  const db = readDb();
  const currentList = db.settings?.industryTypes || [...DEFAULT_INDUSTRY_TYPES];

  const exists = currentList.some((item: string) => item.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, error: `Industry "${trimmed}" already exists` });
  }

  currentList.push(trimmed);
  db.settings = { ...(db.settings || {}), industryTypes: currentList };
  writeDb(db);
  res.status(201).json({ success: true, data: currentList });
});

app.put('/api/settings/industries/:oldName', (req: Request, res: Response) => {
  const oldName = decodeURIComponent(req.params.oldName).trim();
  const { newName, cascadeCompanies = true } = req.body;

  if (!newName || typeof newName !== 'string' || !newName.trim()) {
    return res.status(400).json({ success: false, error: 'New industry name is required' });
  }

  const trimmedNew = newName.trim();
  const db = readDb();
  const currentList = db.settings?.industryTypes || [...DEFAULT_INDUSTRY_TYPES];

  const index = currentList.findIndex((item: string) => item.toLowerCase() === oldName.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Industry type not found' });
  }

  // Check if new name conflicts with another entry
  const conflict = currentList.some(
    (item: string, idx: number) => idx !== index && item.toLowerCase() === trimmedNew.toLowerCase()
  );
  if (conflict) {
    return res.status(400).json({ success: false, error: `Industry "${trimmedNew}" already exists` });
  }

  currentList[index] = trimmedNew;
  db.settings = { ...(db.settings || {}), industryTypes: currentList };

  let affectedCompaniesCount = 0;
  if (cascadeCompanies) {
    db.companies = db.companies.map((c: any) => {
      if (c.industry && c.industry.toLowerCase() === oldName.toLowerCase()) {
        affectedCompaniesCount++;
        return { ...c, industry: trimmedNew, updatedAt: new Date().toISOString() };
      }
      return c;
    });
  }

  writeDb(db);
  res.json({ success: true, data: currentList, affectedCompaniesCount });
});

app.delete('/api/settings/industries/:name', (req: Request, res: Response) => {
  const nameToRemove = decodeURIComponent(req.params.name).trim();
  const db = readDb();
  const currentList = db.settings?.industryTypes || [...DEFAULT_INDUSTRY_TYPES];

  const filtered = currentList.filter((item: string) => item.toLowerCase() !== nameToRemove.toLowerCase());
  if (filtered.length === currentList.length) {
    return res.status(404).json({ success: false, error: 'Industry type not found' });
  }

  db.settings = { ...(db.settings || {}), industryTypes: filtered };
  writeDb(db);
  res.json({ success: true, data: filtered });
});

app.post('/api/settings/industries/reset', (_req: Request, res: Response) => {
  const db = readDb();
  db.settings = { ...(db.settings || {}), industryTypes: [...DEFAULT_INDUSTRY_TYPES] };
  writeDb(db);
  res.json({ success: true, data: db.settings.industryTypes });
});

// -------------------------------------------------------------
// Companies API
// -------------------------------------------------------------
app.get('/api/companies', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, count: db.companies.length, data: db.companies });
});

app.get('/api/companies/:id', (req: Request, res: Response) => {
  const db = readDb();
  const company = db.companies.find((c: any) => c.id === req.params.id);
  if (!company) {
    return res.status(404).json({ success: false, error: 'Company not found' });
  }
  res.json({ success: true, data: company });
});

app.post('/api/companies', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    return res.status(400).json({ success: false, error: 'Company name is required' });
  }

  const db = readDb();
  const newCompany = {
    ...payload,
    id: payload.id || `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.companies.unshift(newCompany);

  // If company has an industry that is not in settings, auto-add it to settings
  if (newCompany.industry && typeof newCompany.industry === 'string') {
    const indTrimmed = newCompany.industry.trim();
    const indList = db.settings?.industryTypes || [...DEFAULT_INDUSTRY_TYPES];
    if (indTrimmed && !indList.some((i: string) => i.toLowerCase() === indTrimmed.toLowerCase())) {
      indList.push(indTrimmed);
      db.settings = { ...(db.settings || {}), industryTypes: indList };
    }
  }

  writeDb(db);
  res.status(201).json({ success: true, data: newCompany });
});

app.put('/api/companies/:id', (req: Request, res: Response) => {
  const db = readDb();
  const index = db.companies.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Company not found' });
  }

  const updatedCompany = {
    ...db.companies[index],
    ...req.body,
    id: req.params.id, // Immutable ID
    updatedAt: new Date().toISOString(),
  };

  db.companies[index] = updatedCompany;

  // If industry updated to something new, auto-add to settings
  if (updatedCompany.industry && typeof updatedCompany.industry === 'string') {
    const indTrimmed = updatedCompany.industry.trim();
    const indList = db.settings?.industryTypes || [...DEFAULT_INDUSTRY_TYPES];
    if (indTrimmed && !indList.some((i: string) => i.toLowerCase() === indTrimmed.toLowerCase())) {
      indList.push(indTrimmed);
      db.settings = { ...(db.settings || {}), industryTypes: indList };
    }
  }

  writeDb(db);
  res.json({ success: true, data: updatedCompany });
});

app.delete('/api/companies/:id', (req: Request, res: Response) => {
  const db = readDb();
  const index = db.companies.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Company not found' });
  }

  const [deleted] = db.companies.splice(index, 1);
  writeDb(db);
  res.json({ success: true, data: deleted });
});

// Bulk Import
app.post('/api/companies/bulk', (req: Request, res: Response) => {
  const { companies: imported, mode = 'append' } = req.body;
  if (!Array.isArray(imported)) {
    return res.status(400).json({ success: false, error: 'Expected an array of companies' });
  }

  const db = readDb();
  const indList = db.settings?.industryTypes || [...DEFAULT_INDUSTRY_TYPES];

  if (mode === 'merge') {
    const list = [...db.companies];
    imported.forEach((newItem: any) => {
      const idx = list.findIndex(
        (c: any) => c.name?.toLowerCase().trim() === newItem.name?.toLowerCase().trim()
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...newItem, updatedAt: new Date().toISOString() };
      } else {
        list.unshift({
          ...newItem,
          id: newItem.id || `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: newItem.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (newItem.industry && typeof newItem.industry === 'string') {
        const indTrimmed = newItem.industry.trim();
        if (indTrimmed && !indList.some((i: string) => i.toLowerCase() === indTrimmed.toLowerCase())) {
          indList.push(indTrimmed);
        }
      }
    });
    db.companies = list;
  } else {
    // Append
    const formatted = imported.map((newItem: any) => {
      if (newItem.industry && typeof newItem.industry === 'string') {
        const indTrimmed = newItem.industry.trim();
        if (indTrimmed && !indList.some((i: string) => i.toLowerCase() === indTrimmed.toLowerCase())) {
          indList.push(indTrimmed);
        }
      }
      return {
        ...newItem,
        id: newItem.id || `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: newItem.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    db.companies = [...formatted, ...db.companies];
  }

  db.settings = { ...(db.settings || {}), industryTypes: indList };
  writeDb(db);
  res.json({ success: true, count: db.companies.length, data: db.companies });
});

// Bulk Status Update
app.post('/api/companies/bulk-status', (req: Request, res: Response) => {
  const { companyIds, status } = req.body;
  if (!Array.isArray(companyIds) || !status) {
    return res.status(400).json({ success: false, error: 'companyIds array and status are required' });
  }

  const db = readDb();
  const isApproved = status === 'Approved';
  db.companies = db.companies.map((c: any) => {
    if (companyIds.includes(c.id)) {
      return {
        ...c,
        registrationStatus: status,
        approval: {
          ...c.approval,
          status: isApproved ? 'Approved' : (c.approval?.status || 'Pending'),
          approvalDate: isApproved ? new Date().toISOString().slice(0, 10) : c.approval?.approvalDate,
        },
        updatedAt: new Date().toISOString(),
      };
    }
    return c;
  });

  writeDb(db);
  res.json({ success: true, count: companyIds.length, data: db.companies });
});

// Bulk Assign Officer
app.post('/api/companies/bulk-assign', (req: Request, res: Response) => {
  const { companyIds, officerName } = req.body;
  if (!Array.isArray(companyIds) || !officerName) {
    return res.status(400).json({ success: false, error: 'companyIds array and officerName are required' });
  }

  const db = readDb();
  db.companies = db.companies.map((c: any) => {
    if (companyIds.includes(c.id)) {
      return {
        ...c,
        assignedOfficer: officerName,
        updatedAt: new Date().toISOString(),
      };
    }
    return c;
  });

  writeDb(db);
  res.json({ success: true, count: companyIds.length, data: db.companies });
});

// Bulk Delete
app.post('/api/companies/bulk-delete', (req: Request, res: Response) => {
  const { companyIds } = req.body;
  if (!Array.isArray(companyIds)) {
    return res.status(400).json({ success: false, error: 'companyIds array is required' });
  }

  const db = readDb();
  const initialCount = db.companies.length;
  db.companies = db.companies.filter((c: any) => !companyIds.includes(c.id));
  const deletedCount = initialCount - db.companies.length;

  writeDb(db);
  res.json({ success: true, deletedCount, data: db.companies });
});

// -------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------
app.get('/api/notifications', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, count: db.notifications.length, data: db.notifications });
});

app.post('/api/notifications', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || !payload.companyName || !payload.message) {
    return res.status(400).json({ success: false, error: 'companyName and message are required' });
  }

  const db = readDb();
  const newNotif = {
    id: payload.id || `notif-${Date.now()}`,
    ...payload,
    sentAt: payload.sentAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: payload.status || 'Delivered',
  };

  db.notifications.unshift(newNotif);
  writeDb(db);
  res.status(201).json({ success: true, data: newNotif });
});

app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  const db = readDb();
  const index = db.notifications.findIndex((n: any) => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  const [deleted] = db.notifications.splice(index, 1);
  writeDb(db);
  res.json({ success: true, data: deleted });
});

// -------------------------------------------------------------
// Database Reset & Sample Seed Utilities
// -------------------------------------------------------------
app.delete('/api/database/clear', (_req: Request, res: Response) => {
  const db = readDb();
  const emptyDb: DatabaseSchema = {
    companies: [],
    notifications: [],
    settings: db.settings || { industryTypes: [...DEFAULT_INDUSTRY_TYPES] },
  };
  writeDb(emptyDb);
  res.json({ success: true, message: 'Database reset to clean state (0 companies, 0 notifications)' });
});

app.post('/api/database/seed-sample', (_req: Request, res: Response) => {
  const seedDb: DatabaseSchema = {
    companies: SAMPLE_TEMPLATE_COMPANIES,
    notifications: SAMPLE_TEMPLATE_NOTIFICATIONS,
    settings: { industryTypes: [...DEFAULT_INDUSTRY_TYPES] },
  };
  writeDb(seedDb);
  res.json({
    success: true,
    message: 'Sample demo data seeded successfully',
    counts: {
      companies: seedDb.companies.length,
      notifications: seedDb.notifications.length,
      industryTypes: seedDb.settings?.industryTypes?.length || 0,
    },
  });
});

// -------------------------------------------------------------
// Dev & Production Server Routing
// -------------------------------------------------------------
async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`INNOVISTA VendorHub Database Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
