import { Router } from 'express';
import bcrypt from 'bcrypt';
import database from '../../../config/database';
import { createSession, deleteSession, sanitizeUser } from '../middleware/session';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
const ROLES = new Set(['farmer','consumer','driver','admin']);

function validationError(message: string, fields?: Record<string,string>) {
  return { error: 'VALIDATION_ERROR', message, ...(fields ? { fields } : {}) };
}
function credentialsError() { return { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }; }

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, contactNumber, address, status } = req.body || {};
    const fieldErrors: Record<string,string> = {};
    if (!email || !EMAIL_REGEX.test(email)) fieldErrors.email = 'Invalid email';
    if (!password || !PASSWORD_REGEX.test(password)) fieldErrors.password = 'Password must be >=6 chars incl. upper, lower, digit';
    if (!firstName) fieldErrors.firstName = 'First name required';
    if (!lastName) fieldErrors.lastName = 'Last name required';
    if (!role || !ROLES.has(role)) fieldErrors.role = 'Invalid role';
    let normalizedStatus: string = 'active';
    if (status !== undefined) {
      if (status !== 'active' && status !== 'inactive') {
        fieldErrors.status = 'Status must be active or inactive';
      } else {
        normalizedStatus = status;
      }
    }
    if (Object.keys(fieldErrors).length) return res.status(400).json(validationError('Invalid input', fieldErrors));

    const existing = await database.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(400).json(validationError('Email already in use', { email: 'Taken' }));

    const hash = await bcrypt.hash(password, 12);
    const inserted = await database.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, contact_number, address, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [email.toLowerCase(), hash, role, firstName, lastName, contactNumber || null, address || null, normalizedStatus]
    );

    const user = sanitizeUser(inserted.rows[0]);
    const session = await createSession(user.id, req.ip, req.headers['user-agent']);
    setSessionCookie(res, session.id, session.expires_at || session.expiresAt);
    return res.status(201).json({ user });
  } catch (err) {
    console.error('[auth/signup] error', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json(validationError('Email and password required'));

    const result = await database.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!result.rows.length) return res.status(401).json(credentialsError());

    const userRow = result.rows[0];
    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) return res.status(401).json(credentialsError());

    const session = await createSession(userRow.id, req.ip, req.headers['user-agent']);
    setSessionCookie(res, session.id, session.expires_at || session.expiresAt);
    return res.json({ user: sanitizeUser(userRow) });
  } catch (err) {
    console.error('[auth/login] error', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  try {
    const sid = (req as any).cookies?.sid;
    if (sid) await deleteSession(sid);
    clearSessionCookie(res);
    return res.json({ success: true });
  } catch (err) {
    console.error('[auth/logout] error', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
});

// CURRENT SESSION
router.get('/session', (req, res) => {
  if (!req.currentUser) return res.json({ user: null });
  return res.json({ user: req.currentUser });
});

function setSessionCookie(res: any, sid: string, expiresAt: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('sid', sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    expires: new Date(expiresAt),
    path: '/'
  });
}

function clearSessionCookie(res: any) {
  res.cookie('sid', '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', expires: new Date(0), path: '/' });
}

export default router;
