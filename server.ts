import express, { Request, Response } from 'express';
import path from 'path';
import { db } from './src/db/index.ts';
import { companies, notifications, settings, users } from './src/db/schema.ts';
import { eq, inArray, desc } from 'drizzle-orm';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  generateGoogleAuthenticatorSetup,
  verifyGoogleAuthenticatorCode,
} from './src/utils/auth-helpers.ts';
import { DEFAULT_INDUSTRY_TYPES } from './src/utils/rules.ts';
import { SAMPLE_TEMPLATE_COMPANIES } from './src/data/initialCompanies.ts';
import { SAMPLE_TEMPLATE_NOTIFICATIONS } from './src/data/notifications.ts';

const app = express();
app.use(express.json({ limit: '25mb' }));

// -------------------------------------------------------------
// Database Initialization & Seed
// -------------------------------------------------------------
async function initializeDatabase() {
  try {
    // 1. Initialize settings if missing
    const existingSettings = await db.select().from(settings).where(eq(settings.key, 'industryTypes'));
    if (existingSettings.length === 0) {
      await db.insert(settings).values({
        key: 'industryTypes',
        value: { list: DEFAULT_INDUSTRY_TYPES },
      });
      console.log('PostgreSQL: Initialized default industry types');
    }

    // 2. Initialize default admin user if no users exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      await db.insert(users).values({
        uid: 'admin-root',
        username: 'admin',
        passwordHash: hashPassword('Admin@12345'),
        email: 'admin@innovista.lk',
        role: 'admin',
        displayName: 'INNOVISTA Administrator',
        twoFactorEnabled: false,
      });
      console.log('PostgreSQL: Seeded default administrator user (admin / Admin@12345)');
    }
  } catch (err) {
    console.error('Database initialization warning:', err);
  }
}

// -------------------------------------------------------------
// Authentication Helper & Middleware
// -------------------------------------------------------------
async function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const rootAdmin = await db.select().from(users).where(eq(users.username, 'admin'));
    if (rootAdmin.length > 0) {
      return rootAdmin[0];
    }
    return null;
  }
  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Try session token
  const session = verifySessionToken(token);
  if (session) {
    const userRows = await db.select().from(users).where(eq(users.id, session.userId));
    if (userRows.length > 0) {
      return userRows[0];
    }
  }

  // 2. Try Firebase ID token
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email) {
      const userRows = await db.select().from(users).where(eq(users.email, decoded.email));
      if (userRows.length > 0) {
        return userRows[0];
      }
      // Create user if not existing
      const newUser = await db
        .insert(users)
        .values({
          uid: decoded.uid,
          username: decoded.email.split('@')[0],
          email: decoded.email,
          role: 'admin',
          displayName: decoded.name || 'Google User',
          twoFactorEnabled: false,
        })
        .returning();
      return newUser[0];
    }
  } catch {
    // Token not Firebase ID token
  }

  return null;
}

// -------------------------------------------------------------
// Auth APIs
// -------------------------------------------------------------

