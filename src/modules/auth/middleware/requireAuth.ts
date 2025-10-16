import { Request, Response, NextFunction } from 'express'

/**
 * Minimal stateless auth replacement for session-based middleware.
 *
 * This implementation accepts an Authorization: Bearer <userId> header where
 * the token is simply a numeric user id. It's a stop-gap so protected routes
 * continue to work after removing session middleware. Replace with proper
 * bearer tokens / JWT validation in a production-ready change.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(\d+)$/i);
  if (!m) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  const token = m[1];
  // Attach minimal currentUser for handlers that still read req.currentUser
  (req as any).currentUser = { id: parseInt(token, 10) };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const cu = (req as any).currentUser;
    if (!cu || !cu.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    // For now role checks are permissive because we don't have role in token.
    // Implement proper role embedding in tokens or lookup by user id as a follow-up.
    return res.status(403).json({ success: false, message: 'Role-based checks require token implementation' });
  };
}
