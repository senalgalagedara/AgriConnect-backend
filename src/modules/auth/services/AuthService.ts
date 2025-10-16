import bcrypt from 'bcryptjs';
import database from '../../../config/database';

export interface CreateUserInput {
  email: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  address?: string;
}

export class AuthService {
  static async createUser(input: CreateUserInput) {
    const email = input.email.toLowerCase().trim();
    const role = input.role.toLowerCase().trim();
    const hash = await bcrypt.hash(input.password, 10);
    const now = new Date();
    const result = await database.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, contact_number, address, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $8)
       RETURNING *`,
      [
        email,
        hash,
        role,
        (input.firstName || '').trim(),
        (input.lastName || '').trim(),
        input.contactNumber || null,
        input.address || null,
        now,
      ]
    );
    return sanitizeUser(result.rows[0]);
  }

  static async emailExists(email: string) {
    const { rows } = await database.query('SELECT 1 FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    return !!rows.length;
  }

  static async authenticate(email: string, password: string) {
    const { rows } = await database.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!rows.length) return null;
    const row = rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return null;
    return sanitizeUser(row);
  }

  static async getUserById(id: number) {
    const { rows } = await database.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows.length ? sanitizeUser(rows[0]) : null;
  }
}

// Local sanitizeUser helper (session middleware removed)
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
