import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../server/security.mjs';

test('senha usa salt, scrypt e comparação segura', async () => {
  const first = await hashPassword('uma-senha-segura');
  const second = await hashPassword('uma-senha-segura');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('uma-senha-segura', first), true);
  assert.equal(await verifyPassword('senha-incorreta', first), false);
  assert.equal(await verifyPassword('uma-senha-segura', 'inválido'), false);
});
