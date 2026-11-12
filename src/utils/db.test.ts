import test from 'node:test';
import assert from 'node:assert/strict';
import { users, companies, settings, notifications } from '../db/schema';

test('PostgreSQL Relational Schema Definitions', async (t) => {
  await t.test('users table has all required auth, role, and 2FA columns', () => {
    assert.ok(users.id, 'users has id column');
    assert.ok(users.uid, 'users has uid column');
    assert.ok(users.username, 'users has username column');
    assert.ok(users.passwordHash, 'users has passwordHash column');
    assert.ok(users.email, 'users has email column');
    assert.ok(users.role, 'users has role column');
    assert.ok(users.twoFactorSecret, 'users has twoFactorSecret column');
    assert.ok(users.twoFactorEnabled, 'users has twoFactorEnabled column');
  });

  await t.test('companies table has all qualification and jsonb columns', () => {
    assert.ok(companies.id, 'companies has id');
    assert.ok(companies.name, 'companies has name');
    assert.ok(companies.industry, 'companies has industry');
    assert.ok(companies.registrationStatus, 'companies has registrationStatus');
    assert.ok(companies.intelligence, 'companies has intelligence jsonb');
    assert.ok(companies.checklist, 'companies has checklist jsonb');
    assert.ok(companies.approval, 'companies has approval jsonb');
  });

  await t.test('settings table has key-value structure for dynamic industry types', () => {
    assert.ok(settings.key, 'settings has key');
    assert.ok(settings.value, 'settings has value jsonb');
  });

  await t.test('notifications table has required audit fields', () => {
    assert.ok(notifications.id, 'notifications has id');
    assert.ok(notifications.type, 'notifications has type');
    assert.ok(notifications.recipient, 'notifications has recipient');
    assert.ok(notifications.status, 'notifications has status');
  });
});
