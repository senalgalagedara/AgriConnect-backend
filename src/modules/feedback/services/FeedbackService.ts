import pool from '../../../config/database';
import { FeedbackModel } from '../models/FeedbackModel';
import { 
    FeedbackData, 
    CreateFeedbackRequest, 
    UpdateFeedbackRequest,
    FeedbackQueryOptions
} from '../types';

export class FeedbackService {
    // Create feedback
    async createFeedback(userId: string | undefined, data: CreateFeedbackRequest): Promise<FeedbackData> {
        // Debug: raw incoming body snapshot (shallow)
        console.log('[FeedbackService.createFeedback] raw body keys:', Object.keys(data || {}));
        console.log('[FeedbackService.createFeedback] raw feedback_type value:', (data as any).feedback_type, 'alt(type):', (data as any).type, 'alt(feedbackType):', (data as any).feedbackType);
        if (!data.rating || data.rating < 1 || data.rating > 5) {
            throw new Error('Rating is required and must be between 1 and 5');
        }
        if (!data.comment || data.comment.trim().length === 0) {
            throw new Error('Comment is required');
        }
        if (data.comment.length > 5000) {
            throw new Error('Comment must not exceed 5000 characters');
        }

        // Map frontend fields to model fields (model maps comment -> message)
        // Accept alternative property names from frontend just in case
        const incomingType = (data as any).feedback_type || (data as any).type || (data as any).feedbackType;

        const payload: any = {
            user_id: userId ? Number(userId) : undefined,
            user_type: (data as any).user_type || 'anonymous',
            category: (data as any).category || 'general',
            feedback_type: incomingType || 'transactional',
            subject: data.title || (data as any).subject || 'Feedback',
            comment: data.comment, // model will map this to message column
            rating: data.rating,
            priority: (data as any).priority || 'medium',
            attachments: (data as any).attachments || null,
            meta: data.meta || null
        };

        // Debug: log payload to ensure frontend 'comment' is passed and mapped
        console.log('[FeedbackService.createFeedback] payload:', payload);
        if (!incomingType) {
            console.warn('[FeedbackService.createFeedback] No feedback_type supplied by client; using default transactional');
        }

        const created = await FeedbackModel.create(payload as any);
        // FeedbackModel.create already transforms DB -> frontend shape (comment field present)
        return {
            rating: created.rating,
            comment: created.comment,
            feedback_type: (created as any).feedback_type,
            meta: created.meta
        } as FeedbackData;
    }

    // Get feedback by ID
    async getFeedback(feedbackId: string): Promise<FeedbackData | null> {
        if (!feedbackId) {
            throw new Error('Feedback ID is required');
        }
        const id = Number(feedbackId);
        if (isNaN(id)) throw new Error('Invalid feedback ID');

        const found = await FeedbackModel.findById(id);
        if (!found) return null;

        return {
            rating: found.rating,
            comment: found.comment,
            feedback_type: (found as any).feedback_type,
            meta: found.meta
        } as FeedbackData;
    }

