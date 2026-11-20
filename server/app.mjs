import { resolve } from 'node:path';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { lessons, questions } from '../src/content.js';
import { simulations } from '../src/simulations.js';
import { csrfToken, hashPassword, verifyPassword } from './security.mjs';

const lessonIds = new Set(lessons.map(item => item.id));
const simulationIds = new Set(simulations.map(item => item.id));
const allowedOutcomes = new Set(['safe', 'risk', 'completed']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asyncRoute = handler => (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
const publicUser = row => row ? ({ id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, theme: row.theme }) : null;
const fail = (response, status, code, message, fields) => response.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } });
const regenerate = request => new Promise((resolvePromise, reject) => request.session.regenerate(error => error ? reject(error) : resolvePromise()));
const destroy = request => new Promise((resolvePromise, reject) => request.session.destroy(error => error ? reject(error) : resolvePromise()));

function validateCredentials(body, register) {
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const fields = {};
  if (register && (name.length < 2 || name.length > 120)) fields.name = 'Digite um nome entre 2 e 120 caracteres.';
  if (!emailPattern.test(email) || email.length > 254) fields.email = 'Digite um e-mail válido.';
  if (password.length < 8 || password.length > 200) fields.password = 'A senha precisa ter entre 8 e 200 caracteres.';
  return { name, email, password, fields };
}

