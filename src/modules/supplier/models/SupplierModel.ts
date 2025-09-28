import database from '../../../config/database';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest, PaginationOptions } from '../../../types';

export class SupplierModel {

  /**
   * Get all supplier records with detailed information
   */
  static async findAll(): Promise<Supplier[]> {
    try {
      const result = await database.query(`
        SELECT 
          s.*,
          f.name as farmer_name,
          p.product_name as product_name,
          prov.name as province_name
        FROM suppliers s
        LEFT JOIN farmers f ON s.farmer_id = f.id
        LEFT JOIN products p ON s.product_id = p.id
        LEFT JOIN provinces prov ON f.province_id = prov.id
        ORDER BY s.created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error in SupplierModel.findAll:', error);
      throw error;
    }
  }

  /**
   * Get supplier records by farmer ID
   */
  static async findByFarmerId(farmerId: number): Promise<Supplier[]> {
    try {
      const result = await database.query(`
        SELECT 
          s.*,
          f.name as farmer_name,
          p.product_name as product_name,
          prov.name as province_name
        FROM suppliers s
        LEFT JOIN farmers f ON s.farmer_id = f.id
        LEFT JOIN products p ON s.product_id = p.id
        LEFT JOIN provinces prov ON f.province_id = prov.id
        WHERE s.farmer_id = $1
        ORDER BY s.created_at DESC
      `, [farmerId]);
      return result.rows;
    } catch (error) {
      console.error('Error in SupplierModel.findByFarmerId:', error);
      throw error;
    }
  }

  /**
   * Get supplier records by product ID
   */
  static async findByProductId(productId: number): Promise<Supplier[]> {
    try {
      const result = await database.query(`
        SELECT 
          s.*,
          f.name as farmer_name,
          p.product_name as product_name,
          prov.name as province_name
        FROM suppliers s
        LEFT JOIN farmers f ON s.farmer_id = f.id
        LEFT JOIN products p ON s.product_id = p.id
        LEFT JOIN provinces prov ON f.province_id = prov.id
        WHERE s.product_id = $1
        ORDER BY s.created_at DESC
      `, [productId]);
      return result.rows;
    } catch (error) {
      console.error('Error in SupplierModel.findByProductId:', error);
      throw error;
    }
  }

  /**
   * Get supplier record by ID with detailed information
   */
  static async findById(id: number): Promise<Supplier | null> {
    try {
      const result = await database.query(`
        SELECT 
          s.*,
          f.name as farmer_name,
          p.product_name as product_name,
          prov.name as province_name
        FROM suppliers s
        LEFT JOIN farmers f ON s.farmer_id = f.id
        LEFT JOIN products p ON s.product_id = p.id
        LEFT JOIN provinces prov ON f.province_id = prov.id
        WHERE s.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in SupplierModel.findById:', error);
      throw error;
    }
  }

  /**
   * Create new supplier record
   */
  static async create(supplierData: CreateSupplierRequest): Promise<Supplier> {
    try {
      const {
        farmer_id,
        product_id,
        quantity,
        price_per_unit,
        supply_date,
        notes,
        status = 'active'
      } = supplierData;

      const result = await database.query(`
        INSERT INTO suppliers (
          farmer_id, product_id, quantity, price_per_unit, supply_date, 
          notes, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [farmer_id, product_id, quantity, price_per_unit, supply_date, notes, status]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in SupplierModel.create:', error);
      throw error;
    }
  }

  /**
   * Update supplier record
   */
  static async update(id: number, supplierData: UpdateSupplierRequest): Promise<Supplier | null> {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (supplierData.farmer_id !== undefined) {
        fields.push(`farmer_id = $${paramIndex}`);
        values.push(supplierData.farmer_id);
        paramIndex++;
      }

      if (supplierData.product_id !== undefined) {
        fields.push(`product_id = $${paramIndex}`);
        values.push(supplierData.product_id);
        paramIndex++;
      }

      if (supplierData.quantity !== undefined) {
        fields.push(`quantity = $${paramIndex}`);
        values.push(supplierData.quantity);
        paramIndex++;
      }

      if (supplierData.price_per_unit !== undefined) {
        fields.push(`price_per_unit = $${paramIndex}`);
        values.push(supplierData.price_per_unit);
        paramIndex++;
      }

      if (supplierData.supply_date !== undefined) {
        fields.push(`supply_date = $${paramIndex}`);
        values.push(supplierData.supply_date);
        paramIndex++;
      }

      if (supplierData.notes !== undefined) {
        fields.push(`notes = $${paramIndex}`);
        values.push(supplierData.notes);
        paramIndex++;
      }

      if (supplierData.status !== undefined) {
        fields.push(`status = $${paramIndex}`);
        values.push(supplierData.status);
        paramIndex++;
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE suppliers 
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
      console.error('Error in SupplierModel.update:', error);
      throw error;
    }
  }

  /**
   * Delete supplier record
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await database.query(`
        DELETE FROM suppliers WHERE id = $1
      `, [id]);

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error in SupplierModel.delete:', error);
      throw error;
    }
  }

  /**
   * Get supplier records with pagination and filtering
   */
  static async findAllPaginated(
    filters?: {
      farmer_id?: number;
      product_id?: number;
      status?: string;
      search?: string;
    },
    pagination?: PaginationOptions
  ): Promise<{ suppliers: Supplier[], total: number }> {
    try {
      let query = `
        SELECT 
          s.*,
          f.name as farmer_name,
          p.product_name as product_name,
          prov.name as province_name
        FROM suppliers s
        LEFT JOIN farmers f ON s.farmer_id = f.id
        LEFT JOIN products p ON s.product_id = p.id
        LEFT JOIN provinces prov ON f.province_id = prov.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters?.farmer_id) {
        query += ` AND s.farmer_id = $${paramIndex}`;
        params.push(filters.farmer_id);
        paramIndex++;
      }

      if (filters?.product_id) {
        query += ` AND s.product_id = $${paramIndex}`;
        params.push(filters.product_id);
        paramIndex++;
      }

      if (filters?.status) {
        query += ` AND s.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.search) {
        query += ` AND (LOWER(f.name) LIKE LOWER($${paramIndex}) OR LOWER(p.product_name) LIKE LOWER($${paramIndex}))`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Count total records first
      let countQuery = `SELECT COUNT(*) as total FROM suppliers s WHERE 1=1`;
      const countParams = [];
      let countParamIndex = 1;

      if (filters?.farmer_id) {
        countQuery += ` AND s.farmer_id = $${countParamIndex}`;
        countParams.push(filters.farmer_id);
        countParamIndex++;
      }

      if (filters?.product_id) {
        countQuery += ` AND s.product_id = $${countParamIndex}`;
        countParams.push(filters.product_id);
        countParamIndex++;
      }

      if (filters?.status) {
        countQuery += ` AND s.status = $${countParamIndex}`;
        countParams.push(filters.status);
        countParamIndex++;
      }
      
      const countResult = await database.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      // Apply sorting
      const sortBy = pagination?.sortBy || 'created_at';
      const sortOrder = pagination?.sortOrder || 'DESC';
      query += ` ORDER BY s.${sortBy} ${sortOrder}`;

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
      return { suppliers: result.rows, total };
    } catch (error) {
      console.error('Error in SupplierModel.findAllPaginated:', error);
      throw error;
    }
  }
}