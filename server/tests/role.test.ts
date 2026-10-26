import test from 'node:test';
import assert from 'node:assert/strict';
import { isRoleAddress } from '../src/verification/role.ts';

test('Role Mailbox Detection', async (t) => {
  await t.test('identifies common departmental / role addresses', () => {
    assert.equal(isRoleAddress('admin@example.com'), true);
    assert.equal(isRoleAddress('ADMIN@EXAMPLE.COM'), true);
    assert.equal(isRoleAddress('support@company.org'), true);
    assert.equal(isRoleAddress('sales@startup.io'), true);
    assert.equal(isRoleAddress('info@agency.net'), true);
    assert.equal(isRoleAddress('billing@saas.com'), true);
    assert.equal(isRoleAddress('help@platform.dev'), true);
    assert.equal(isRoleAddress('contact@studio.design'), true);
    assert.equal(isRoleAddress('compliance@bank.com'), true);
    assert.equal(isRoleAddress('webmaster@domain.com'), true);
  });

  await t.test('does not flag personal recipient addresses', () => {
    assert.equal(isRoleAddress('john.doe@example.com'), false);
    assert.equal(isRoleAddress('sarah.jenkins@github.com'), false);
    assert.equal(isRoleAddress('alex.martinez@stripe.com'), false);
    assert.equal(isRoleAddress('david88@gmail.com'), false);
    assert.equal(isRoleAddress('mary@company.com'), false);
    assert.equal(isRoleAddress('invalid-email-format'), false);
  });
});
