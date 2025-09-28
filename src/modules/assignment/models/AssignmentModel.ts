import database from '../../../config/database';
import { Assignment, CreateAssignmentRequest, UpdateAssignmentRequest } from '../../../types/entities';

export class AssignmentModel {
  /**
   * Get all assignments with order and driver details
   */
  static async findAll(): Promise<Assignment[]> {
    try {
      const query = `
        SELECT 
          a.*,
          o.order_no,
          o.contact->>'firstName' || ' ' || o.contact->>'lastName' as customer_name,
          o.contact->>'phone' as customer_phone,
          o.shipping->>'address' as customer_address,
          o.total as weight,
          d.name as driver_name,
          d.vehicle_type,
          d.capacity
        FROM assignments a
        LEFT JOIN orders o ON a.order_id = o.id
        LEFT JOIN drivers d ON a.driver_id = d.id
        ORDER BY a.created_at DESC
      `;
      
      const result = await database.query(query);
      return result.rows as Assignment[];
    } catch (error) {
      console.error('Error in AssignmentModel.findAll:', error);
      throw new Error('Failed to retrieve assignments');
    }
  }

  /**
   * Get assignment by ID with details
   */
  static async findById(id: number): Promise<Assignment | null> {
    try {
      const query = `
        SELECT 
          a.*,
          o.order_no,
          o.contact->>'firstName' || ' ' || o.contact->>'lastName' as customer_name,
          o.contact->>'phone' as customer_phone,
          o.shipping->>'address' as customer_address,
          o.total as weight,
          d.name as driver_name,
          d.vehicle_type,
          d.capacity
        FROM assignments a
        LEFT JOIN orders o ON a.order_id = o.id
        LEFT JOIN drivers d ON a.driver_id = d.id
        WHERE a.id = $1
      `;
      
      const result = await database.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] as Assignment : null;
    } catch (error) {
      console.error('Error in AssignmentModel.findById:', error);
      throw new Error('Failed to retrieve assignment');
    }
  }

  /**
   * Create new assignment with transaction
   */
  static async create(assignmentData: CreateAssignmentRequest): Promise<Assignment> {
    try {
      await database.query('BEGIN');

      try {
        const { orderId, driverId, scheduleTime, specialNotes } = assignmentData;

        // Create assignment
        const assignmentQuery = `
          INSERT INTO assignments (order_id, driver_id, schedule_time, special_notes, status)
          VALUES ($1, $2, $3, $4, 'pending')
          RETURNING *
        `;
        
        const assignmentResult = await database.query(assignmentQuery, [orderId, driverId, scheduleTime, specialNotes || null]);
        
        // Update order status (assuming assignment_status column exists)
        await database.query('UPDATE orders SET assignment_status = $1 WHERE id = $2', ['assigned', orderId]);
        
        // Update driver availability
        await database.query('UPDATE drivers SET availability_status = $1 WHERE id = $2', ['busy', driverId]);
        
        await database.query('COMMIT');
        
        // Return the full assignment details
        const fullAssignment = await this.findById(assignmentResult.rows[0].id);
        return fullAssignment || assignmentResult.rows[0] as Assignment;
      } catch (error) {
        await database.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error in AssignmentModel.create:', error);
      throw new Error('Failed to create assignment');
    }
  }

  /**
   * Update assignment
   */
  static async update(id: number, assignmentData: UpdateAssignmentRequest): Promise<Assignment | null> {
    try {
      const { schedule_time, special_notes, status } = assignmentData;
      
      const query = `
        UPDATE assignments 
        SET schedule_time = COALESCE($1, schedule_time), 
            special_notes = COALESCE($2, special_notes), 
            status = COALESCE($3, status), 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await database.query(query, [schedule_time, special_notes, status, id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      // Return the full assignment details
      const fullAssignment = await this.findById(id);
      return fullAssignment;
    } catch (error) {
      console.error('Error in AssignmentModel.update:', error);
      throw new Error('Failed to update assignment');
    }
  }

  /**
   * Delete assignment with transaction
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await database.query('BEGIN');

      try {
        // Get assignment details first
        const getAssignmentQuery = 'SELECT order_id, driver_id FROM assignments WHERE id = $1';
        const assignmentResult = await database.query(getAssignmentQuery, [id]);
        
        if (assignmentResult.rows.length === 0) {
          await database.query('ROLLBACK');
          return false;
        }
        
        const { order_id, driver_id } = assignmentResult.rows[0];
        
        // Delete assignment
        await database.query('DELETE FROM assignments WHERE id = $1', [id]);
        
        // Update order status back to unassigned
        await database.query('UPDATE orders SET assignment_status = $1 WHERE id = $2', ['unassigned', order_id]);
        
        // Update driver availability back to available
        await database.query('UPDATE drivers SET availability_status = $1 WHERE id = $2', ['available', driver_id]);
        
        await database.query('COMMIT');
        return true;
      } catch (error) {
        await database.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error in AssignmentModel.delete:', error);
      throw new Error('Failed to delete assignment');
    }
  }

  /**
   * Get assignments by driver ID
   */
  static async findByDriverId(driverId: number): Promise<Assignment[]> {
    try {
      const query = `
        SELECT 
          a.*,
          o.order_no,
          o.contact->>'firstName' || ' ' || o.contact->>'lastName' as customer_name,
          o.contact->>'phone' as customer_phone,
          o.shipping->>'address' as customer_address,
          o.total as weight
        FROM assignments a
        LEFT JOIN orders o ON a.order_id = o.id
        WHERE a.driver_id = $1
        ORDER BY a.created_at DESC
      `;
      
      const result = await database.query(query, [driverId]);
      return result.rows as Assignment[];
    } catch (error) {
      console.error('Error in AssignmentModel.findByDriverId:', error);
      throw new Error('Failed to retrieve driver assignments');
    }
  }

  /**
   * Get assignments by status
   */
  static async findByStatus(status: Assignment['status']): Promise<Assignment[]> {
    try {
      const query = `
        SELECT 
          a.*,
          o.order_no,
          o.contact->>'firstName' || ' ' || o.contact->>'lastName' as customer_name,
          o.contact->>'phone' as customer_phone,
          o.shipping->>'address' as customer_address,
          o.total as weight,
          d.name as driver_name,
          d.vehicle_type,
          d.capacity
        FROM assignments a
        LEFT JOIN orders o ON a.order_id = o.id
        LEFT JOIN drivers d ON a.driver_id = d.id
        WHERE a.status = $1
        ORDER BY a.created_at DESC
      `;
      
      const result = await database.query(query, [status]);
      return result.rows as Assignment[];
    } catch (error) {
      console.error('Error in AssignmentModel.findByStatus:', error);
      throw new Error('Failed to retrieve assignments by status');
    }
  }
}