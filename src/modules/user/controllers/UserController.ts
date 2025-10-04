import { Request, Response } from 'express';
import pool from '../../config/database';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
