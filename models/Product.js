const db = require('../config/database');

class Product {
  // Get all products by province
  static async findByProvinceId(provinceId) {
    try {
      const result = await db.query(`
        SELECT 
          p.*,
          c.name as category_name,
          prov.name as province_name,
          COUNT(s.id) as supplier_count,
          COALESCE(SUM(s.quantity), 0) as total_supplied
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
        WHERE p.province_id = $1 AND p.status = 'active'
        GROUP BY p.id, c.name, prov.name
        ORDER BY p.product_name
      `, [provinceId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get product by ID
  static async findById(id) {
    try {
      const result = await db.query(`
        SELECT 
          p.*,
          c.name as category_name,
          prov.name as province_name,
          COUNT(s.id) as supplier_count,
          COALESCE(SUM(s.quantity), 0) as total_supplied
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
        WHERE p.id = $1
        GROUP BY p.id, c.name, prov.name
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get product by name and province
  static async findByNameAndProvince(productName, provinceId) {
    try {
      const result = await db.query(`
        SELECT 
          p.*,
          c.name as category_name,
          prov.name as province_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        WHERE LOWER(p.product_name) = LOWER($1) AND p.province_id = $2 AND p.status = 'active'
      `, [productName, provinceId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create new product
  static async create(productData) {
    try {
      const { 
        product_name, 
        category_id, 
        province_id, 
        daily_limit, 
        unit = 'kg' 
      } = productData;
      
      const result = await db.query(`
        INSERT INTO products (product_name, category_id, province_id, daily_limit, unit)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [product_name, category_id, province_id, daily_limit || 0, unit]);
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update product
  static async update(id, productData) {
    try {
      const { 
        product_name, 
        category_id, 
        daily_limit, 
        final_price, 
        unit, 
        status 
      } = productData;
      
      const result = await db.query(`
        UPDATE products 
        SET 
          product_name = COALESCE($1, product_name),
          category_id = COALESCE($2, category_id),
          daily_limit = COALESCE($3, daily_limit),
          final_price = COALESCE($4, final_price),
          unit = COALESCE($5, unit),
          status = COALESCE($6, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `, [product_name, category_id, daily_limit, final_price, unit, status, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update daily limit
  static async updateDailyLimit(id, dailyLimit) {
    try {
      const result = await db.query(`
        UPDATE products 
        SET daily_limit = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [dailyLimit, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete product (soft delete)
  static async delete(id) {
    try {
      const result = await db.query(`
        UPDATE products 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get product with suppliers
  static async findWithSuppliers(id) {
    try {
      const result = await db.query(`
        SELECT 
          p.*,
          c.name as category_name,
          prov.name as province_name,
          json_agg(
            json_build_object(
              'supplier_id', s.id,
              'farmer_id', s.farmer_id,
              'farmer_name', f.name,
              'farmer_contact', f.contact_number,
              'quantity', s.quantity,
              'price_per_unit', s.price_per_unit,
              'supply_date', s.supply_date,
              'notes', s.notes
            ) ORDER BY s.supply_date DESC
          ) FILTER (WHERE s.id IS NOT NULL) as suppliers
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN provinces prov ON p.province_id = prov.id
        LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
        LEFT JOIN farmers f ON s.farmer_id = f.id
        WHERE p.id = $1
        GROUP BY p.id, c.name, prov.name
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Search products
  static async search(provinceId, searchTerm) {
    try {
      const result = await db.query(`
        SELECT 
          p.*,
          c.name as category_name,
          COUNT(s.id) as supplier_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
        WHERE p.province_id = $1 
        AND p.status = 'active'
        AND (
          LOWER(p.product_name) LIKE LOWER($2) 
          OR LOWER(c.name) LIKE LOWER($2)
        )
        GROUP BY p.id, c.name
        ORDER BY p.product_name
      `, [provinceId, `%${searchTerm}%`]);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product;