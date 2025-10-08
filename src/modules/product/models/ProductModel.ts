import database from '../../../config/database';
import { Product, CreateProductRequest, UpdateProductRequest, PaginationOptions } from '../../../types';

export class ProductModel {

  static async findByProvinceId(provinceId: number): Promise<Product[]> {
    try {
      const result = await database.query(`
        SELECT 
          p.*,
          c.name as category_name,
          prov.name as province_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        WHERE p.province_id = $1 AND p.status = 'active'
        ORDER BY p.product_name
      `, [provinceId]);
      return result.rows;
    } catch (error) {
      console.error('Error in ProductModel.findByProvinceId:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Product | null> {
    try {
      const result = await database.query(`
        SELECT 
          p.*,
          c.name as category_name,
          prov.name as province_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        WHERE p.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in ProductModel.findById:', error);
      throw error;
    }
  }
  static async findAll(
    filters?: {
      status?: string;
      category?: string;
      province_id?: number;
      search?: string;
    },
    pagination?: PaginationOptions
  ): Promise<{ products: Product[], total: number }> {
    try {
      let query = `
        SELECT 
          p.*,
          c.name as category_name,
          prov.name as province_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        query += ` AND p.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.province_id) {
        query += ` AND p.province_id = $${paramIndex}`;
        params.push(filters.province_id);
        paramIndex++;
      }

      if (filters?.search) {
        query += ` AND LOWER(p.product_name) LIKE LOWER($${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      let countQuery = `SELECT COUNT(*) as total FROM products p WHERE 1=1`;
      const countParams = [];
      let countParamIndex = 1;

      if (filters?.status) {
        countQuery += ` AND p.status = $${countParamIndex}`;
        countParams.push(filters.status);
        countParamIndex++;
      }

      if (filters?.province_id) {
        countQuery += ` AND p.province_id = $${countParamIndex}`;
        countParams.push(filters.province_id);
        countParamIndex++;
      }

      if (filters?.search) {
        countQuery += ` AND LOWER(p.product_name) LIKE LOWER($${countParamIndex})`;
        countParams.push(`%${filters.search}%`);
        countParamIndex++;
      }
      
      const countResult = await database.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      const sortBy = pagination?.sortBy || 'created_at';
      const sortOrder = pagination?.sortOrder || 'DESC';
      query += ` ORDER BY p.${sortBy} ${sortOrder}`;

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
      return { products: result.rows, total };
    } catch (error) {
      console.error('Error in ProductModel.findAll:', error);
      throw error;
    }
  }


  static async create(productData: CreateProductRequest): Promise<Product> {
    try {
      const {
        name,
        category_id = 1, 
        province_id,
        daily_limit,
        current_stock = 0,
        final_price,
        unit = 'kg',
        status = 'active'
      } = productData;

      const result = await database.query(`
        INSERT INTO products (
          product_name, category_id, province_id, daily_limit, 
          current_stock, final_price, unit, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [name, category_id, province_id, daily_limit, current_stock, final_price, unit, status]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in ProductModel.create:', error);
      throw error;
    }
  }

  static async update(id: number, productData: UpdateProductRequest): Promise<Product | null> {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (productData.name !== undefined) {
        fields.push(`product_name = $${paramIndex}`);
        values.push(productData.name);
        paramIndex++;
      }

      if (productData.category_id !== undefined) {
        fields.push(`category_id = $${paramIndex}`);
        values.push(productData.category_id);
        paramIndex++;
      }

      if (productData.province_id !== undefined) {
        fields.push(`province_id = $${paramIndex}`);
        values.push(productData.province_id);
        paramIndex++;
      }

      if (productData.daily_limit !== undefined) {
        fields.push(`daily_limit = $${paramIndex}`);
        values.push(productData.daily_limit);
        paramIndex++;
      }

      if (productData.current_stock !== undefined) {
        fields.push(`current_stock = $${paramIndex}`);
        values.push(productData.current_stock);
        paramIndex++;
      }

      if (productData.final_price !== undefined) {
        fields.push(`final_price = $${paramIndex}`);
        values.push(productData.final_price);
        paramIndex++;
      }

      if (productData.unit !== undefined) {
        fields.push(`unit = $${paramIndex}`);
        values.push(productData.unit);
        paramIndex++;
      }

      if (productData.status !== undefined) {
        fields.push(`status = $${paramIndex}`);
        values.push(productData.status);
        paramIndex++;
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE products 
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
      console.error('Error in ProductModel.update:', error);
      throw error;
    }
  }

  static async updateStock(id: number, stockChange: number): Promise<Product | null> {
    try {
      const result = await database.query(`
        UPDATE products 
        SET current_stock = current_stock + $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [stockChange, id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error in ProductModel.updateStock:', error);
      throw error;
    }
  }

 
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await database.query(`
        UPDATE products 
        SET status = 'deleted', updated_at = NOW()
        WHERE id = $1 AND status != 'deleted'
      `, [id]);

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error in ProductModel.delete:', error);
      throw error;
    }
  }

  static async findLowStock(): Promise<Product[]> {
    try {
      const result = await database.query(`
        SELECT 
          p.*,
          c.name as category_name,
          prov.name as province_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        WHERE p.status = 'active' 
        AND p.current_stock < p.daily_limit * 0.2
        ORDER BY p.current_stock ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error in ProductModel.findLowStock:', error);
      throw error;
    }
  }


  static async checkAvailability(id: number): Promise<{
    available: boolean;
    current_stock: number;
    daily_limit: number;
    status: string;
  } | null> {
    try {
      const result = await database.query(`
        SELECT current_stock, daily_limit, status
        FROM products
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const product = result.rows[0];
      return {
        available: product.status === 'active' && parseFloat(product.current_stock) > 0,
        current_stock: parseFloat(product.current_stock),
        daily_limit: parseFloat(product.daily_limit),
        status: product.status
      };
    } catch (error) {
      console.error('Error in ProductModel.checkAvailability:', error);
      throw error;
    }
  }
}