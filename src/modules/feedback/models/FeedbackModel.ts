import database from '../../../config/database';
import { Feedback, CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackFilter, PaginationOptions } from '../../../types';

export class FeedbackModel {
  
  /**
   * Transform database record to match frontend expectations
   */
  private static transformFeedback(dbRecord: any): Feedback {
    return {
      ...dbRecord,
      comment: dbRecord.message, // Map 'message' to 'comment' for frontend
      meta: dbRecord.meta ? (typeof dbRecord.meta === 'string' ? JSON.parse(dbRecord.meta) : dbRecord.meta) : undefined
    };
  }
  
  /**
   * Get all feedback with optional filtering and pagination
   */
  static async findAll(
    filters?: FeedbackFilter,
    pagination?: PaginationOptions
  ): Promise<{ feedback: Feedback[], total: number }> {
    let query = `
      SELECT 
        f.*,
        CASE 
          WHEN f.user_type != 'anonymous' AND f.user_id IS NOT NULL THEN 
            (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
          ELSE NULL
        END as user_name
      FROM feedback f
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.user_type) {
      query += ` AND f.user_type = $${paramIndex}`;
      params.push(filters.user_type);
      paramIndex++;
    }

    if (filters?.category) {
      query += ` AND f.category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND f.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.priority) {
      query += ` AND f.priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters?.created_from) {
      query += ` AND f.created_at >= $${paramIndex}`;
      params.push(filters.created_from);
      paramIndex++;
    }

    if (filters?.created_to) {
      query += ` AND f.created_at <= $${paramIndex}`;
      params.push(filters.created_to);
      paramIndex++;
    }

    if (filters?.rating_min) {
      query += ` AND f.rating >= $${paramIndex}`;
      params.push(filters.rating_min);
      paramIndex++;
    }

    if (filters?.rating_max) {
      query += ` AND f.rating <= $${paramIndex}`;
      params.push(filters.rating_max);
      paramIndex++;
    }

    // Count total records - build count query with same filters
    let countQuery = `SELECT COUNT(*) as total FROM feedback f WHERE 1=1`;
    
    // Re-apply the same filters for counting
    let countParamIndex = 1;
    const countParams: any[] = [];
    
    if (filters?.user_type) {
      countQuery += ` AND f.user_type = $${countParamIndex}`;
      countParams.push(filters.user_type);
      countParamIndex++;
    }

    if (filters?.category) {
      countQuery += ` AND f.category = $${countParamIndex}`;
      countParams.push(filters.category);
      countParamIndex++;
    }

    if (filters?.status) {
      countQuery += ` AND f.status = $${countParamIndex}`;
      countParams.push(filters.status);
      countParamIndex++;
    }

    if (filters?.priority) {
      countQuery += ` AND f.priority = $${countParamIndex}`;
      countParams.push(filters.priority);
      countParamIndex++;
    }

    if (filters?.created_from) {
      countQuery += ` AND f.created_at >= $${countParamIndex}`;
      countParams.push(filters.created_from);
      countParamIndex++;
    }

    if (filters?.created_to) {
      countQuery += ` AND f.created_at <= $${countParamIndex}`;
      countParams.push(filters.created_to);
      countParamIndex++;
    }

    if (filters?.rating_min) {
      countQuery += ` AND f.rating >= $${countParamIndex}`;
      countParams.push(filters.rating_min);
      countParamIndex++;
    }

    if (filters?.rating_max) {
      countQuery += ` AND f.rating <= $${countParamIndex}`;
      countParams.push(filters.rating_max);
      countParamIndex++;
    }
    
    const countResult = await database.query(countQuery, countParams);
    console.log('Count result:', countResult);
    console.log('Count result rows:', countResult.rows);
    console.log('First row:', countResult.rows[0]);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Apply sorting
    const sortBy = pagination?.sortBy || 'created_at';
    const sortOrder = pagination?.sortOrder || 'DESC';
    query += ` ORDER BY f.${sortBy} ${sortOrder}`;

    // Apply pagination
    if (pagination?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(pagination.limit);
      paramIndex++;
      
      if (pagination.page && pagination.page > 1) {
        const offset = (pagination.page - 1) * pagination.limit;
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }
    }

    const result = await database.query(query, params);
    const transformedFeedback = result.rows.map(row => this.transformFeedback(row));
    return { feedback: transformedFeedback, total };
  }

  /**
   * Get feedback by ID
   */
  static async findById(id: number): Promise<Feedback | null> {
    const query = `
      SELECT 
        f.*,
        CASE 
          WHEN f.user_type != 'anonymous' AND f.user_id IS NOT NULL THEN 
            (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
          ELSE NULL
        END as user_name
      FROM feedback f
      WHERE f.id = $1
    `;
    
    const result = await database.query(query, [id]);
    return result.rows.length > 0 ? this.transformFeedback(result.rows[0]) : null;
  }

  /**
   * Create new feedback
   */
  static async create(feedbackData: CreateFeedbackRequest): Promise<Feedback> {
    const query = `
      INSERT INTO feedback (
        user_id, user_type, category, subject, message, 
        rating, priority, attachments, meta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      feedbackData.user_id || null,
      feedbackData.user_type || 'anonymous',
      feedbackData.category || 'general',
      feedbackData.subject || 'Feedback', // Default subject if not provided
      feedbackData.comment, // Map frontend 'comment' to backend 'message'
      feedbackData.rating, // Required field
      feedbackData.priority || 'medium',
      feedbackData.attachments ? JSON.stringify(feedbackData.attachments) : null,
      feedbackData.meta ? JSON.stringify(feedbackData.meta) : null
    ];

    const result = await database.query(query, values);
    
    // Transform the result to match frontend expectations
    const feedback = result.rows[0];
    return {
      ...feedback,
      comment: feedback.message, // Map 'message' back to 'comment' for frontend
      meta: feedback.meta ? (typeof feedback.meta === 'string' ? JSON.parse(feedback.meta) : feedback.meta) : undefined
    };
  }

  /**
   * Update feedback
   */
  static async update(id: number, updateData: UpdateFeedbackRequest): Promise<Feedback | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(updateData.status);
      paramIndex++;
    }

    if (updateData.priority !== undefined) {
      fields.push(`priority = $${paramIndex}`);
      values.push(updateData.priority);
      paramIndex++;
    }

    if (updateData.admin_notes !== undefined) {
      fields.push(`admin_notes = $${paramIndex}`);
      values.push(updateData.admin_notes);
      paramIndex++;
    }

    if (updateData.resolved_by !== undefined) {
      fields.push(`resolved_by = $${paramIndex}`);
      values.push(updateData.resolved_by);
      paramIndex++;
    }

    // Set resolved_at if status is being changed to resolved
    if (updateData.status === 'resolved') {
      fields.push(`resolved_at = CURRENT_TIMESTAMP`);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE feedback 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await database.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete feedback
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM feedback WHERE id = $1';
    const result = await database.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get feedback statistics
   */
  static async getStatistics(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_feedback,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
        AVG(rating) as average_rating,
        COUNT(*) FILTER (WHERE rating IS NOT NULL) as rated_feedback_count
      FROM feedback
    `;
    
    const result = await database.query(query);
    return result.rows[0];
  }
}