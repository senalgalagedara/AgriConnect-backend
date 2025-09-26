const db = require('../config/database');

const assignmentController = {
  // Get all assignments with order and driver details
  getAllAssignments: async (req, res) => {
    try {
      const query = `
        SELECT 
          a.*,
          o.order_id,
          o.customer_name,
          o.phone_number as customer_phone,
          o.address as customer_address,
          o.weight,
          d.name as driver_name,
          d.vehicle_type,
          d.capacity
        FROM assignments a
        LEFT JOIN orders o ON a.order_id = o.id
        LEFT JOIN drivers d ON a.driver_id = d.id
        ORDER BY a.created_at DESC
      `;
      
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get assignment by ID
  getAssignmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          a.*,
          o.order_id,
          o.customer_name,
          o.phone_number as customer_phone,
          o.address as customer_address,
          o.weight,
          d.name as driver_name,
          d.vehicle_type,
          d.capacity
        FROM assignments a
        LEFT JOIN orders o ON a.order_id = o.id
        LEFT JOIN drivers d ON a.driver_id = d.id
        WHERE a.id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create new assignment
  createAssignment: async (req, res) => {
    try {
      const { orderId, driverId, scheduleTime, specialNotes } = req.body;
      
      // Start transaction
      await db.query('BEGIN');
      
      try {
        // Create assignment
        const assignmentQuery = `
          INSERT INTO assignments (order_id, driver_id, schedule_time, special_notes, status)
          VALUES ($1, $2, $3, $4, 'pending')
          RETURNING *
        `;
        
        const assignmentResult = await db.query(assignmentQuery, [orderId, driverId, scheduleTime, specialNotes]);
        
        // Update order status
        await db.query('UPDATE orders SET assignment_status = $1 WHERE id = $2', ['assigned', orderId]);
        
        // Update driver availability
        await db.query('UPDATE drivers SET availability_status = $1 WHERE id = $2', ['busy', driverId]);
        
        await db.query('COMMIT');
        
        res.status(201).json(assignmentResult.rows[0]);
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update assignment
  updateAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const { schedule_time, special_notes, status } = req.body;
      
      const query = `
        UPDATE assignments 
        SET schedule_time = $1, special_notes = $2, status = COALESCE($3, status), updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await db.query(query, [schedule_time, special_notes, status, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete assignment
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Start transaction
      await db.query('BEGIN');
      
      try {
        // Get assignment details first
        const getAssignmentQuery = 'SELECT order_id, driver_id FROM assignments WHERE id = $1';
        const assignmentResult = await db.query(getAssignmentQuery, [id]);
        
        if (assignmentResult.rows.length === 0) {
          await db.query('ROLLBACK');
          return res.status(404).json({ error: 'Assignment not found' });
        }
        
        const { order_id, driver_id } = assignmentResult.rows[0];
        
        // Delete assignment
        await db.query('DELETE FROM assignments WHERE id = $1', [id]);
        
        // Update order status back to unassigned
        await db.query('UPDATE orders SET assignment_status = $1 WHERE id = $2', ['unassigned', order_id]);
        
        // Update driver availability back to available
        await db.query('UPDATE drivers SET availability_status = $1 WHERE id = $2', ['available', driver_id]);
        
        await db.query('COMMIT');
        
        res.json({ message: 'Assignment deleted successfully' });
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = assignmentController;