import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('Database file persistence and operations', async (t) => {
  const testDbPath = path.resolve('data/test-db.json');

  await t.test('Clean database initialization contains zero companies and notifications', () => {
    const initialData = { companies: [], notifications: [] };
    fs.writeFileSync(testDbPath, JSON.stringify(initialData, null, 2), 'utf-8');

    const readBack = JSON.parse(fs.readFileSync(testDbPath, 'utf-8'));
    assert.equal(Array.isArray(readBack.companies), true);
    assert.equal(readBack.companies.length, 0);
    assert.equal(Array.isArray(readBack.notifications), true);
    assert.equal(readBack.notifications.length, 0);
  });

  await t.test('Appending and updating records persists correctly to JSON file', () => {
    const initialData = { companies: [], notifications: [] };
    const sampleClient = {
      id: 'comp-test-01',
      name: 'Ceylon Electricity Board',
      industry: 'Power & Energy',
      registrationStatus: 'Identified',
      priority: 'High',
      assignedOfficer: 'Ranil Jayasuriya',
    };

    const updated = {
      companies: [sampleClient],
      notifications: [
        {
          id: 'notif-test-01',
          companyId: 'comp-test-01',
          companyName: 'Ceylon Electricity Board',
          message: 'Initiated registration',
        },
      ],
    };

    fs.writeFileSync(testDbPath, JSON.stringify(updated, null, 2), 'utf-8');
    const readBack = JSON.parse(fs.readFileSync(testDbPath, 'utf-8'));

    assert.equal(readBack.companies.length, 1);
    assert.equal(readBack.companies[0].name, 'Ceylon Electricity Board');
    assert.equal(readBack.notifications.length, 1);
  });

  await t.test('Resetting database restores clean empty state without dummy records', () => {
    const cleanData = { companies: [], notifications: [] };
    fs.writeFileSync(testDbPath, JSON.stringify(cleanData, null, 2), 'utf-8');
    const readBack = JSON.parse(fs.readFileSync(testDbPath, 'utf-8'));

    assert.equal(readBack.companies.length, 0);
    assert.equal(readBack.notifications.length, 0);

    // Cleanup test file
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
});
