import { Request, Response } from 'express';
import { FeedbackService } from '../services/FeedbackService';
import { ApiResponse, CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackFilter, PaginationOptions } from '../../..';

export class FeedbackController {

  /**
   * Get all feedback with filtering and pagination
   */
  static async getAllFeedback(req: Request, res: Response): Promise<void> {
    try {
      // Extract pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sortBy = req.query.sortBy as string || 'created_at';
      const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const pagination: PaginationOptions = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)), // Limit between 1 and 100
        sortBy,
        sortOrder
      };

      // Extract filter parameters
      const filters: FeedbackFilter = {};
      if (req.query.user_type) filters.user_type = req.query.user_type as string;
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.priority) filters.priority = req.query.priority as string;
      if (req.query.created_from) filters.created_from = new Date(req.query.created_from as string);
      if (req.query.created_to) filters.created_to = new Date(req.query.created_to as string);
      if (req.query.rating_min) filters.rating_min = parseInt(req.query.rating_min as string);
      if (req.query.rating_max) filters.rating_max = parseInt(req.query.rating_max as string);

      const result = await FeedbackService.getAllFeedback(filters, pagination);

      const response: ApiResponse = {
        success: true,
        data: result.feedback,
        message: 'Feedback retrieved successfully',
      };

      // Add pagination info to response
      if (result.pages) {
        (response as any).pagination = {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          pages: result.pages
        };
      }

      res.json(response);
    } catch (error) {
      console.error('Error in FeedbackController.getAllFeedback:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving feedback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get feedback by ID
   */
  static async getFeedbackById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid feedback ID'
        };
        res.status(400).json(response);
        return;
      }

      const feedback = await FeedbackService.getFeedbackById(id);
      
      if (!feedback) {
        const response: ApiResponse = {
          success: false,
          message: 'Feedback not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: feedback,
        message: 'Feedback retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FeedbackController.getFeedbackById:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving feedback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create new feedback
   */
  static async createFeedback(req: Request, res: Response): Promise<void> {
    try {
      const feedbackData: CreateFeedbackRequest = req.body;

      const feedback = await FeedbackService.createFeedback(feedbackData);

      const response: ApiResponse = {
        success: true,
        data: feedback,
        message: 'Feedback created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Error in FeedbackController.createFeedback:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error creating feedback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(400).json(response);
    }
  }

  /**
   * Update feedback (admin only)
   */
  static async updateFeedback(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid feedback ID'
        };
        res.status(400).json(response);
        return;
      }

      const updateData: UpdateFeedbackRequest = req.body;
      const feedback = await FeedbackService.updateFeedback(id, updateData);

      if (!feedback) {
        const response: ApiResponse = {
          success: false,
          message: 'Feedback not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: feedback,
        message: 'Feedback updated successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FeedbackController.updateFeedback:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error updating feedback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(400).json(response);
    }
  }

  /**
   * Delete feedback (admin only)
   */
  static async deleteFeedback(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid feedback ID'
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await FeedbackService.deleteFeedback(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Feedback not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Feedback deleted successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FeedbackController.deleteFeedback:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error deleting feedback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get feedback statistics
   */
  static async getFeedbackStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await FeedbackService.getFeedbackStatistics();

      const response: ApiResponse = {
        success: true,
        data: statistics,
        message: 'Feedback statistics retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FeedbackController.getFeedbackStatistics:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving feedback statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get feedback by user
   */
  static async getFeedbackByUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const userType = req.params.userType;
      
      if (isNaN(userId)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid user ID'
        };
        res.status(400).json(response);
        return;
      }

      const feedback = await FeedbackService.getFeedbackByUser(userId, userType);

      const response: ApiResponse = {
        success: true,
        data: feedback,
        message: 'User feedback retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FeedbackController.getFeedbackByUser:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving user feedback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }
}