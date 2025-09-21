const db = require('../config/database');

class Farmer {
  // Get all farmers
  static async findAll() {
    try {
      const result = await db.query(`
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
      throw error;
    }
  }

  // Get farmers by province
  static async findByProvinceId(provinceId) {
    try {
      const result = await db.query(`
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
      throw error;
    }
  }

  // Get farmer by ID
  static async findById(id) {
    try {
      const result = await db.query(`
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
      throw error;
    }
  }

  // Create new farmer
  static async create(farmerData) {
    try {
      const { 
        name, 
        contact_number, 
        email, 
        address, 
        province_id, 
        registration_number 
      } = farmerData;
      
      const result = await db.query(`
        INSERT INTO farmers (name, contact_number, email, address, province_id, registration_number)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, contact_number, email, address, province_id, registration_number]);
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update farmer
  static async update(id, farmerData) {
    try {
      const { 
        name, 
        contact_number, 
        email, 
        address, 
        province_id, 
        registration_number 
      } = farmerData;
      
      const result = await db.query(`
        UPDATE farmers 
        SET 
          name = COALESCE($1, name),
          contact_number = COALESCE($2, contact_number),
          email = COALESCE($3, email),
          address = COALESCE($4, address),
          province_id = COALESCE($5, province_id),
          registration_number = COALESCE($6, registration_number),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `, [name, contact_number, email, address, province_id, registration_number, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete farmer
  static async delete(id) {
    try {
      const result = await db.query('DELETE FROM farmers WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get farmer supplies
  static async getSupplies(id) {
    try {
      const result = await db.query(`
        SELECT 
          s.*,
          p.product_name,
          p.unit,
          pr.name as province_name
        FROM suppliers s
        JOIN products p ON s.product_id = p.id
        JOIN provinces pr ON p.province_id = pr.id
        WHERE s.farmer_id = $1 AND s.status = 'active'
        ORDER BY s.supply_date DESC
      `, [id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Search farmers
  static async search(searchTerm, provinceId = null) {
    try {
      let query = `
        SELECT 
          f.*,
          p.name as province_name,
          COUNT(s.id) as total_supplies
        FROM farmers f
        LEFT JOIN provinces p ON f.province_id = p.id
        LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
        WHERE (
          LOWER(f.name) LIKE LOWER($1) 
          OR LOWER(f.contact_number) LIKE LOWER($1)
          OR LOWER(f.registration_number) LIKE LOWER($1)
        )
      `;
      
      let params = [`%${searchTerm}%`];
      
      if (provinceId) {
        query += ' AND f.province_id = $2';
        params.push(provinceId);
      }
      
      query += ' GROUP BY f.id, p.name ORDER BY f.name';
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}