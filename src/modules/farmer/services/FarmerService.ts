import { FarmerModel } from '../models/FarmerModel';
import { Farmer, CreateFarmerRequest, UpdateFarmerRequest, PaginationOptions } from '../../..';

export class FarmerService {

  /**
   * Get all farmers with filtering and pagination
   */
  static async getAllFarmers(
    filters?: {
      province_id?: number;
      search?: string;
    },
    pagination?: PaginationOptions
  ): Promise<{ farmers: Farmer[], total: number, pages?: number }> {
    try {
      const result = await FarmerModel.findAllPaginated(filters, pagination);
      
      let pages: number | undefined;
      if (pagination?.limit) {
        pages = Math.ceil(result.total / pagination.limit);
      }
      
      return {
        ...result,
        pages
      };
    } catch (error) {
      console.error('Error in FarmerService.getAllFarmers:', error);
      throw error;
    }
  }

  /**
   * Get farmer by ID
   */
  static async getFarmerById(id: number): Promise<Farmer | null> {
    try {
      return await FarmerModel.findById(id);
    } catch (error) {
      console.error('Error in FarmerService.getFarmerById:', error);
      throw error;
    }
  }

  /**
   * Get farmers by province
   */
  static async getFarmersByProvince(provinceId: number): Promise<Farmer[]> {
    try {
      return await FarmerModel.findByProvinceId(provinceId);
    } catch (error) {
      console.error('Error in FarmerService.getFarmersByProvince:', error);
      throw error;
    }
  }

  /**
   * Create new farmer
   */
  static async createFarmer(farmerData: CreateFarmerRequest): Promise<Farmer> {
    try {
      // Basic validation
      if (!farmerData.name || farmerData.name.trim().length === 0) {
        throw new Error('Farmer name is required');
      }

      if (!farmerData.province_id || farmerData.province_id <= 0) {
        throw new Error('Valid province ID is required');
      }

      // Check if email is already in use (if provided)
      if (farmerData.email) {
        const existingFarmer = await FarmerModel.findByEmail(farmerData.email);
        if (existingFarmer) {
          throw new Error('Email address is already in use');
        }
      }

      return await FarmerModel.create(farmerData);
    } catch (error) {
      console.error('Error in FarmerService.createFarmer:', error);
      throw error;
    }
  }

  /**
   * Update farmer
   */
  static async updateFarmer(id: number, updateData: UpdateFarmerRequest): Promise<Farmer | null> {
    try {
      // Basic validation
      if (updateData.name !== undefined && updateData.name.trim().length === 0) {
        throw new Error('Farmer name cannot be empty');
      }

      if (updateData.province_id !== undefined && updateData.province_id <= 0) {
        throw new Error('Valid province ID is required');
      }

      // Check if email is already in use by another farmer (if email is being updated)
      if (updateData.email) {
        const existingFarmer = await FarmerModel.findByEmail(updateData.email);
        if (existingFarmer && existingFarmer.id !== id) {
          throw new Error('Email address is already in use by another farmer');
        }
      }

      return await FarmerModel.update(id, updateData);
    } catch (error) {
      console.error('Error in FarmerService.updateFarmer:', error);
      throw error;
    }
  }

  /**
   * Delete farmer
   */
  static async deleteFarmer(id: number): Promise<boolean> {
    try {
      // Check if farmer exists
      const farmer = await FarmerModel.findById(id);
      if (!farmer) {
        throw new Error('Farmer not found');
      }

      return await FarmerModel.delete(id);
    } catch (error) {
      console.error('Error in FarmerService.deleteFarmer:', error);
      throw error;
    }
  }
}