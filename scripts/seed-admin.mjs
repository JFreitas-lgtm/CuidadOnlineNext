import { createPool } from '../server/db.mjs';
import { hashPassword } from '../server/security.mjs';

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('ADMIN_EMAIL inválido ou ausente.');
if (password.length < 12 || password.includes('troque-')) throw new Error('ADMIN_PASSWORD precisa ser uma senha real com pelo menos 12 caracteres.');

const pool = createPool();
const passwordHash = await hashPassword(password);
const result = await pool.query(
  `INSERT INTO users (name, email, password_hash, role)
   VALUES ('Administrador', $1, $2, 'admin')
   ON CONFLICT ((lower(email))) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash, status = 'active', updated_at = now()
   RETURNING id, email`,
  [email, passwordHash],
);
console.log(`Administrador preparado: ${result.rows[0].email}`);
await pool.end();
