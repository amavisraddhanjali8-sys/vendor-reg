import crypto from 'crypto';
import { generateSecret, generateSync, verifySync, generateURI } from 'otplib';
import QRCode from 'qrcode';

// Salted PBKDF2 Password Hashing
export function hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
  } catch {
    return false;
  }
}

// Session Token Creation & Parsing
const SESSION_SECRET = process.env.SESSION_SECRET || 'innovista-vendorhub-session-secret-key-2026';

export function createSessionToken(payload: { userId: number; uid: string; username: string; role: string; email: string }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { userId: number; uid: string; username: string; role: string; email: string } | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Google Authenticator Manual TOTP Setup
export interface TotpSetupResult {
  secret: string;
  manualKey: string;
  qrCodeUrl: string;
  accountName: string;
  issuer: string;
  otpauthUri: string;
}

export async function generateGoogleAuthenticatorSetup(username: string, issuer: string = 'INNOVISTA Metal Fabriconix'): Promise<TotpSetupResult> {
  const secret = generateSecret();
  const label = `${username}@innovista.lk`;
  const otpauthUri = generateURI({ secret, label, issuer });
  const qrCodeUrl = await QRCode.toDataURL(otpauthUri, {
    margin: 1,
    width: 256,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  return {
    secret,
    manualKey: secret,
    qrCodeUrl,
    accountName: label,
    issuer,
    otpauthUri,
  };
}

export function verifyGoogleAuthenticatorCode(token: string, secret: string): boolean {
  try {
    const cleanToken = token.trim().replace(/\s+/g, '');
    const cleanSecret = secret.trim().replace(/\s+/g, '');
    if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      return false;
    }
    const result = verifySync({ token: cleanToken, secret: cleanSecret });
    return !!result.valid;
  } catch (err) {
    console.error('Error verifying Google Authenticator code:', err);
    return false;
  }
}
