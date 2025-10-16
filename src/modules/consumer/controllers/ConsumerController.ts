import { Request, Response } from 'express';
import database from '../../../config/database';

export const getConsumerByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (!userId || userId <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
      return;
    }

    // Get user data (consumers are just users with role='consumer')
    const result = await database.query(
      `SELECT id, email, role, first_name, last_name, contact_number, address, status, created_at, updated_at
       FROM users
       WHERE id = $1 AND role = 'consumer'`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Consumer not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error in ConsumerController.getConsumerByUserId:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve consumer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
