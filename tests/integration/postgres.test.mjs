import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { createApp } from '../../server/app.mjs';
import { hashPassword } from '../../server/security.mjs';

const connectionString = process.env.DATABASE_URL_TEST;

test('autenticação, isolamento, progresso e administração no PostgreSQL', { skip: !connectionString && 'Defina DATABASE_URL_TEST para executar.' }, async t => {
  const pool = new pg.Pool({ connectionString });
  await pool.query(await readFile(new URL('../../migrations/001_initial.sql', import.meta.url), 'utf8'));
  await pool.query('TRUNCATE admin_audit_log, simulation_attempts, quiz_attempts, user_lessons, sessions, users CASCADE');
  const app = createApp({ pool, sessionSecret: 'segredo-de-integracao-com-mais-de-32-caracteres', staticRoot: '.', secureCookies: false });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await pool.end(); });

  async function session() {
    const response = await fetch(`${base}/api/auth/me`);
    const body = await response.json();
    return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: body.csrfToken };
  }
  async function call(path, state, options = {}) {
    const response = await fetch(`${base}/api${path}`, {
      ...options,
      headers: { Cookie: state.cookie, 'X-CSRF-Token': state.csrf, 'Content-Type': 'application/json', ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) state.cookie = setCookie.split(';')[0];
    const body = response.status === 204 ? null : await response.json();
    if (body?.csrfToken) state.csrf = body.csrfToken;
    return { response, body };
  }

  const userSession = await session();
  const registered = await call('/auth/register', userSession, { method: 'POST', body: { name: 'Pessoa Teste', email: 'PESSOA@example.com', password: 'senha-segura-123' } });
  assert.equal(registered.response.status, 201);
  assert.equal(registered.body.user.email, 'pessoa@example.com');
  const userId = registered.body.user.id;

  const duplicateSession = await session();
  assert.equal((await call('/auth/register', duplicateSession, { method: 'POST', body: { name: 'Duplicada', email: 'pessoa@example.com', password: 'outra-senha-123' } })).response.status, 409);
  assert.equal((await call('/auth/login', duplicateSession, { method: 'POST', body: { email: 'pessoa@example.com', password: 'senha-incorreta' } })).response.status, 401);

  const missingCsrf = await fetch(`${base}/api/progress/lessons/pix/complete`, { method: 'PUT', headers: { Cookie: userSession.cookie } });
  assert.equal(missingCsrf.status, 403);
  assert.equal((await call('/progress/lessons/pix/complete', userSession, { method: 'PUT' })).response.status, 204);
  const progress = await call('/progress', userSession);
  assert.deepEqual(progress.body.completed, ['pix']);
  assert.equal((await call('/admin/summary', userSession)).response.status, 403);

  const secondSession = await session();
  assert.equal((await call('/auth/register', secondSession, { method: 'POST', body: { name: 'Segunda Pessoa', email: 'segunda@example.com', password: 'senha-segura-456' } })).response.status, 201);
  assert.deepEqual((await call('/progress', secondSession)).body.completed, []);

  await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@example.com', $1, 'admin')", [await hashPassword('senha-admin-123')]);
  const adminSession = await session();
  const login = await call('/auth/login', adminSession, { method: 'POST', body: { email: 'admin@example.com', password: 'senha-admin-123' } });
  assert.equal(login.body.user.role, 'admin');
  const summary = await call('/admin/summary', adminSession);
  assert.equal(summary.response.status, 200);
  assert.equal(summary.body.total_users, 2);
  assert.equal((await call(`/admin/users/${userId}/status`, adminSession, { method: 'PATCH', body: { status: 'disabled' } })).response.status, 200);
  assert.equal((await call('/progress', userSession)).response.status, 401);
});
