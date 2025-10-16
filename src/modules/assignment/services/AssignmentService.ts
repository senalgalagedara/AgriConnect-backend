import { AssignmentModel } from '../models/AssignmentModel';
import { Assignment, CreateAssignmentRequest, UpdateAssignmentRequest } from '../../../types/entities';
import { NotificationService } from '../../product/services/NotificationService';
import database from '../../../config/database';

export class AssignmentService {
  /**
   * Get all assignments
   */
  static async getAllAssignments(): Promise<Assignment[]> {
    try {
      return await AssignmentModel.findAll();
    } catch (error) {
      console.error('Error in AssignmentService.getAllAssignments:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve assignments');
    }
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(id: number): Promise<Assignment | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid assignment ID is required');
      }

      return await AssignmentModel.findById(id);
    } catch (error) {
      console.error('Error in AssignmentService.getAssignmentById:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve assignment');
    }
  }

  /**
   * Create new assignment
   */
  static async createAssignment(assignmentData: CreateAssignmentRequest): Promise<Assignment> {
    try {
      // Validate required fields
      if (!assignmentData.orderId || assignmentData.orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      if (!assignmentData.driverId || assignmentData.driverId <= 0) {
        throw new Error('Valid driver ID is required');
      }

      if (!assignmentData.scheduleTime) {
        throw new Error('Schedule time is required');
      }

      // Validate schedule time is in the future
      const scheduleDate = new Date(assignmentData.scheduleTime);
      const now = new Date();
      
      if (scheduleDate <= now) {
        throw new Error('Schedule time must be in the future');
      }

      // Validate special notes length if provided
      if (assignmentData.specialNotes && assignmentData.specialNotes.length > 500) {
        throw new Error('Special notes cannot exceed 500 characters');
      }

      const assignment = await AssignmentModel.create(assignmentData);

      // Get driver and order details for notification
      try {
        const driverResult = await database.query(
          'SELECT first_name, last_name, contact_number FROM drivers WHERE id = $1',
          [assignmentData.driverId]
        );
        const orderResult = await database.query(
          'SELECT order_no FROM orders WHERE id = $1',
          [assignmentData.orderId]
        );

        if (driverResult.rows.length > 0 && orderResult.rows.length > 0) {
          const driver = driverResult.rows[0];
          const order = orderResult.rows[0];
          const driverName = `${driver.first_name} ${driver.last_name}`;
          
          // Send notification (async, non-blocking)
          NotificationService.notifyDriverAssigned(
            assignmentData.orderId,
            order.order_no,
            driverName,
            driver.contact_number
          ).catch(err => console.error('Failed to send driver assignment notification:', err));
        }
      } catch (notifError) {
        console.error('Error fetching data for notification:', notifError);
        // Don't throw - notification failure shouldn't break assignment
      }

      return assignment;
    } catch (error) {
      console.error('Error in AssignmentService.createAssignment:', error);
      throw error instanceof Error ? error : new Error('Failed to create assignment');
    }
  }

  /**
   * Update assignment
   */
  static async updateAssignment(id: number, assignmentData: UpdateAssignmentRequest): Promise<Assignment | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid assignment ID is required');
      }

      // Validate schedule time if provided
      if (assignmentData.schedule_time) {
        const scheduleDate = new Date(assignmentData.schedule_time);
        const now = new Date();
        
        if (scheduleDate <= now) {
          throw new Error('Schedule time must be in the future');
        }
      }

      // Validate special notes length if provided
      if (assignmentData.special_notes && assignmentData.special_notes.length > 500) {
        throw new Error('Special notes cannot exceed 500 characters');
      }

      // Validate status if provided
      if (assignmentData.status) {
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(assignmentData.status)) {
          throw new Error('Invalid assignment status');
        }
      }

      return await AssignmentModel.update(id, assignmentData);
    } catch (error) {
      console.error('Error in AssignmentService.updateAssignment:', error);
      throw error instanceof Error ? error : new Error('Failed to update assignment');
    }
  }

  /**
   * Delete assignment
   */
  static async deleteAssignment(id: number): Promise<boolean> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid assignment ID is required');
      }

      return await AssignmentModel.delete(id);
    } catch (error) {
      console.error('Error in AssignmentService.deleteAssignment:', error);
      throw error instanceof Error ? error : new Error('Failed to delete assignment');
    }
  }

  /**
   * Get assignments by driver ID
   */
  static async getAssignmentsByDriverId(driverId: number): Promise<Assignment[]> {
    try {
      if (!driverId || driverId <= 0) {
        throw new Error('Valid driver ID is required');
      }

      return await AssignmentModel.findByDriverId(driverId);
    } catch (error) {
      console.error('Error in AssignmentService.getAssignmentsByDriverId:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve driver assignments');
    }
  }

  /**
   * Get assignments by status
   */
  static async getAssignmentsByStatus(status: Assignment['status']): Promise<Assignment[]> {
    try {
      if (!status) {
        throw new Error('Assignment status is required');
      }

      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid assignment status');
      }

      return await AssignmentModel.findByStatus(status);
    } catch (error) {
      console.error('Error in AssignmentService.getAssignmentsByStatus:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve assignments by status');
    }
  }
}