    // Update feedback (delegates to model where applicable)
    async updateFeedback(feedbackId: string, data: UpdateFeedbackRequest): Promise<FeedbackData | null> {
        if (!feedbackId) {
            throw new Error('Feedback ID is required');
        }
        const id = Number(feedbackId);
        if (isNaN(id)) throw new Error('Invalid feedback ID');

        // Map incoming fields to model's update shape when appropriate
        const updatePayload: any = {};
        if (data.status !== undefined) updatePayload.status = data.status;
        if ((data as any).priority !== undefined) updatePayload.priority = (data as any).priority;
        if ((data as any).admin_notes !== undefined) updatePayload.admin_notes = (data as any).admin_notes;

        // For comment/rating/title changes which model.update doesn't handle, perform a direct SQL update
        const directUpdates: string[] = [];
        const directValues: any[] = [];
        let idx = 1;
        if (data.rating !== undefined) {
            if (data.rating < 1 || data.rating > 5) throw new Error('Rating must be between 1 and 5');
            directUpdates.push(`rating = $${idx}`);
            directValues.push(data.rating);
            idx++;
        }
        if (data.comment !== undefined) {
            if (data.comment.length > 5000) throw new Error('Comment must not exceed 5000 characters');
            // DB column is 'message'
            directUpdates.push(`message = $${idx}`);
            directValues.push(data.comment);
            idx++;
        }
        if (data.title !== undefined) {
            if (data.title.length > 255) throw new Error('Title must not exceed 255 characters');
            directUpdates.push(`subject = $${idx}`);
            directValues.push(data.title);
            idx++;
        }

        // First call model.update for admin-like fields
        let updated: any = null;
        if (Object.keys(updatePayload).length > 0) {
            updated = await FeedbackModel.update(id, updatePayload);
        }

        // Then apply any direct updates
        if (directUpdates.length > 0) {
            const query = `UPDATE feedback SET ${directUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`;
            directValues.push(id);
            const result = await pool.query(query, directValues);
            updated = result.rows[0];
        }

        if (!updated) return null;

        return {
            rating: updated.rating,
            comment: updated.message || updated.comment,
            meta: updated.meta ? (typeof updated.meta === 'string' ? JSON.parse(updated.meta) : updated.meta) : undefined
        } as FeedbackData;
    }

    // Delete feedback
    async deleteFeedback(feedbackId: string): Promise<boolean> {
        if (!feedbackId) {
            throw new Error('Feedback ID is required');
        }
        const id = Number(feedbackId);
        if (isNaN(id)) throw new Error('Invalid feedback ID');
        return await FeedbackModel.delete(id);
    }

    // Get feedback list (with optional filters, pagination)
    // Accepts either page (0-based) or offset. If page is present, offset = page * limit
    async getFeedbackList(options: FeedbackQueryOptions = {}): Promise<{ feedback: FeedbackData[], total: number }> {
        const conditions: string[] = ['1=1'];
        const values: any[] = [];
        let paramCount = 1;

        if (options.user_id) {
            conditions.push(`user_id = $${paramCount}`);
            values.push(options.user_id);
            paramCount++;
        }
        if (options.feedback_type) {
            conditions.push(`feedback_type = $${paramCount}`);
            values.push(options.feedback_type);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Pagination: prefer explicit offset, otherwise compute from page (controller sends 0-based page)
        const limit = options.limit || 10;
        let offset = 0;
        if (typeof options.offset === 'number') {
            offset = options.offset;
        } else if (typeof (options as any).page === 'number') {
            // page is expected to be 0-based from controller
            offset = (options as any).page * limit;
        }

        const query = `
            SELECT * FROM feedback
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
    values.push(limit, offset);

        const dataResult = await pool.query(query, values);

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM feedback ${whereClause}`;
        const countParams = values.slice(0, Math.max(0, values.length - 2));
        const countResult = await pool.query(countQuery, countParams);

        // Map DB rows to frontend shape (message -> comment)
        const mapped = dataResult.rows.map((r: any) => ({
            rating: r.rating,
            comment: r.message,
            feedback_type: r.feedback_type,
            meta: r.meta ? (typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta) : undefined
        }));

        return {
            feedback: mapped,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    // Feedback statistics
    async getFeedbackStatistics(): Promise<any> {
        return await FeedbackModel.getStatistics();
    }

    // Get feedback by user
    async getFeedbackByUser(userId: string | number): Promise<FeedbackData[]> {
        const id = typeof userId === 'number' ? userId : Number(userId);
        if (isNaN(id)) throw new Error('Invalid user ID');
    const rows = await FeedbackModel.findAll({ user_type: undefined } as any, { page: 1, limit: 100 });
        // Filter client-side by user id since model.findAll signature differs
        return rows.feedback.filter(f => (f as any).user_id === id).map(f => ({
            rating: f.rating,
            comment: f.comment,
            feedback_type: (f as any).feedback_type,
            meta: (f as any).meta
        }));
    }
}

export default new FeedbackService();
