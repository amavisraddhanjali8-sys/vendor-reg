import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  generateGoogleAuthenticatorSetup,
  verifyGoogleAuthenticatorCode,
} from './auth-helpers';
import { generateSync } from 'otplib';

test('Password Hashing and Verification', async (t) => {
  await t.test('correctly hashes password with unique salt', () => {
    const hash1 = hashPassword('Secret123!');
    const hash2 = hashPassword('Secret123!');
    assert.notEqual(hash1, hash2, 'Different salts produce different hashes');
    assert.match(hash1, /^[0-9a-f]{32}:[0-9a-f]{128}$/, 'Hash follows salt:hash format');
  });

  await t.test('verifies valid password against hash', () => {
    const hash = hashPassword('Admin@12345');
    assert.equal(verifyPassword('Admin@12345', hash), true);
    assert.equal(verifyPassword('WrongPassword', hash), false);
    assert.equal(verifyPassword('', hash), false);
    assert.equal(verifyPassword('Admin@12345', 'invalid-hash-string'), false);
  });
});

test('Session Token Creation & Verification', async (t) => {
  await t.test('generates valid HMAC-signed session token and extracts payload', () => {
    const payload = {
      userId: 1,
      uid: 'admin-root',
      username: 'admin',
      role: 'admin',
      email: 'admin@innovista.lk',
    };

    const token = createSessionToken(payload);
    assert.ok(typeof token === 'string' && token.includes('.'));

    const verified = verifySessionToken(token);
    assert.ok(verified !== null);
    assert.equal(verified?.username, 'admin');
    assert.equal(verified?.role, 'admin');
    assert.equal(verified?.userId, 1);
  });

  await t.test('rejects tampered or malformed tokens', () => {
    const payload = { userId: 2, uid: 'user-2', username: 'kavindu', role: 'officer', email: 'k@innovista.lk' };
    const token = createSessionToken(payload);
    const tampered = token.slice(0, -4) + 'abcd';
    assert.equal(verifySessionToken(tampered), null);
    assert.equal(verifySessionToken('completely-invalid'), null);
  });
});

test('Google Authenticator Setup and Verification', async (t) => {
  await t.test('generates manual secret key, QR code, and otpauth URI', async () => {
    const setup = await generateGoogleAuthenticatorSetup('admin');
    assert.ok(setup.secret.length >= 16, 'Secret key has adequate entropy');
    assert.equal(setup.manualKey, setup.secret, 'Manual key matches secret');
    assert.match(setup.qrCodeUrl, /^data:image\/png;base64,/, 'QR Code is base64 PNG data URL');
    assert.ok(setup.otpauthUri.startsWith('otpauth://totp/'));
    assert.ok(setup.otpauthUri.includes('INNOVISTA'));
  });

  await t.test('verifies accurate 6-digit TOTP code against generated secret', async () => {
    const setup = await generateGoogleAuthenticatorSetup('test_officer');
    const validCode = generateSync({ secret: setup.secret });
    assert.equal(validCode.length, 6, 'Generated code is 6 digits');

    assert.equal(verifyGoogleAuthenticatorCode(validCode, setup.secret), true);
    assert.equal(verifyGoogleAuthenticatorCode('000000', setup.secret), false);
    assert.equal(verifyGoogleAuthenticatorCode('invalid', setup.secret), false);
  });
});
