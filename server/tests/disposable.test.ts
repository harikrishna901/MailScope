import test from 'node:test';
import assert from 'node:assert/strict';
import { isDisposableDomain, isFreeProvider } from '../src/verification/disposable.ts';

test('Disposable Domain & Free Provider Detection', async (t) => {
  await t.test('detects well-known disposable throwaway email domains', () => {
    assert.equal(isDisposableDomain('mailinator.com'), true);
    assert.equal(isDisposableDomain('MAILINATOR.COM'), true);
    assert.equal(isDisposableDomain('sub.mailinator.com'), true);
    assert.equal(isDisposableDomain('guerrillamail.com'), true);
    assert.equal(isDisposableDomain('10minutemail.com'), true);
    assert.equal(isDisposableDomain('tempmail.com'), true);
    assert.equal(isDisposableDomain('yopmail.com'), true);
    assert.equal(isDisposableDomain('trashmail.com'), true);
  });

  await t.test('does not flag permanent business or popular consumer domains as disposable', () => {
    assert.equal(isDisposableDomain('gmail.com'), false);
    assert.equal(isDisposableDomain('stripe.com'), false);
    assert.equal(isDisposableDomain('github.com'), false);
    assert.equal(isDisposableDomain('microsoft.com'), false);
    assert.equal(isDisposableDomain('custom-domain.org'), false);
  });

  await t.test('detects popular free consumer email providers', () => {
    assert.equal(isFreeProvider('gmail.com'), true);
    assert.equal(isFreeProvider('GMAIL.COM'), true);
    assert.equal(isFreeProvider('yahoo.com'), true);
    assert.equal(isFreeProvider('outlook.com'), true);
    assert.equal(isFreeProvider('hotmail.com'), true);
    assert.equal(isFreeProvider('icloud.com'), true);
    assert.equal(isFreeProvider('proton.me'), true);
  });

  await t.test('does not flag custom / corporate domains as free providers', () => {
    assert.equal(isFreeProvider('stripe.com'), false);
    assert.equal(isFreeProvider('github.com'), false);
    assert.equal(isFreeProvider('cloudflare.com'), false);
    assert.equal(isFreeProvider('example.com'), false);
  });
});
