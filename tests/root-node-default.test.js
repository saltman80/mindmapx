import test from 'node:test';
import assert from 'node:assert';
// Use the source version in netlify/functions to avoid requiring a prebuilt dist
import { DEFAULT_ROOT_X, DEFAULT_ROOT_Y } from '../netlify/functions/constants.js';

test('default root coordinates are centered', () => {
  assert.strictEqual(DEFAULT_ROOT_X, 400);
  assert.strictEqual(DEFAULT_ROOT_Y, 300);
});
