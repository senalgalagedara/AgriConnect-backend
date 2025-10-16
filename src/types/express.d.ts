import { User } from './entities';

declare global {
  namespace Express {
    interface Request {
      // currentUser and sessionId removed; middleware may attach minimal info via any-cast.
    }
  }
}

export {};
