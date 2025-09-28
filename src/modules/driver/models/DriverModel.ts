import database from '../../../config/database';
import { Driver, CreateDriverRequest, UpdateDriverRequest } from '../../../types/entities';

export class DriverModel {
  /**
   * Get all drivers
   */
  static async findAll(): Promise<Driver[]> {
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
          created_at,
          updated_at
        FROM drivers 
        ORDER BY created_at DESC
      `;
      
      const result = await database.query(query);
      return result.rows as Driver[];
    } catch (error) {
      console.error('Error in DriverModel.findAll:', error);
      throw new Error('Failed to retrieve drivers');
    }
  }

  /**
   * Get driver by ID
   */
  static async findById(id: number): Promise<Driver | null> {
    try {
      const query = `SELECT * FROM drivers WHERE id = $1`;
      const result = await database.query(query, [id]);
      
      return result.rows.length > 0 ? result.rows[0] as Driver : null;
    } catch (error) {
      console.error('Error in DriverModel.findById:', error);
      throw new Error('Failed to retrieve driver');
    }
  }

  /**
   * Create new driver
   */
  static async create(driverData: CreateDriverRequest): Promise<Driver> {
    try {
      const query = `
        INSERT INTO drivers (name, phone_number, location, vehicle_type, capacity, availability_status, status)
        VALUES ($1, $2, $3, $4, $5, 'available', 'active')
        RETURNING *
      `;
      
      const { name, phone_number, location, vehicle_type, capacity } = driverData;
      const result = await database.query(query, [name, phone_number, location, vehicle_type, capacity]);
      
      return result.rows[0] as Driver;
    } catch (error) {
      console.error('Error in DriverModel.create:', error);
      throw new Error('Failed to create driver');
    }
  }

  /**
   * Update driver
   */
  static async update(id: number, driverData: UpdateDriverRequest): Promise<Driver | null> {
    try {
      const { name, phone_number, location, vehicle_type, capacity, availability_status, status } = driverData;
      
      const query = `
        UPDATE drivers 
        SET name = COALESCE($1, name), 
            phone_number = COALESCE($2, phone_number), 
            location = COALESCE($3, location), 
            vehicle_type = COALESCE($4, vehicle_type), 
            capacity = COALESCE($5, capacity), 
            availability_status = COALESCE($6, availability_status), 
            status = COALESCE($7, status), 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      
      const result = await database.query(query, [name, phone_number, location, vehicle_type, capacity, availability_status, status, id]);
      
      return result.rows.length > 0 ? result.rows[0] as Driver : null;
    } catch (error) {
      console.error('Error in DriverModel.update:', error);
      throw new Error('Failed to update driver');
    }
  }

  /**
   * Delete driver
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const query = `DELETE FROM drivers WHERE id = $1 RETURNING *`;
      const result = await database.query(query, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in DriverModel.delete:', error);
      throw new Error('Failed to delete driver');
    }
  }

  /**
   * Get available drivers
   */
  static async findAvailable(): Promise<Driver[]> {
    try {
      const query = `
        SELECT * FROM drivers 
        WHERE availability_status = 'available' AND status = 'active'
        ORDER BY created_at DESC
      `;
      
      const result = await database.query(query);
      return result.rows as Driver[];
    } catch (error) {
      console.error('Error in DriverModel.findAvailable:', error);
      throw new Error('Failed to retrieve available drivers');
    }
  }

  /**
   * Update driver availability status
   */
  static async updateAvailabilityStatus(id: number, status: Driver['availability_status']): Promise<Driver | null> {
    try {
      const query = `
        UPDATE drivers 
        SET availability_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await database.query(query, [status, id]);
      
      return result.rows.length > 0 ? result.rows[0] as Driver : null;
    } catch (error) {
      console.error('Error in DriverModel.updateAvailabilityStatus:', error);
      throw new Error('Failed to update driver availability status');
    }
  }
}