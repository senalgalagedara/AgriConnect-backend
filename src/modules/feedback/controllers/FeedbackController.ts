import { Request, Response } from 'express';
import feedbackService from '../services/FeedbackService';  // import the instance
import { 
    CreateFeedbackRequest, 
    UpdateFeedbackRequest, 
    FeedbackQueryOptions,
    FeedbackType
} from '../types';

interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages?: number;
    };
}

export class FeedbackController {
  /**
   * Get all feedback with filtering and pagination
   */
  async getAllFeedback(req: Request, res: Response): Promise<Response> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const options: FeedbackQueryOptions = {
        limit: Math.min(100, Math.max(1, limit))
      };

      // compute offset from 1-based page query param
      const offset = Math.max(0, page - 1) * options.limit!;
      options.offset = offset;

      if (req.query.user_id) options.user_id = req.query.user_id as string;
      if (req.query.feedback_type) options.feedback_type = req.query.feedback_type as FeedbackType;
      if (req.query.start_date) options.startDate = new Date(req.query.start_date as string);
      if (req.query.end_date) options.endDate = new Date(req.query.end_date as string);

      const result = await feedbackService.getFeedbackList(options);

      const response: ApiResponse = {
        success: true,
        data: result.feedback,
        message: 'Feedback retrieved successfully',
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      };

  return res.json(response);
    } catch (error) {
      console.error('Error in FeedbackController.getAllFeedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving feedback',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Invalid feedback ID' });
      }

      const feedback = await feedbackService.getFeedback(id);

      if (!feedback) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }

      return res.json({ success: true, data: feedback, message: 'Feedback retrieved successfully' });
    } catch (error) {
      console.error('Error in FeedbackController.getFeedbackById:', error);
      return res.status(500).json({ success: false, message: 'Error retrieving feedback', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Create new feedback
   */
  async createFeedback(req: Request, res: Response): Promise<Response> {
    try {
  const feedbackData: CreateFeedbackRequest = req.body;
  // Use session middleware's injected currentUser instead of deprecated user property
  const userId = (req as any).currentUser?.id;

      const feedback = await feedbackService.createFeedback(userId, feedbackData);

      return res.status(201).json({ success: true, data: feedback, message: 'Feedback created successfully' });
    } catch (error) {
      console.error('Error in FeedbackController.createFeedback:', error);
      return res.status(400).json({ success: false, message: 'Error creating feedback', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Update feedback
   */
  async updateFeedback(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id;
      const updateData: UpdateFeedbackRequest = req.body;

      const feedback = await feedbackService.updateFeedback(id, updateData);

      if (!feedback) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }

      return res.json({ success: true, data: feedback, message: 'Feedback updated successfully' });
    } catch (error) {
      console.error('Error in FeedbackController.updateFeedback:', error);
      return res.status(400).json({ success: false, message: 'Error updating feedback', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id;
      const deleted = await feedbackService.deleteFeedback(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }

      return res.json({ success: true, message: 'Feedback deleted successfully' });
    } catch (error) {
      console.error('Error in FeedbackController.deleteFeedback:', error);
      return res.status(500).json({ success: false, message: 'Error deleting feedback', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const statistics = await feedbackService.getFeedbackStatistics();
      return res.json({ success: true, data: statistics, message: 'Feedback statistics retrieved successfully' });
    } catch (error) {
      console.error('Error in FeedbackController.getFeedbackStatistics:', error);
      return res.status(500).json({ success: false, message: 'Error retrieving statistics', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get feedback by user
   */
  async getFeedbackByUser(req: Request, res: Response): Promise<Response> {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }

      const feedback = await feedbackService.getFeedbackByUser(userId);

      return res.json({ success: true, data: feedback, message: 'User feedback retrieved successfully' });
    } catch (error) {
      console.error('Error in FeedbackController.getFeedbackByUser:', error);
      return res.status(500).json({ success: false, message: 'Error retrieving user feedback', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}
