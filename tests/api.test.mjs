import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/api.js';

test('renova o token CSRF uma vez e repete a ação', async () => {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (calls.length === 1) return { status: 403, ok: false, json: async () => ({ error: { code: 'CSRF_INVALID', message: 'Atualize a página.' } }) };
    if (calls.length === 2) return { status: 200, ok: true, json: async () => ({ user: null, csrfToken: 'token-renovado' }) };
    return { status: 200, ok: true, json: async () => ({ saved: true }) };
  };
  assert.deepEqual(await api('/progress/example', { method: 'POST', body: { value: 1 } }), { saved: true });
  assert.equal(calls.length, 3);
  assert.equal(calls[1].url, '/api/auth/me');
  assert.equal(calls[2].options.headers['X-CSRF-Token'], 'token-renovado');
});
