import { Request, Response, NextFunction } from 'express';
// Corrected relative path to database config (was too deep)
import database from '../../../config/database';

export const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MINUTES = SESSION_TTL_DAYS * 24 * 60;

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: any;
    sessionId?: string;
  }
}

export async function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const sid = (req as any).cookies?.sid;
    if (!sid) return next();
    await database.query('DELETE FROM sessions WHERE expires_at < NOW()');
    const result = await database.query(
      `SELECT s.id as session_id, u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.expires_at > NOW()`,
      [sid]
    );
    if (!result.rows.length) return next();
    req.currentUser = sanitizeUser(result.rows[0]);
    req.sessionId = sid;
    return next();
  } catch (err) {
    console.error('[sessionMiddleware] error', err);
    return next();
  }
}

export async function createSession(userId: number | string, ip: string | undefined, agent: string | undefined) {
  const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  if (Number.isNaN(numericUserId)) throw new Error('Invalid userId for session creation');
  const expires = new Date(Date.now() + SESSION_TTL_MINUTES * 60000);
  const result = await database.query(
    `INSERT INTO sessions (user_id, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4)
     RETURNING id, expires_at`,
    [numericUserId, expires, ip || null, agent || null]
  );
  return result.rows[0];
}

export async function deleteSession(id: string | number) {
  await database.query('DELETE FROM sessions WHERE id = $1', [id]);
}

export function sanitizeUser(row: any) {
  return {
    id: typeof row.id === 'string' ? parseInt(row.id, 10) || row.id : row.id,
    email: row.email,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    contactNumber: row.contact_number,
    address: row.address,
    status: row.status || 'active',
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at)
  };
}
