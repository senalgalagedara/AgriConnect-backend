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
          COALESCE(o.contact->>'firstName','') || ' ' || COALESCE(o.contact->>'lastName','') as customer_name,
          o.contact->>'phone' as customer_phone,
          o.shipping->>'address' as customer_address,
          o.total as weight,
          (COALESCE(d.first_name,'') || ' ' || COALESCE(d.last_name,'')) as driver_name,
          d.vehicle_type,
          d.vehicle_capacity as capacity,
          d.contact_number as driver_phone
        FROM assignments a
        LEFT JOIN orders o ON a.order_id = o.id
        LEFT JOIN drivers d ON a.driver_id = d.id
        ORDER BY a.created_at DESC
      `;
      const result = await database.query(query);
      return result.rows as Assignment[];
    } catch (error) {
      console.error('Error in AssignmentModel.findAll:', error);
      if (error instanceof Error && 'message' in error) {
        throw new Error('Failed to retrieve assignments: ' + error.message);
      }
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
          (d.first_name || ' ' || d.last_name) as driver_name,
          d.vehicle_type,
          d.vehicle_capacity as capacity,
          d.contact_number as driver_phone
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

        // Use your drivers table columns: vehicle_capacity, is_available
        const capQuery = `
          SELECT d.vehicle_capacity::int - COALESCE(SUM(oi.qty)::int, 0) AS remaining_capacity
          FROM drivers d
          LEFT JOIN assignments a ON a.driver_id = d.id AND a.status IN ('pending','in_progress')
          LEFT JOIN order_items oi ON oi.order_id = a.order_id
          WHERE d.id = $1
          GROUP BY d.vehicle_capacity
        `;

        const capRes = await database.query(capQuery, [driverId]);
        const remaining_capacity = capRes.rows.length > 0 ? Number(capRes.rows[0].remaining_capacity) : null;

        if (remaining_capacity === null) {
          throw new Error('Driver not found');
        }

        // Get order quantity (sum qty for the order)
        const orderQtyRes = await database.query('SELECT COALESCE(SUM(qty),0) as qty FROM order_items WHERE order_id = $1', [orderId]);
        const orderQty = Number(orderQtyRes.rows[0]?.qty ?? 0);

        if (orderQty <= 0) {
          throw new Error('Order has no items to assign');
        }

        if (orderQty > remaining_capacity) {
          throw new Error(`Driver does not have enough remaining capacity. Remaining: ${remaining_capacity}, required: ${orderQty}`);
        }

        // Create assignment
        const assignmentQuery = `
          INSERT INTO assignments (order_id, driver_id, schedule_time, special_notes, status)
          VALUES ($1, $2, $3, $4, 'pending')
          RETURNING *
        `;

        const assignmentResult = await database.query(assignmentQuery, [orderId, driverId, scheduleTime, specialNotes || null]);

        // Update order status to 'assigned' after successful assignment creation
        // Try different status values that might exist in the orders table
        let statusUpdated = false;
        const statusesToTry = ['assigned', 'processing', 'shipped'];
        
        for (const statusValue of statusesToTry) {
          try {
            await database.query(`UPDATE orders SET status = $1 WHERE id = $2`, [statusValue, orderId]);
            console.log(`Order ${orderId} status updated to '${statusValue}'`);
            statusUpdated = true;
            break;
          } catch (e: any) {
            // Check if it's a constraint error (invalid enum value)
            if (e.message && e.message.includes('invalid input value')) {
              continue; // Try next status
            }
            // For other errors, log but don't fail the transaction
            console.warn(`Warning: failed to set order status to '${statusValue}':`, e.message);
          }
        }
        
        if (!statusUpdated) {
          console.warn(`Warning: Could not update order ${orderId} status - no valid status value found`);
        }

        // If after assignment remaining capacity becomes 0, mark driver unavailable
        const afterCapRes = await database.query(capQuery, [driverId]);
        const afterRemaining = afterCapRes.rows.length > 0 ? Number(afterCapRes.rows[0].remaining_capacity) : null;
        if (afterRemaining !== null && afterRemaining <= 0) {
          // use availability_status consistently across the codebase
          await database.query('UPDATE drivers SET availability_status = $1 WHERE id = $2', ['busy', driverId]);
        }

        await database.query('COMMIT');

        // Return the full assignment details if possible, but do not fail if enrichment fails
        try {
          const fullAssignment = await this.findById(assignmentResult.rows[0].id);
          if (fullAssignment) return fullAssignment;
        } catch (enrichErr) {
          console.warn('Warning: could not enrich assignment after creation:', enrichErr instanceof Error ? enrichErr.message : enrichErr);
        }
        return assignmentResult.rows[0] as Assignment;
      } catch (error) {
        await database.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error in AssignmentModel.create:', error);
      if (error instanceof Error) {
        throw error;
      }
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
            // Re-throw original error to surface meaningful message to client
            throw error;
        SET schedule_time = COALESCE($1, schedule_time), 
            special_notes = COALESCE($2, special_notes), 
            status = COALESCE($3, status), 
          // Preserve original error message if available
          if (error instanceof Error && error.message) {
            throw new Error(error.message);
          }
          throw new Error('Failed to create assignment');
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
        // Optionally revert order status if your workflow requires it. Skipped by default to avoid enum issues.
        // await database.query('UPDATE orders SET status = $1 WHERE id = $2', ['pending', order_id]);

        // Try to set driver back to available, tolerating different schemas
        // Attempt 1: availability_status text column
        try {
          await database.query('UPDATE drivers SET availability_status = $1 WHERE id = $2', ['available', driver_id]);
        } catch (e1: any) {
          // Attempt 2: status text column
          try {
            await database.query('UPDATE drivers SET status = $1 WHERE id = $2', ['available', driver_id]);
          } catch (e2: any) {
            // Attempt 3: boolean is_available column
            try {
              await database.query('UPDATE drivers SET is_available = $1 WHERE id = $2', [true, driver_id]);
            } catch (e3: any) {
              console.warn('Warning: could not update driver availability after assignment delete:', e3?.message ?? e3);
              // Do not fail deletion if driver availability update fails
            }
          }
        }

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