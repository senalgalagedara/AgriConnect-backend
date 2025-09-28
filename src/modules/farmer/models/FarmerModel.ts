import database from '../../../config/database';
import { Farmer, CreateFarmerRequest, UpdateFarmerRequest, PaginationOptions } from '../../../types';

export class FarmerModel {

  /**
   * Get all farmers with detailed information
   */
  static async findAll(): Promise<Farmer[]> {
    try {
      const result = await database.query(`
        SELECT 
          f.*,
          p.name as province_name,
          COUNT(s.id) as total_supplies,
          COALESCE(SUM(s.quantity * s.price_per_unit), 0) as total_value
        FROM farmers f
        LEFT JOIN provinces p ON f.province_id = p.id
        LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
        GROUP BY f.id, p.name
        ORDER BY f.name
      `);
      return result.rows;
    } catch (error) {
      console.error('Error in FarmerModel.findAll:', error);
      throw error;
    }
  }

  /**
   * Get farmers by province
   */
  static async findByProvinceId(provinceId: number): Promise<Farmer[]> {
    try {
      const result = await database.query(`
        SELECT 
          f.*,
          p.name as province_name,
          COUNT(s.id) as total_supplies,
          COALESCE(SUM(s.quantity * s.price_per_unit), 0) as total_value
        FROM farmers f
        LEFT JOIN provinces p ON f.province_id = p.id
        LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
        WHERE f.province_id = $1
        GROUP BY f.id, p.name
        ORDER BY f.name
      `, [provinceId]);
      return result.rows;
    } catch (error) {
      console.error('Error in FarmerModel.findByProvinceId:', error);
      throw error;
    }
  }

  /**
   * Get farmer by ID with detailed information
   */
  static async findById(id: number): Promise<Farmer | null> {
    try {
      const result = await database.query(`
        SELECT 
          f.*,
          p.name as province_name,
          COUNT(s.id) as total_supplies,
          COALESCE(SUM(s.quantity * s.price_per_unit), 0) as total_value
        FROM farmers f
        LEFT JOIN provinces p ON f.province_id = p.id
        LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
        WHERE f.id = $1
        GROUP BY f.id, p.name
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in FarmerModel.findById:', error);
      throw error;
    }
  }

  /**
   * Create new farmer
   */
  static async create(farmerData: CreateFarmerRequest): Promise<Farmer> {
    try {
      const {
        name,
        contact_number,
        email,
        address,
        province_id,
        registration_number
      } = farmerData;

      const result = await database.query(`
        INSERT INTO farmers (
          name, contact_number, email, address, province_id, registration_number, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [name, contact_number, email, address, province_id, registration_number]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in FarmerModel.create:', error);
      throw error;
    }
  }

  /**
   * Update farmer
   */
  static async update(id: number, farmerData: UpdateFarmerRequest): Promise<Farmer | null> {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (farmerData.name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(farmerData.name);
        paramIndex++;
      }

      if (farmerData.contact_number !== undefined) {
        fields.push(`contact_number = $${paramIndex}`);
        values.push(farmerData.contact_number);
        paramIndex++;
      }

      if (farmerData.email !== undefined) {
        fields.push(`email = $${paramIndex}`);
        values.push(farmerData.email);
        paramIndex++;
      }

      if (farmerData.address !== undefined) {
        fields.push(`address = $${paramIndex}`);
        values.push(farmerData.address);
        paramIndex++;
      }

      if (farmerData.province_id !== undefined) {
        fields.push(`province_id = $${paramIndex}`);
        values.push(farmerData.province_id);
        paramIndex++;
      }

      if (farmerData.registration_number !== undefined) {
        fields.push(`registration_number = $${paramIndex}`);
        values.push(farmerData.registration_number);
        paramIndex++;
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE farmers 
        SET ${fields.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;

      const result = await database.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error in FarmerModel.update:', error);
      throw error;
    }
  }

  /**
   * Delete farmer (hard delete since no status field)
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await database.query(`
        DELETE FROM farmers WHERE id = $1
      `, [id]);

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error in FarmerModel.delete:', error);
      throw error;
    }
  }

  /**
   * Get farmers with pagination and filtering
   */
  static async findAllPaginated(
    filters?: {
      province_id?: number;
      search?: string;
    },
    pagination?: PaginationOptions
  ): Promise<{ farmers: Farmer[], total: number }> {
    try {
      let query = `
        SELECT 
          f.*,
          p.name as province_name,
          COUNT(s.id) as total_supplies,
          COALESCE(SUM(s.quantity * s.price_per_unit), 0) as total_value
        FROM farmers f
        LEFT JOIN provinces p ON f.province_id = p.id
        LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters?.province_id) {
        query += ` AND f.province_id = $${paramIndex}`;
        params.push(filters.province_id);
        paramIndex++;
      }

      if (filters?.search) {
        query += ` AND (LOWER(f.name) LIKE LOWER($${paramIndex}) OR LOWER(f.email) LIKE LOWER($${paramIndex}))`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` GROUP BY f.id, p.name`;

      // Count total records first
      let countQuery = `SELECT COUNT(*) as total FROM farmers f WHERE 1=1`;
      const countParams = [];
      let countParamIndex = 1;

      if (filters?.province_id) {
        countQuery += ` AND f.province_id = $${countParamIndex}`;
        countParams.push(filters.province_id);
        countParamIndex++;
      }

      if (filters?.search) {
        countQuery += ` AND (LOWER(f.name) LIKE LOWER($${countParamIndex}) OR LOWER(f.email) LIKE LOWER($${countParamIndex}))`;
        countParams.push(`%${filters.search}%`);
        countParamIndex++;
      }
      
      const countResult = await database.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      // Apply sorting
      const sortBy = pagination?.sortBy || 'created_at';
      const sortOrder = pagination?.sortOrder || 'DESC';
      query += ` ORDER BY f.${sortBy} ${sortOrder}`;

      // Apply pagination
      if (pagination?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(pagination.limit);
        paramIndex++;
        
        if (pagination?.page && pagination.page > 1) {
          const offset = (pagination.page - 1) * pagination.limit;
          query += ` OFFSET $${paramIndex}`;
          params.push(offset);
        }
      }

      const result = await database.query(query, params);
      return { farmers: result.rows, total };
    } catch (error) {
      console.error('Error in FarmerModel.findAllPaginated:', error);
      throw error;
    }
  }

  /**
   * Check if farmer exists by email
   */
  static async findByEmail(email: string): Promise<Farmer | null> {
    try {
      const result = await database.query(`
        SELECT * FROM farmers WHERE LOWER(email) = LOWER($1)
      `, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in FarmerModel.findByEmail:', error);
      throw error;
    }
  }
}