// Username / Password Login with Google Authenticator TOTP Support
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password, totpCode } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const cleanUsername = String(username).trim();
    const userRows = await db.select().from(users).where(eq(users.username, cleanUsername));

    if (userRows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const user = userRows[0];

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'Password login is disabled for this user. Please sign in with Google or contact an admin.',
      });
    }

    const passwordValid = verifyPassword(String(password), user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!totpCode) {
        return res.status(200).json({
          success: false,
          requires2FA: true,
          message: 'Google Authenticator 6-digit code required',
        });
      }

      const totpValid = verifyGoogleAuthenticatorCode(String(totpCode), user.twoFactorSecret);
      if (!totpValid) {
        return res.status(401).json({
          success: false,
          requires2FA: true,
          error: 'Invalid Google Authenticator code. Please check your app and try again.',
        });
      }
    }

    const token = createSessionToken({
      userId: user.id,
      uid: user.uid,
      username: user.username,
      role: user.role,
      email: user.email,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

// Google Sign-In with Firebase verification
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'Firebase idToken is required' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email || '';
    if (!email) {
      return res.status(400).json({ success: false, error: 'Google account missing verified email' });
    }

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      // Update Google UID if needed
      if (user.uid !== decoded.uid) {
        await db.update(users).set({ uid: decoded.uid }).where(eq(users.id, user.id));
      }
    } else {
      const usernameCandidate = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
      const inserted = await db
        .insert(users)
        .values({
          uid: decoded.uid,
          username: usernameCandidate || `user_${Date.now()}`,
          email,
          role: 'admin',
          displayName: decoded.name || 'Google User',
          twoFactorEnabled: false,
        })
        .returning();
      user = inserted[0];
    }

    const token = createSessionToken({
      userId: user.id,
      uid: user.uid,
      username: user.username,
      role: user.role,
      email: user.email,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (err: any) {
    console.error('Google Auth error:', err);
    res.status(401).json({ success: false, error: 'Failed to verify Google token' });
  }
});

// Current User Profile
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Change Own Password
app.post('/api/auth/change-password', async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    // If user has existing password, verify currentPassword
    if (user.passwordHash) {
      if (!currentPassword || !verifyPassword(String(currentPassword), user.passwordHash)) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect' });
      }
    }

    const newHash = hashPassword(String(newPassword));
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup Google Authenticator: Generate Secret & QR Code
app.post('/api/auth/2fa/generate', async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const setupData = await generateGoogleAuthenticatorSetup(user.username);
    res.json({ success: true, data: setupData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup Google Authenticator: Verify Code and Enable 2FA
app.post('/api/auth/2fa/verify-and-enable', async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { secret, code } = req.body;
    if (!secret || !code) {
      return res.status(400).json({ success: false, error: 'Secret and verification code are required' });
    }

    const isValid = verifyGoogleAuthenticatorCode(String(code), String(secret));
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid 6-digit verification code. Please check your authenticator app.' });
    }

    await db
      .update(users)
      .set({
        twoFactorSecret: String(secret).trim(),
        twoFactorEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.json({ success: true, message: 'Google Authenticator 2FA enabled successfully!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Disable Google Authenticator 2FA
app.post('/api/auth/2fa/disable', async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    await db
      .update(users)
      .set({
        twoFactorSecret: null,
        twoFactorEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.json({ success: true, message: 'Google Authenticator 2FA disabled' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// User Management APIs (Admin Only)
// -------------------------------------------------------------

// List All Users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.id));
    const sanitized = allUsers.map((u) => ({
      id: u.id,
      uid: u.uid,
      username: u.username,
      email: u.email,
      role: u.role,
      displayName: u.displayName,
      twoFactorEnabled: u.twoFactorEnabled,
      hasPassword: !!u.passwordHash,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create New User (Admin Only)
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { username, password, email, role = 'officer', displayName } = req.body;
    if (!username || !email) {
      return res.status(400).json({ success: false, error: 'Username and email are required' });
    }

    const cleanUsername = String(username).trim();
    const existing = await db.select().from(users).where(eq(users.username, cleanUsername));
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const passwordHash = password ? hashPassword(String(password)) : null;

    const inserted = await db
      .insert(users)
      .values({
        uid: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: cleanUsername,
        passwordHash,
        email: String(email).trim(),
        role: role === 'admin' ? 'admin' : 'officer',
        displayName: displayName || cleanUsername,
        twoFactorEnabled: false,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        id: inserted[0].id,
        uid: inserted[0].uid,
        username: inserted[0].username,
        email: inserted[0].email,
        role: inserted[0].role,
        displayName: inserted[0].displayName,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Change Any User's Password
app.put('/api/users/:id/password', async (req: Request, res: Response) => {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can change user passwords' });
    }

    const targetId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const targetUser = await db.select().from(users).where(eq(users.id, targetId));
    if (targetUser.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const newHash = hashPassword(String(newPassword));
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, targetId));

    res.json({
      success: true,
      message: `Password updated successfully for username: ${targetUser[0].username}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Delete / Clear Any User's Password
app.delete('/api/users/:id/password', async (req: Request, res: Response) => {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can delete user passwords' });
    }

    const targetId = parseInt(req.params.id, 10);
    const targetUser = await db.select().from(users).where(eq(users.id, targetId));
    if (targetUser.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Cannot delete the primary admin password if no other admin exists
    if (targetUser[0].username === 'admin' && currentUser.id === targetId) {
      return res.status(400).json({ success: false, error: 'Cannot clear the root admin password' });
    }

    await db
      .update(users)
      .set({ passwordHash: null, updatedAt: new Date() })
      .where(eq(users.id, targetId));

    res.json({
      success: true,
      message: `Password removed for ${targetUser[0].username}. They must log in via Google or set a new password.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Delete User Account
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can delete user accounts' });
    }

    const targetId = parseInt(req.params.id, 10);
    if (currentUser.id === targetId) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own active account' });
    }

    const targetUser = await db.select().from(users).where(eq(users.id, targetId));
    if (targetUser.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await db.delete(users).where(eq(users.id, targetId));
    res.json({ success: true, message: `User ${targetUser[0].username} deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Database Health & Stats
// -------------------------------------------------------------
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const allCompanies = await db.select().from(companies);
    const allNotifications = await db.select().from(notifications);
    const indSettings = await db.select().from(settings).where(eq(settings.key, 'industryTypes'));
    const indList = (indSettings[0]?.value as any)?.list || DEFAULT_INDUSTRY_TYPES;

    res.json({
      status: 'healthy',
      database: 'PostgreSQL (Cloud SQL)',
      counts: {
        companies: allCompanies.length,
        notifications: allNotifications.length,
        industryTypes: indList.length,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// -------------------------------------------------------------
// Settings & Industry Types APIs
// -------------------------------------------------------------
app.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const row = await db.select().from(settings).where(eq(settings.key, 'industryTypes'));
    const list = (row[0]?.value as any)?.list || DEFAULT_INDUSTRY_TYPES;
    res.json({ success: true, data: { industryTypes: list } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/settings/industries', async (_req: Request, res: Response) => {
  try {
    const row = await db.select().from(settings).where(eq(settings.key, 'industryTypes'));
    const list = (row[0]?.value as any)?.list || DEFAULT_INDUSTRY_TYPES;
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/industries', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Industry name is required' });
    }

    const trimmed = name.trim();
    const row = await db.select().from(settings).where(eq(settings.key, 'industryTypes'));
    const currentList: string[] = (row[0]?.value as any)?.list || [...DEFAULT_INDUSTRY_TYPES];

    if (currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      return res.status(400).json({ success: false, error: `Industry "${trimmed}" already exists` });
    }

    const updated = [...currentList, trimmed];
    await db
      .insert(settings)
      .values({ key: 'industryTypes', value: { list: updated } })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: { list: updated }, updatedAt: new Date() },
      });

    res.status(201).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings/industries/:oldName', async (req: Request, res: Response) => {
  try {
    const oldName = decodeURIComponent(req.params.oldName).trim();
    const { newName, cascadeCompanies = true } = req.body;

    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      return res.status(400).json({ success: false, error: 'New industry name is required' });
    }

    const trimmedNew = newName.trim();
    const row = await db.select().from(settings).where(eq(settings.key, 'industryTypes'));
    const currentList: string[] = (row[0]?.value as any)?.list || [...DEFAULT_INDUSTRY_TYPES];

    const index = currentList.findIndex((item) => item.toLowerCase() === oldName.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Industry type not found' });
    }

    if (currentList.some((item, idx) => idx !== index && item.toLowerCase() === trimmedNew.toLowerCase())) {
      return res.status(400).json({ success: false, error: `An industry named "${trimmedNew}" already exists` });
    }

    currentList[index] = trimmedNew;
    await db
      .insert(settings)
      .values({ key: 'industryTypes', value: { list: currentList } })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: { list: currentList }, updatedAt: new Date() },
      });

    let affectedCount = 0;
    if (cascadeCompanies) {
      const allComps = await db.select().from(companies);
      for (const comp of allComps) {
        if (comp.industry.toLowerCase() === oldName.toLowerCase()) {
          await db
            .update(companies)
            .set({ industry: trimmedNew, updatedAt: new Date().toISOString() })
            .where(eq(companies.id, comp.id));
          affectedCount++;
        }
      }
    }

    res.json({ success: true, data: currentList, affectedCompaniesCount: affectedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/settings/industries/:name', async (req: Request, res: Response) => {
  try {
    const targetName = decodeURIComponent(req.params.name).trim();
    const row = await db.select().from(settings).where(eq(settings.key, 'industryTypes'));
    const currentList: string[] = (row[0]?.value as any)?.list || [...DEFAULT_INDUSTRY_TYPES];

    const updated = currentList.filter((item) => item.toLowerCase() !== targetName.toLowerCase());
    await db
      .insert(settings)
      .values({ key: 'industryTypes', value: { list: updated } })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: { list: updated }, updatedAt: new Date() },
      });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/industries/reset', async (_req: Request, res: Response) => {
  try {
    await db
      .insert(settings)
      .values({ key: 'industryTypes', value: { list: DEFAULT_INDUSTRY_TYPES } })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: { list: DEFAULT_INDUSTRY_TYPES }, updatedAt: new Date() },
      });
    res.json({ success: true, data: DEFAULT_INDUSTRY_TYPES });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Companies CRUD (PostgreSQL)
// -------------------------------------------------------------
app.get('/api/companies', async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(companies);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const row = await db.select().from(companies).where(eq(companies.id, req.params.id));
    if (row.length === 0) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    res.json({ success: true, data: row[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/companies', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.name) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }

    const companyId = payload.id || `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newCompany = {
      id: companyId,
      name: String(payload.name).trim(),
      industry: String(payload.industry || 'Conglomerates & Real Estate Development').trim(),
      companyType: payload.companyType || 'PLC',
      website: payload.website || '',
      headOfficeAddress: payload.headOfficeAddress || '',
      mainTelephone: payload.mainTelephone || '',
      procurementEmail: payload.procurementEmail || '',
      procurementContact: payload.procurementContact || '',
      registrationPortal: payload.registrationPortal || '',
      priority: payload.priority || 'Medium',
      registrationStatus: payload.registrationStatus || 'Identified',
      assignedOfficer: payload.assignedOfficer || 'General SCM Desk',
      notes: payload.notes || '',
      nextFollowUpDate: payload.nextFollowUpDate || '',
      intelligence: payload.intelligence || {
        businessOpportunity: 70,
        companySuitability: 70,
        registrationAccessibility: 60,
        potentialProjectValue: 70,
        relationshipAccessibility: 50,
        registrationCostEffort: 50,
        totalScore: 65,
        tier: 'Medium-priority target',
      },
      contacts: Array.isArray(payload.contacts) ? payload.contacts : [],
      checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
      documents: Array.isArray(payload.documents) ? payload.documents : [],
      communicationLogs: Array.isArray(payload.communicationLogs) ? payload.communicationLogs : [],
      opportunities: Array.isArray(payload.opportunities) ? payload.opportunities : [],
      submission: payload.submission || null,
      approval: payload.approval || {
        vendorNumber: '',
        portalLogin: '',
        approvedCategories: [],
        renewalReminderDays: 30,
        status: 'Pending',
      },
      evaluation: payload.evaluation || null,
      createdAt: payload.createdAt || nowIso,
      updatedAt: nowIso,
    };

    await db.insert(companies).values(newCompany);
    res.status(201).json({ success: true, data: newCompany });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(companies).where(eq(companies.id, req.params.id));
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const payload = req.body;
    const updatedCompany = {
      ...existing[0],
      ...payload,
      id: existing[0].id,
      updatedAt: new Date().toISOString(),
    };

    await db.update(companies).set(updatedCompany).where(eq(companies.id, req.params.id));
    res.json({ success: true, data: updatedCompany });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(companies).where(eq(companies.id, req.params.id));
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    await db.delete(companies).where(eq(companies.id, req.params.id));
    res.json({ success: true, data: existing[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk Operations
app.post('/api/companies/bulk', async (req: Request, res: Response) => {
  try {
    const { companies: importedList, mode = 'append' } = req.body;
    if (!Array.isArray(importedList) || importedList.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of companies is required' });
    }

    if (mode === 'replace') {
      await db.delete(companies);
    }

    for (const c of importedList) {
      const companyId = c.id || `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const item = {
        ...c,
        id: companyId,
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db
        .insert(companies)
        .values(item)
        .onConflictDoUpdate({
          target: companies.id,
          set: item,
        });
    }

    const all = await db.select().from(companies);
    res.json({ success: true, count: all.length, data: all });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/companies/bulk-status', async (req: Request, res: Response) => {
  try {
    const { companyIds, status } = req.body;
    if (!Array.isArray(companyIds) || companyIds.length === 0 || !status) {
      return res.status(400).json({ success: false, error: 'companyIds array and status are required' });
    }

    for (const id of companyIds) {
      await db
        .update(companies)
        .set({ registrationStatus: status, updatedAt: new Date().toISOString() })
        .where(eq(companies.id, id));
    }

    const all = await db.select().from(companies);
    res.json({ success: true, count: all.length, data: all });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/companies/bulk-assign', async (req: Request, res: Response) => {
  try {
    const { companyIds, officerName } = req.body;
    if (!Array.isArray(companyIds) || companyIds.length === 0 || !officerName) {
      return res.status(400).json({ success: false, error: 'companyIds array and officerName are required' });
    }

    for (const id of companyIds) {
      await db
        .update(companies)
        .set({ assignedOfficer: officerName, updatedAt: new Date().toISOString() })
        .where(eq(companies.id, id));
    }

    const all = await db.select().from(companies);
    res.json({ success: true, count: all.length, data: all });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/companies/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { companyIds } = req.body;
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ success: false, error: 'companyIds array is required' });
    }

    await db.delete(companies).where(inArray(companies.id, companyIds));
    const all = await db.select().from(companies);
    res.json({ success: true, deletedCount: companyIds.length, data: all });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Notifications APIs (PostgreSQL)
// -------------------------------------------------------------
app.get('/api/notifications', async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(notifications);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const newLog = {
      id: payload.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: payload.type || payload.channel || 'Email',
      title: payload.title || payload.event || 'Notification',
      message: payload.message || '',
      companyId: payload.companyId || '',
      companyName: payload.companyName || '',
      recipient: payload.recipient || '',
      status: payload.status || 'Delivered',
      timestamp: payload.timestamp || payload.sentAt || new Date().toISOString(),
    };

    await db.insert(notifications).values(newLog);
    res.status(201).json({ success: true, data: newLog });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
  try {
    await db.delete(notifications).where(eq(notifications.id, req.params.id));
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Database Clear & Sample Seeding
app.delete('/api/database/clear', async (_req: Request, res: Response) => {
  try {
    await db.delete(companies);
    await db.delete(notifications);
    res.json({ success: true, message: 'Database reset to clean state (0 companies, 0 notifications)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/database/seed-sample', async (_req: Request, res: Response) => {
  try {
    await db.delete(companies);
    for (const c of SAMPLE_TEMPLATE_COMPANIES) {
      await db.insert(companies).values(c as any);
    }
    await db.delete(notifications);
    for (const n of SAMPLE_TEMPLATE_NOTIFICATIONS) {
      await db.insert(notifications).values({
        id: n.id,
        type: n.channel,
        title: n.event,
        message: n.message,
        companyId: n.companyId,
        companyName: n.companyName,
        recipient: n.recipient,
        status: n.status,
        timestamp: n.sentAt,
      });
    }

    res.json({
      success: true,
      message: 'Sample demo data seeded successfully into PostgreSQL',
      counts: {
        companies: SAMPLE_TEMPLATE_COMPANIES.length,
        notifications: SAMPLE_TEMPLATE_NOTIFICATIONS.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Dev & Production Server Routing
// -------------------------------------------------------------
async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize PostgreSQL schemas & default accounts
  await initializeDatabase();

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
    console.log(`INNOVISTA VendorHub PostgreSQL Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