async function readProgress(pool, userId) {
  const [lessonRows, quizRows, simulationRows] = await Promise.all([
    pool.query('SELECT lesson_id, last_visited_at, completed_at, favorite FROM user_lessons WHERE user_id = $1 ORDER BY last_visited_at', [userId]),
    pool.query('SELECT score, total, answers, created_at FROM quiz_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]),
    pool.query('SELECT simulation_id, outcome, created_at FROM simulation_attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]),
  ]);
  const completed = lessonRows.rows.filter(row => row.completed_at).map(row => row.lesson_id);
  const favorites = lessonRows.rows.filter(row => row.favorite).map(row => row.lesson_id);
  const lastLesson = [...lessonRows.rows].reverse().find(row => !row.completed_at)?.lesson_id || null;
  const history = [
    ...lessonRows.rows.filter(row => row.completed_at).map(row => ({ type: 'lesson', lesson: row.lesson_id, at: row.completed_at.toISOString() })),
    ...quizRows.rows.map(row => ({ type: 'quiz', score: row.score, total: row.total, at: row.created_at.toISOString() })),
    ...simulationRows.rows.map(row => ({ type: 'simulation', simulation: row.simulation_id, outcome: row.outcome, at: row.created_at.toISOString() })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(-100);
  return { version: 2, completed, favorites, lastLesson, history };
}

export function createApp({ pool, sessionSecret, staticRoot = '.', secureCookies = process.env.NODE_ENV === 'production' }) {
  if (!pool) throw new Error('Pool PostgreSQL obrigatório.');
  if (!sessionSecret || sessionSecret.length < 32 || sessionSecret.includes('troque-')) throw new Error('SESSION_SECRET precisa ser um segredo aleatório com pelo menos 32 caracteres.');
  const app = express();
  const PgStore = connectPgSimple(session);

  app.disable('x-powered-by');
  if (secureCookies) app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }));
  app.use(express.json({ limit: '64kb' }));
  app.use(session({
    name: 'cuidadonline.sid',
    store: new PgStore({ pool, tableName: 'sessions', createTableIfMissing: false }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, sameSite: 'lax', secure: secureCookies, maxAge: 7 * 24 * 60 * 60 * 1000 },
  }));

  app.use(asyncRoute(async (request, response, next) => {
    request.user = null;
    if (request.session.userId) {
      const result = await pool.query('SELECT id, name, email, role, status, theme FROM users WHERE id = $1', [request.session.userId]);
      const user = result.rows[0];
      if (!user || user.status !== 'active') {
        await destroy(request);
        if (request.path.startsWith('/api/')) return fail(response, 401, 'SESSION_EXPIRED', 'Sua sessão não está mais disponível.');
      } else request.user = user;
    }
    next();
  }));

  app.use((request, response, next) => {
    if (!request.session.csrf) request.session.csrf = csrfToken();
    if (request.path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.get('x-csrf-token') !== request.session.csrf) {
      return fail(response, 403, 'CSRF_INVALID', 'Atualize a página e tente novamente.');
    }
    next();
  });

  const requireUser = (request, response, next) => request.user ? next() : fail(response, 401, 'AUTH_REQUIRED', 'Entre na sua conta para continuar.');
  const requireAdmin = (request, response, next) => request.user?.role === 'admin' ? next() : fail(response, 403, 'ADMIN_REQUIRED', 'Acesso exclusivo para administradores.');
  const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMIT', message: 'Muitas tentativas. Aguarde alguns minutos.' } } });

  app.get('/api/health', asyncRoute(async (_request, response) => {
    await pool.query('SELECT 1');
    response.json({ ok: true });
  }));
  app.get('/api/auth/me', (request, response) => response.json({ user: publicUser(request.user), csrfToken: request.session.csrf }));

  app.post('/api/auth/register', authLimit, asyncRoute(async (request, response) => {
    const values = validateCredentials(request.body, true);
    if (Object.keys(values.fields).length) return fail(response, 400, 'VALIDATION_ERROR', 'Confira os campos informados.', values.fields);
    const passwordHash = await hashPassword(values.password);
    let result;
    try {
      result = await pool.query(
        `INSERT INTO users (name, email, password_hash, last_login_at) VALUES ($1, $2, $3, now())
         RETURNING id, name, email, role, status, theme`,
        [values.name, values.email, passwordHash],
      );
    } catch (error) {
      if (error.code === '23505') return fail(response, 409, 'EMAIL_IN_USE', 'Já existe uma conta com este e-mail.', { email: 'Use outro e-mail ou entre na conta existente.' });
      throw error;
    }
    await regenerate(request);
    request.session.userId = result.rows[0].id;
    request.session.csrf = csrfToken();
    response.status(201).json({ user: publicUser(result.rows[0]), csrfToken: request.session.csrf });
  }));

  app.post('/api/auth/login', authLimit, asyncRoute(async (request, response) => {
    const values = validateCredentials(request.body, false);
    if (values.fields.email || values.fields.password) return fail(response, 400, 'VALIDATION_ERROR', 'Confira e-mail e senha.', values.fields);
    const result = await pool.query('SELECT id, name, email, password_hash, role, status, theme FROM users WHERE lower(email) = $1', [values.email]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(values.password, user.password_hash))) return fail(response, 401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    if (user.status !== 'active') return fail(response, 403, 'ACCOUNT_DISABLED', 'Esta conta está desativada.');
    await pool.query('UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1', [user.id]);
    await regenerate(request);
    request.session.userId = user.id;
    request.session.csrf = csrfToken();
    response.json({ user: publicUser(user), csrfToken: request.session.csrf });
  }));

  app.post('/api/auth/logout', asyncRoute(async (request, response) => {
    await destroy(request);
    response.clearCookie('cuidadonline.sid');
    response.status(204).end();
  }));

  app.patch('/api/account/profile', requireUser, asyncRoute(async (request, response) => {
    const name = String(request.body?.name || '').trim();
    if (name.length < 2 || name.length > 120) return fail(response, 400, 'VALIDATION_ERROR', 'Confira o nome.', { name: 'Use entre 2 e 120 caracteres.' });
    const result = await pool.query('UPDATE users SET name = $1, updated_at = now() WHERE id = $2 RETURNING id, name, email, role, status, theme', [name, request.user.id]);
    response.json({ user: publicUser(result.rows[0]) });
  }));

  app.patch('/api/account/password', requireUser, asyncRoute(async (request, response) => {
    const currentPassword = String(request.body?.currentPassword || '');
    const newPassword = String(request.body?.newPassword || '');
    if (newPassword.length < 8 || newPassword.length > 200) return fail(response, 400, 'VALIDATION_ERROR', 'A nova senha precisa ter entre 8 e 200 caracteres.');
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [request.user.id]);
    if (!(await verifyPassword(currentPassword, result.rows[0].password_hash))) return fail(response, 401, 'INVALID_PASSWORD', 'A senha atual está incorreta.');
    await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [await hashPassword(newPassword), request.user.id]);
    await pool.query("DELETE FROM sessions WHERE sess->>'userId' = $1 AND sid <> $2", [request.user.id, request.sessionID]);
    response.status(204).end();
  }));

  app.patch('/api/account/theme', requireUser, asyncRoute(async (request, response) => {
    const theme = request.body?.theme;
    if (!['light', 'dark'].includes(theme)) return fail(response, 400, 'VALIDATION_ERROR', 'Tema inválido.');
    await pool.query('UPDATE users SET theme = $1, updated_at = now() WHERE id = $2', [theme, request.user.id]);
    response.json({ theme });
  }));

  app.get('/api/progress', requireUser, asyncRoute(async (request, response) => response.json(await readProgress(pool, request.user.id))));
  app.put('/api/progress/lessons/:id/visit', requireUser, asyncRoute(async (request, response) => {
    if (!lessonIds.has(request.params.id)) return fail(response, 404, 'LESSON_NOT_FOUND', 'Leitura não encontrada.');
    await pool.query(
      `INSERT INTO user_lessons (user_id, lesson_id) VALUES ($1, $2)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET last_visited_at = now()`,
      [request.user.id, request.params.id],
    );
    response.status(204).end();
  }));
  app.put('/api/progress/lessons/:id/complete', requireUser, asyncRoute(async (request, response) => {
    if (!lessonIds.has(request.params.id)) return fail(response, 404, 'LESSON_NOT_FOUND', 'Leitura não encontrada.');
    await pool.query(
      `INSERT INTO user_lessons (user_id, lesson_id, completed_at) VALUES ($1, $2, now())
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed_at = COALESCE(user_lessons.completed_at, now()), last_visited_at = now()`,
      [request.user.id, request.params.id],
    );
    response.status(204).end();
  }));
  app.put('/api/progress/lessons/:id/favorite', requireUser, asyncRoute(async (request, response) => {
    if (!lessonIds.has(request.params.id)) return fail(response, 404, 'LESSON_NOT_FOUND', 'Leitura não encontrada.');
    await pool.query(
      `INSERT INTO user_lessons (user_id, lesson_id, favorite, favorited_at) VALUES ($1, $2, true, now())
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET favorite = true, favorited_at = now()`,
      [request.user.id, request.params.id],
    );
    response.status(204).end();
  }));
  app.delete('/api/progress/lessons/:id/favorite', requireUser, asyncRoute(async (request, response) => {
    if (!lessonIds.has(request.params.id)) return fail(response, 404, 'LESSON_NOT_FOUND', 'Leitura não encontrada.');
    await pool.query('UPDATE user_lessons SET favorite = false, favorited_at = NULL WHERE user_id = $1 AND lesson_id = $2', [request.user.id, request.params.id]);
    response.status(204).end();
  }));
  app.post('/api/progress/quizzes', requireUser, asyncRoute(async (request, response) => {
    const score = Number(request.body?.score);
    const total = Number(request.body?.total);
    const answers = request.body?.answers;
    if (!Number.isInteger(score) || !Number.isInteger(total) || total !== questions.length || score < 0 || score > total || !Array.isArray(answers) || answers.length !== total || answers.some(answer => ![true, false, 'unsure'].includes(answer))) {
      return fail(response, 400, 'VALIDATION_ERROR', 'Resultado do quiz inválido.');
    }
    await pool.query('INSERT INTO quiz_attempts (user_id, score, total, answers) VALUES ($1, $2, $3, $4)', [request.user.id, score, total, JSON.stringify(answers)]);
    response.status(201).json({ saved: true });
  }));
  app.post('/api/progress/simulations', requireUser, asyncRoute(async (request, response) => {
    const id = request.body?.simulation;
    const outcome = request.body?.outcome;
    if (!simulationIds.has(id) || !allowedOutcomes.has(outcome)) return fail(response, 400, 'VALIDATION_ERROR', 'Resultado da simulação inválido.');
    await pool.query('INSERT INTO simulation_attempts (user_id, simulation_id, outcome) VALUES ($1, $2, $3)', [request.user.id, id, outcome]);
    response.status(201).json({ saved: true });
  }));
  app.delete('/api/progress', requireUser, asyncRoute(async (request, response) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM user_lessons WHERE user_id = $1', [request.user.id]);
      await client.query('DELETE FROM quiz_attempts WHERE user_id = $1', [request.user.id]);
      await client.query('DELETE FROM simulation_attempts WHERE user_id = $1', [request.user.id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
    response.status(204).end();
  }));

  app.get('/api/admin/summary', requireAdmin, asyncRoute(async (_request, response) => {
    const result = await pool.query(`SELECT
      (SELECT count(*)::int FROM users WHERE role = 'user') AS total_users,
      (SELECT count(*)::int FROM users WHERE role = 'user' AND status = 'active') AS active_users,
      (SELECT count(*)::int FROM users WHERE role = 'user' AND status = 'disabled') AS disabled_users,
      (SELECT count(*)::int FROM users WHERE role = 'user' AND created_at >= now() - interval '7 days') AS new_7_days,
      (SELECT count(*)::int FROM users WHERE role = 'user' AND created_at >= now() - interval '30 days') AS new_30_days,
      (SELECT count(DISTINCT user_id)::int FROM (SELECT user_id FROM user_lessons UNION ALL SELECT user_id FROM quiz_attempts UNION ALL SELECT user_id FROM simulation_attempts) activity) AS users_with_activity,
      (SELECT count(*)::int FROM user_lessons WHERE completed_at IS NOT NULL) AS lessons_completed,
      (SELECT count(*)::int FROM quiz_attempts) AS quizzes_completed,
      (SELECT COALESCE(round(avg(score::numeric / total * 100), 1), 0) FROM quiz_attempts) AS average_quiz_percent,
      (SELECT count(*)::int FROM simulation_attempts) AS simulations_completed`);
    const popular = await pool.query('SELECT lesson_id, count(*)::int AS visits FROM user_lessons GROUP BY lesson_id ORDER BY visits DESC, lesson_id LIMIT 6');
    response.json({ ...result.rows[0], popularLessons: popular.rows });
  }));

  app.get('/api/admin/users', requireAdmin, asyncRoute(async (request, response) => {
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const limit = 20;
    const search = String(request.query.q || '').trim().slice(0, 120);
    const status = ['active', 'disabled'].includes(request.query.status) ? request.query.status : null;
    const result = await pool.query(
      `SELECT id, name, email, role, status, created_at, last_login_at, count(*) OVER()::int AS total
       FROM users WHERE role = 'user' AND ($1 = '' OR name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR status = $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [search, status, limit, (page - 1) * limit],
    );
    response.json({ users: result.rows.map(({ total, ...user }) => user), page, pages: Math.ceil((result.rows[0]?.total || 0) / limit), total: result.rows[0]?.total || 0 });
  }));

  app.get('/api/admin/users/:id', requireAdmin, asyncRoute(async (request, response) => {
    const result = await pool.query("SELECT id, name, email, role, status, theme, created_at, updated_at, last_login_at FROM users WHERE id = $1 AND role = 'user'", [request.params.id]);
    if (!result.rowCount) return fail(response, 404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
    response.json({ user: result.rows[0], progress: await readProgress(pool, request.params.id) });
  }));

  app.patch('/api/admin/users/:id/status', requireAdmin, asyncRoute(async (request, response) => {
    const status = request.body?.status;
    if (!['active', 'disabled'].includes(status)) return fail(response, 400, 'VALIDATION_ERROR', 'Status inválido.');
    if (request.params.id === request.user.id) return fail(response, 400, 'SELF_DISABLE', 'Você não pode alterar o status da própria conta.');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query("UPDATE users SET status = $1, updated_at = now() WHERE id = $2 AND role = 'user' RETURNING id, name, email, role, status", [status, request.params.id]);
      if (!result.rowCount) { await client.query('ROLLBACK'); return fail(response, 404, 'USER_NOT_FOUND', 'Usuário não encontrado.'); }
      if (status === 'disabled') await client.query("DELETE FROM sessions WHERE sess->>'userId' = $1", [request.params.id]);
      await client.query('INSERT INTO admin_audit_log (admin_id, target_user_id, action, details) VALUES ($1, $2, $3, $4)', [request.user.id, request.params.id, `user.${status}`, JSON.stringify({ status })]);
      await client.query('COMMIT');
      response.json({ user: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }));

  app.get('/api/admin/audit', requireAdmin, asyncRoute(async (request, response) => {
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const result = await pool.query(
      `SELECT log.id, log.action, log.details, log.created_at, admin.email AS admin_email, target.email AS target_email
       FROM admin_audit_log log JOIN users admin ON admin.id = log.admin_id LEFT JOIN users target ON target.id = log.target_user_id
       ORDER BY log.created_at DESC LIMIT 50 OFFSET $1`,
      [(page - 1) * 50],
    );
    response.json({ entries: result.rows, page });
  }));

  app.use('/api', (_request, response) => fail(response, 404, 'NOT_FOUND', 'Recurso não encontrado.'));
  const publicRoot = resolve(staticRoot);
  const staticOptions = { dotfiles: 'deny', maxAge: secureCookies ? '1h' : 0 };
  app.get(['/', '/index.html'], (_request, response) => response.sendFile(resolve(publicRoot, 'index.html')));
  app.use('/src', express.static(resolve(publicRoot, 'src'), staticOptions));
  app.use('/assets', express.static(resolve(publicRoot, 'assets'), staticOptions));
  app.use((error, request, response, _next) => {
    console.error(`${request.method} ${request.path}:`, error.message);
    if (response.headersSent) return;
    fail(response, 500, 'INTERNAL_ERROR', 'Não foi possível concluir a ação.');
  });
  return app;
}
