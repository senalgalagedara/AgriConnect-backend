import { Router, Request, Response } from 'express';
import { sessionMiddleware, createSession, deleteSession } from '../middleware/session';
import { AuthService } from '../services/AuthService';

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

    // Pre-check (still keep DB unique safety net)
    const exists = await AuthService.emailExists(normalizedEmail);
    if (exists) {
      return res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'Email already registered' });
    }
    const user = await AuthService.createUser({
      email: normalizedEmail,
      password,
      role: normalizedRole,
      firstName: normalizeName(firstName),
      lastName: normalizeName(lastName),
      contactNumber: contactNumber || undefined,
      address: address || undefined
    });
    const session = await createSession(user.id, req.ip, req.headers['user-agent']);

    res.cookie('sid', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false, // set true when behind HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ success: true, user });
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ success: false, code: 'EMAIL_EXISTS', message: 'Email already registered' });
    }
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
    const user = await AuthService.authenticate(normalizedEmail, password);
    if (!user) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    const session = await createSession(user.id, req.ip, req.headers['user-agent']);
    res.cookie('sid', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false,
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
