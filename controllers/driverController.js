const db = require('../config/database');

const driverController = {
  // Get all drivers
  getAllDrivers: async (req, res) => {
    try {
      const query = `
        SELECT 
          id, 
          name, 
          phone_number, 
          location, 
          vehicle_type, 
          capacity, 
          availability_status,
          status,
          created_at 
        FROM drivers 
        ORDER BY created_at DESC
      `;
      
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get driver by ID
  getDriverById: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
        SELECT * FROM drivers WHERE id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching driver:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create new driver
  createDriver: async (req, res) => {
    try {
      const { name, phone_number, location, vehicle_type, capacity } = req.body;
      
      const query = `
        INSERT INTO drivers (name, phone_number, location, vehicle_type, capacity, availability_status, status)
        VALUES ($1, $2, $3, $4, $5, 'available', 'active')
        RETURNING *
      `;
      
      const result = await db.query(query, [name, phone_number, location, vehicle_type, capacity]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update driver
  updateDriver: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone_number, location, vehicle_type, capacity, availability_status, status } = req.body;
      
      const query = `
        UPDATE drivers 
        SET name = $1, phone_number = $2, location = $3, vehicle_type = $4, 
            capacity = $5, availability_status = $6, status = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      
      const result = await db.query(query, [name, phone_number, location, vehicle_type, capacity, availability_status, status, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating driver:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete driver
  deleteDriver: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `DELETE FROM drivers WHERE id = $1 RETURNING *`;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      
      res.json({ message: 'Driver deleted successfully' });
    } catch (error) {
      console.error('Error deleting driver:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = driverController;