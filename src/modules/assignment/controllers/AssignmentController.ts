import { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { AssignmentService } from '../services/AssignmentService';
import { CreateAssignmentRequest, UpdateAssignmentRequest } from '../../../types/entities';
import { ApiResponse } from '../../../types/database';
import { validationResult } from 'express-validator';

export class AssignmentController {
  /**
   * Validation rules for creating assignment
   */
  static createValidation = [
    body('orderId')
      .notEmpty()
      .withMessage('Order ID is required')
      .isInt({ min: 1 })
      .withMessage('Order ID must be a valid positive integer'),
    body('driverId')
      .notEmpty()
      .withMessage('Driver ID is required')
      .isInt({ min: 1 })
      .withMessage('Driver ID must be a valid positive integer'),
    body('scheduleTime')
      .notEmpty()
      .withMessage('Schedule time is required')
      .isISO8601()
      .withMessage('Schedule time must be a valid ISO 8601 date'),
    body('specialNotes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Special notes cannot exceed 500 characters')
  ];

  /**
   * Validation rules for updating assignment
   */
  static updateValidation = [
    param('id')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isInt({ min: 1 })
      .withMessage('Assignment ID must be a valid positive integer'),
    body('schedule_time')
      .optional()
      .isISO8601()
      .withMessage('Schedule time must be a valid ISO 8601 date'),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
    body('special_notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Special notes cannot exceed 500 characters')
  ];

  /**
   * Validation rules for ID parameter
   */
  static idValidation = [
    param('id')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isInt({ min: 1 })
      .withMessage('Assignment ID must be a valid positive integer')
  ];

  /**
   * Validation rules for driver ID parameter
   */
  static driverIdValidation = [
    param('driverId')
      .notEmpty()
      .withMessage('Driver ID is required')
      .isInt({ min: 1 })
      .withMessage('Driver ID must be a valid positive integer')
  ];

  /**
   * Validation rules for status query
   */
  static statusValidation = [
    query('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending, in_progress, completed, cancelled')
  ];

  /**
   * Get all assignments
   */
  static async getAllAssignments(req: Request, res: Response): Promise<void> {
    try {
      const assignments = await AssignmentService.getAllAssignments();

      const response: ApiResponse = {
        success: true,
        data: assignments,
        message: 'Assignments retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in AssignmentController.getAllAssignments:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve assignments',
        error: error instanceof Error ? error.message : 'Failed to retrieve assignments'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          error: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
          }))
        };
        res.status(400).json(response);
        return;
      }

      const id = parseInt(req.params.id);
      const assignment = await AssignmentService.getAssignmentById(id);

      if (!assignment) {
        const response: ApiResponse = {
          success: false,
          message: 'Assignment not found',
          error: 'Assignment not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: assignment,
        message: 'Assignment retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in AssignmentController.getAssignmentById:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve assignment',
        error: error instanceof Error ? error.message : 'Failed to retrieve assignment'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create new assignment
   */
  static async createAssignment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          error: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
          }))
        };
        res.status(400).json(response);
        return;
      }

      const assignmentData: CreateAssignmentRequest = {
        orderId: req.body.orderId,
        driverId: req.body.driverId,
        scheduleTime: req.body.scheduleTime,
        specialNotes: req.body.specialNotes
      };

      const assignment = await AssignmentService.createAssignment(assignmentData);

      const response: ApiResponse = {
        success: true,
        data: assignment,
        message: 'Assignment created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error in AssignmentController.createAssignment:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to create assignment',
        error: error instanceof Error ? error.message : 'Failed to create assignment'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Update assignment
   */
  static async updateAssignment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          error: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
          }))
        };
        res.status(400).json(response);
        return;
      }

      const id = parseInt(req.params.id);
      const assignmentData: UpdateAssignmentRequest = req.body;

      const assignment = await AssignmentService.updateAssignment(id, assignmentData);

      if (!assignment) {
        const response: ApiResponse = {
          success: false,
          message: 'Assignment not found',
          error: 'Assignment not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: assignment,
        message: 'Assignment updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in AssignmentController.updateAssignment:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update assignment',
        error: error instanceof Error ? error.message : 'Failed to update assignment'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Delete assignment
   */
  static async deleteAssignment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          error: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
          }))
        };
        res.status(400).json(response);
        return;
      }

      const id = parseInt(req.params.id);
      const deleted = await AssignmentService.deleteAssignment(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Assignment not found',
          error: 'Assignment not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Assignment deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in AssignmentController.deleteAssignment:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to delete assignment',
        error: error instanceof Error ? error.message : 'Failed to delete assignment'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get assignments by driver ID
   */
  static async getAssignmentsByDriverId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          error: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
          }))
        };
        res.status(400).json(response);
        return;
      }

      const driverId = parseInt(req.params.driverId);
      const assignments = await AssignmentService.getAssignmentsByDriverId(driverId);

      const response: ApiResponse = {
        success: true,
        data: assignments,
        message: 'Driver assignments retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in AssignmentController.getAssignmentsByDriverId:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve driver assignments',
        error: error instanceof Error ? error.message : 'Failed to retrieve driver assignments'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get assignments by status
   */
  static async getAssignmentsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          error: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
          }))
        };
        res.status(400).json(response);
        return;
      }

      const status = req.query.status as string;
      const assignments = await AssignmentService.getAssignmentsByStatus(status as any);

      const response: ApiResponse = {
        success: true,
        data: assignments,
        message: `Assignments with status '${status}' retrieved successfully`
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in AssignmentController.getAssignmentsByStatus:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve assignments by status',
        error: error instanceof Error ? error.message : 'Failed to retrieve assignments by status'
      };
      res.status(500).json(response);
    }
  }
}