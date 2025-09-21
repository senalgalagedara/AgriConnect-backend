const db = require('../config/database');

class Supplier {
  // Get all suppliers
  static async findAll() {
    try {
      const result = await db.query(`
        SELECT 
          s.*,
          f.name as farmer_name,
          f.contact_number as farmer_contact,
          p.product_name,
          p.unit,
          pr.name as province_name
        FROM suppliers s
        JOIN farmers f ON s.farmer_id = f.id
        JOIN products p ON s.product_id = p.id
        JOIN provinces pr ON p.province_id = pr.id
        WHERE s.status = 'active'
        ORDER BY s.supply_date DESC
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get suppliers by product ID
  static async findByProductId(productId) {
    try {
      const result = await db.query(`
        SELECT 
          s.*,
          f.name as farmer_name,
          f.contact_number as farmer_contact,
          f.email as farmer_email,
          f.address as farmer_address,
          f.registration_number as farmer_reg_number
        FROM suppliers s
        JOIN farmers f ON s.farmer_id = f.id
        WHERE s.product_id = $1 AND s.status = 'active'
        ORDER BY s.supply_date DESC, s.price_per_unit ASC
      `, [productId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get supplier by ID
  static async findById(id) {
    try {
      const result = await db.query(`
        SELECT 
          s.*,
          f.name as farmer_name,
          f.contact_number as farmer_contact,
          f.email as farmer_email,
          f.address as farmer_address,
          f.registration_number as farmer_reg_number,
          p.product_name,
          p.unit,
          pr.name as province_name
        FROM suppliers s
        JOIN farmers f ON s.farmer_id = f.id
        JOIN products p ON s.product_id = p.id
        JOIN provinces pr ON p.province_id = pr.id
        WHERE s.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create new supplier entry
  static async create(supplierData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const { 
        farmer_id, 
        product_id, 
        quantity, 
        price_per_unit, 
        supply_date = new Date().toISOString().split('T')[0], 
        notes 
      } = supplierData;
      
      // Insert supplier entry
      const result = await client.query(`
        INSERT INTO suppliers (farmer_id, product_id, quantity, price_per_unit, supply_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [farmer_id, product_id, quantity, price_per_unit, supply_date, notes]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update supplier entry
  static async update(id, supplierData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const { 
        quantity, 
        price_per_unit, 
        supply_date, 
        notes, 
        status 
      } = supplierData;
      
      const result = await client.query(`
        UPDATE suppliers 
        SET 
          quantity = COALESCE($1, quantity),
          price_per_unit = COALESCE($2, price_per_unit),
          supply_date = COALESCE($3, supply_date),
          notes = COALESCE($4, notes),
          status = COALESCE($5, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `, [quantity, price_per_unit, supply_date, notes, status, id]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete supplier entry (soft delete)
  static async delete(id) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(`
        UPDATE suppliers 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get supplier statistics
  static async getStatistics(productId = null, farmerId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_supplies,
          COALESCE(SUM(quantity), 0) as total_quantity,
          COALESCE(AVG(price_per_unit), 0) as average_price,
          COALESCE(MIN(price_per_unit), 0) as min_price,
          COALESCE(MAX(price_per_unit), 0) as max_price,
          COALESCE(SUM(quantity * price_per_unit), 0) as total_value
        FROM suppliers s
        WHERE s.status = 'active'
      `;
      
      let params = [];
      
      if (productId) {
        query += ' AND s.product_id = $1';
        params.push(productId);
      }
      
      if (farmerId) {
        const paramIndex = params.length + 1;
        query += ` AND s.farmer_id = $${paramIndex}`;
        params.push(farmerId);
      }
      
      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get recent supplies
  static async getRecentSupplies(limit = 10) {
    try {
      const result = await db.query(`
        SELECT 
          s.*,
          f.name as farmer_name,
          f.contact_number as farmer_contact,
          p.product_name,
          p.unit,
          pr.name as province_name
        FROM suppliers s
        JOIN farmers f ON s.farmer_id = f.id
        JOIN products p ON s.product_id = p.id
        JOIN provinces pr ON p.province_id = pr.id
        WHERE s.status = 'active'
        ORDER BY s.supply_date DESC, s.created_at DESC
        LIMIT $1
      `, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Search suppliers
  static async search(searchTerm, productId = null) {
    try {
      let query = `
        SELECT 
          s.*,
          f.name as farmer_name,
          f.contact_number as farmer_contact,
          p.product_name,
          p.unit,
          pr.name as province_name
        FROM suppliers s
        JOIN farmers f ON s.farmer_id = f.id
        JOIN products p ON s.product_id = p.id
        JOIN provinces pr ON p.province_id = pr.id
        WHERE s.status = 'active'
        AND (
          LOWER(f.name) LIKE LOWER($1) 
          OR LOWER(p.product_name) LIKE LOWER($1)
          OR LOWER(pr.name) LIKE LOWER($1)
        )
      `;
      
      let params = [`%${searchTerm}%`];
      
      if (productId) {
        query += ' AND s.product_id = $2';
        params.push(productId);
      }
      
      query += ' ORDER BY s.supply_date DESC';
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Supplier;