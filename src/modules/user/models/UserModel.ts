import database from '../../../config/database';
import { QueryResult } from '../../../types';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  first_name?: string;
  last_name?: string;
  contact_number?: string;
  address?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  /**
   * Create a new user
   */
  static async create(userData: {
    email: string;
    password_hash: string;
    role: string;
    first_name?: string;
    last_name?: string;
    contact_number?: string;
    address?: string;
    status?: string;
  }): Promise<User> {
    const query = `
      INSERT INTO users (
        email, password_hash, role, first_name, last_name, 
        contact_number, address, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, role, first_name, last_name, 
                contact_number, address, status, created_at, updated_at
    `;

    const result = await database.query(query, [
      userData.email,
      userData.password_hash,
      userData.role,
      userData.first_name || null,
      userData.last_name || null,
      userData.contact_number || null,
      userData.address || null,
      userData.status || 'active'
    ]);

    return result.rows[0] as User;
  }

  /**
   * Get all users with optional filtering
   */
  static async findAll(filters?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<User[]> {
    let query = `
      SELECT id, email, role, first_name, last_name, 
             contact_number, address, status, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.role) {
      query += ` AND role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (
        LOWER(email) LIKE LOWER($${paramIndex}) OR 
        LOWER(first_name) LIKE LOWER($${paramIndex}) OR 
        LOWER(last_name) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await database.query(query, params);
    return result.rows;
  }

  /**
   * Get user by ID
   */
  static async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, email, role, first_name, last_name, 
             contact_number, address, status, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await database.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, role, first_name, last_name, 
             contact_number, address, status, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    
    const result = await database.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update user
   */
  static async update(id: number, data: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(data.email);
      paramIndex++;
    }

    if (data.role !== undefined) {
      fields.push(`role = $${paramIndex}`);
      values.push(data.role);
      paramIndex++;
    }

    if (data.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex}`);
      values.push(data.first_name);
      paramIndex++;
    }

    if (data.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex}`);
      values.push(data.last_name);
      paramIndex++;
    }

    if (data.contact_number !== undefined) {
      fields.push(`contact_number = $${paramIndex}`);
      values.push(data.contact_number);
      paramIndex++;
    }

    if (data.address !== undefined) {
      fields.push(`address = $${paramIndex}`);
      values.push(data.address);
      paramIndex++;
    }

    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING id, email, role, first_name, last_name, 
                contact_number, address, status, created_at, updated_at
    `;

    const result = await database.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete user (hard delete)
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await database.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Soft delete user (set status to inactive)
   */
  static async softDelete(id: number): Promise<boolean> {
    const query = `
      UPDATE users 
      SET status = 'inactive', updated_at = NOW()
      WHERE id = $1
    `;
    const result = await database.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get user count by role
   */
  static async getCountByRole(): Promise<{ role: string; count: number }[]> {
    const query = `
      SELECT role, COUNT(*)::int as count
      FROM users
      GROUP BY role
      ORDER BY role
    `;
    
    const result = await database.query(query);
    return result.rows;
  }
}
