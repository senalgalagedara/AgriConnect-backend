import { FeedbackModel } from '../models/FeedbackModel';
import { Feedback, CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackFilter, PaginationOptions } from '../../../types';

export class FeedbackService {

  /**
   * Get all feedback with filtering and pagination
   */
  static async getAllFeedback(
    filters?: FeedbackFilter,
    pagination?: PaginationOptions
  ): Promise<{ feedback: Feedback[], total: number, pages?: number }> {
    try {
      const result = await FeedbackModel.findAll(filters, pagination);
      
      let pages: number | undefined;
      if (pagination?.limit) {
        pages = Math.ceil(result.total / pagination.limit);
      }
      
      return {
        ...result,
        pages
      };
    } catch (error) {
      console.error('Error in FeedbackService.getAllFeedback:', error);
      throw new Error('Failed to retrieve feedback');
    }
  }

  /**
   * Get feedback by ID
   */
  static async getFeedbackById(id: number): Promise<Feedback | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid feedback ID');
      }
      
      return await FeedbackModel.findById(id);
    } catch (error) {
      console.error('Error in FeedbackService.getFeedbackById:', error);
      throw new Error('Failed to retrieve feedback');
    }
  }

  /**
   * Create new feedback
   */
  static async createFeedback(feedbackData: CreateFeedbackRequest): Promise<Feedback> {
    try {
      // Validate required fields
      if (!feedbackData.user_type) {
        throw new Error('User type is required');
      }
      
      if (!feedbackData.category) {
        throw new Error('Category is required');
      }
      
      if (!feedbackData.subject || feedbackData.subject.trim().length === 0) {
        throw new Error('Subject is required');
      }
      
      if (!feedbackData.message || feedbackData.message.trim().length === 0) {
        throw new Error('Message is required');
      }

      // Validate rating if provided
      if (feedbackData.rating && (feedbackData.rating < 1 || feedbackData.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Validate subject and message lengths
      if (feedbackData.subject.length > 255) {
        throw new Error('Subject must not exceed 255 characters');
      }

      if (feedbackData.message.length > 5000) {
        throw new Error('Message must not exceed 5000 characters');
      }

      return await FeedbackModel.create(feedbackData);
    } catch (error) {
      console.error('Error in FeedbackService.createFeedback:', error);
      throw error;
    }
  }

  /**
   * Update feedback (admin only)
   */
  static async updateFeedback(id: number, updateData: UpdateFeedbackRequest): Promise<Feedback | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid feedback ID');
      }

      // Check if feedback exists
      const existingFeedback = await FeedbackModel.findById(id);
      if (!existingFeedback) {
        throw new Error('Feedback not found');
      }

      // Validate admin notes length if provided
      if (updateData.admin_notes && updateData.admin_notes.length > 2000) {
        throw new Error('Admin notes must not exceed 2000 characters');
      }

      return await FeedbackModel.update(id, updateData);
    } catch (error) {
      console.error('Error in FeedbackService.updateFeedback:', error);
      throw error;
    }
  }

  /**
   * Delete feedback (admin only)
   */
  static async deleteFeedback(id: number): Promise<boolean> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid feedback ID');
      }

      // Check if feedback exists
      const existingFeedback = await FeedbackModel.findById(id);
      if (!existingFeedback) {
        throw new Error('Feedback not found');
      }

      return await FeedbackModel.delete(id);
    } catch (error) {
      console.error('Error in FeedbackService.deleteFeedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   */
  static async getFeedbackStatistics(): Promise<any> {
    try {
      const stats = await FeedbackModel.getStatistics();
      
      // Calculate additional metrics
      const totalFeedback = parseInt(stats.total_feedback);
      const resolvedCount = parseInt(stats.resolved_count);
      const ratedCount = parseInt(stats.rated_feedback_count);
      
      return {
        ...stats,
        resolution_rate: totalFeedback > 0 ? ((resolvedCount / totalFeedback) * 100).toFixed(2) : '0.00',
        rating_participation_rate: totalFeedback > 0 ? ((ratedCount / totalFeedback) * 100).toFixed(2) : '0.00',
        average_rating: stats.average_rating ? parseFloat(stats.average_rating).toFixed(2) : null
      };
    } catch (error) {
      console.error('Error in FeedbackService.getFeedbackStatistics:', error);
      throw new Error('Failed to retrieve feedback statistics');
    }
  }

  /**
   * Get feedback by user
   */
  static async getFeedbackByUser(userId: number, userType: string): Promise<Feedback[]> {
    try {
      if (!userId || userId <= 0) {
        throw new Error('Invalid user ID');
      }

      const filters: FeedbackFilter = {
        user_type: userType
      };

      const result = await FeedbackModel.findAll(filters);
      return result.feedback.filter(f => f.user_id === userId);
    } catch (error) {
      console.error('Error in FeedbackService.getFeedbackByUser:', error);
      throw new Error('Failed to retrieve user feedback');
    }
  }
}