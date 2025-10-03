import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import database from '../../../config/database';
import { sessionMiddleware, createSession, deleteSession, sanitizeUser } from '../middleware/session';

const router = Router();

// Utility validation helpers
function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

function normalizeName(name: string | undefined) {
  if (!name) return '';
  return name.trim();
}

// POST /signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, role, firstName, lastName, contactNumber, address } = req.body || {};

    const normalizedEmail = (email || '').toLowerCase().trim();
    const normalizedRole = (role || '').toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, code: 'INVALID_EMAIL', message: 'Invalid email format' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, code: 'INVALID_PASSWORD', message: 'Password must be at least 6 characters' });
    }
    if (!normalizedRole) {
      return res.status(400).json({ success: false, code: 'INVALID_ROLE', message: 'Role is required' });
    }

    // Check for existing user
    const existing = await database.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length) {
      return res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const now = new Date();
    const insert = await database.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, contact_number, address, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'active', $8, $8)
       RETURNING *`,
      [normalizedEmail, hash, normalizedRole, normalizeName(firstName), normalizeName(lastName), contactNumber || null, address || null, now]
    );

    const user = sanitizeUser(insert.rows[0]);
    const session = await createSession(user.id, req.ip, req.headers['user-agent']);

    res.cookie('sid', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ success: true, user });
  } catch (err: any) {
    console.error('[signup] error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!isValidEmail(normalizedEmail) || !password) {
      return res.status(400).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    const result = await database.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (!result.rows.length) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    const row = result.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    const user = sanitizeUser(row);
    const session = await createSession(user.id, req.ip, req.headers['user-agent']);
    res.cookie('sid', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('[login] error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /logout
router.post('/logout', sessionMiddleware, async (req: Request, res: Response) => {
  try {
    const sid = (req as any).cookies?.sid;
    if (sid) {
      await deleteSession(sid);
      res.clearCookie('sid');
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[logout] error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /session
router.get('/session', sessionMiddleware, async (req: Request, res: Response) => {
  if (!req.currentUser) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  return res.json({ success: true, user: req.currentUser });
});

export default router;
