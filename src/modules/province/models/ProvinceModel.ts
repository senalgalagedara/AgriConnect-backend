import database from '../../../config/database';
import { Province, CreateProvinceRequest, UpdateProvinceRequest, ProvinceStatistics } from '../../..';

export class ProvinceModel {
 
  static async findAll(): Promise<Province[]> {
    try {
      const result = await database.query(`
        SELECT 
          p.*,
          COUNT(pr.id) as total_products,
          COALESCE(SUM(pr.current_stock), 0) as total_current_stock
        FROM provinces p
        LEFT JOIN products pr ON p.id = pr.province_id AND pr.status = 'active'
        GROUP BY p.id
        ORDER BY p.name
      `);
      return result.rows;
    } catch (error) {
      console.error('Error in ProvinceModel.findAll:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Province | null> {
    try {
      const result = await database.query(`
        SELECT 
          p.*,
          COUNT(pr.id) as total_products,
          COALESCE(SUM(pr.current_stock), 0) as total_current_stock,
          COALESCE(SUM(pr.daily_limit), 0) as total_daily_capacity
        FROM provinces p
        LEFT JOIN products pr ON p.id = pr.province_id AND pr.status = 'active'
        WHERE p.id = $1
        GROUP BY p.id
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in ProvinceModel.findById:', error);
      throw error;
    }
  }

  static async create(provinceData: CreateProvinceRequest): Promise<Province> {
    try {
      const { name, capacity, location, manager_name } = provinceData;
      const result = await database.query(`
        INSERT INTO provinces (name, capacity, location, manager_name)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [name, capacity || 0, location, manager_name]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in ProvinceModel.create:', error);
      throw error;
    }
  }
  static async update(id: number, provinceData: UpdateProvinceRequest): Promise<Province | null> {
    try {
      const { name, capacity, location, manager_name } = provinceData;
      const result = await database.query(`
        UPDATE provinces 
        SET name = $1, capacity = $2, location = $3, manager_name = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [name, capacity, location, manager_name, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in ProvinceModel.update:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<Province | null> {
    try {
      const result = await database.query('DELETE FROM provinces WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in ProvinceModel.delete:', error);
      throw error;
    }
  }

  static async getStatistics(id: number): Promise<ProvinceStatistics | null> {
    try {
      const result = await database.query(`
        SELECT 
          p.name as province_name,
          COUNT(DISTINCT pr.id) as total_products,
          COUNT(DISTINCT f.id) as total_farmers,
          COUNT(DISTINCT s.id) as total_suppliers,
          COALESCE(SUM(pr.current_stock), 0) as total_stock,
          COALESCE(SUM(pr.daily_limit), 0) as total_capacity,
          COALESCE(AVG(pr.final_price), 0) as average_price,
          (COALESCE(SUM(pr.current_stock), 0) * 100.0 / NULLIF(p.capacity, 0)) as utilization_percentage
        FROM provinces p
        LEFT JOIN products pr ON p.id = pr.province_id AND pr.status = 'active'
        LEFT JOIN farmers f ON p.id = f.province_id
        LEFT JOIN suppliers s ON pr.id = s.product_id AND s.status = 'active'
        WHERE p.id = $1
        GROUP BY p.id, p.name, p.capacity
      `, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error in ProvinceModel.getStatistics:', error);
      throw error;
    }
  }
}