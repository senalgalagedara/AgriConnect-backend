import { ProvinceModel } from '../models/ProvinceModel';
import { Province, CreateProvinceRequest, UpdateProvinceRequest, ProvinceStatistics } from '../../..';

export class ProvinceService {

  static async getAllProvinces(): Promise<Province[]> {
    try {
      return await ProvinceModel.findAll();
    } catch (error) {
      console.error('Error in ProvinceService.getAllProvinces:', error);
      throw new Error('Failed to retrieve provinces');
    }
  }

  static async getProvinceById(id: number): Promise<Province | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid province ID');
      }
      
      return await ProvinceModel.findById(id);
    } catch (error) {
      console.error('Error in ProvinceService.getProvinceById:', error);
      throw new Error('Failed to retrieve province');
    }
  }

  static async createProvince(provinceData: CreateProvinceRequest): Promise<Province> {
    try {
      if (!provinceData.name || provinceData.name.trim().length === 0) {
        throw new Error('Province name is required');
      }
      
      if (provinceData.name.length < 2 || provinceData.name.length > 100) {
        throw new Error('Province name must be between 2 and 100 characters');
      }

      if (provinceData.capacity !== undefined && provinceData.capacity < 0) {
        throw new Error('Capacity must be a positive number');
      }

      if (provinceData.location && provinceData.location.length > 200) {
        throw new Error('Location must not exceed 200 characters');
      }

      if (provinceData.manager_name && provinceData.manager_name.length > 100) {
        throw new Error('Manager name must not exceed 100 characters');
      }

      return await ProvinceModel.create(provinceData);
    } catch (error) {
      console.error('Error in ProvinceService.createProvince:', error);
      throw error;
    }
  }

  static async updateProvince(id: number, updateData: UpdateProvinceRequest): Promise<Province | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid province ID');
      }

      const existingProvince = await ProvinceModel.findById(id);
      if (!existingProvince) {
        throw new Error('Province not found');
      }

      if (updateData.name !== undefined) {
        if (!updateData.name || updateData.name.trim().length === 0) {
          throw new Error('Province name is required');
        }
        if (updateData.name.length < 2 || updateData.name.length > 100) {
          throw new Error('Province name must be between 2 and 100 characters');
        }
      }

      if (updateData.capacity !== undefined && updateData.capacity < 0) {
        throw new Error('Capacity must be a positive number');
      }

      if (updateData.location && updateData.location.length > 200) {
        throw new Error('Location must not exceed 200 characters');
      }

      if (updateData.manager_name && updateData.manager_name.length > 100) {
        throw new Error('Manager name must not exceed 100 characters');
      }

      return await ProvinceModel.update(id, updateData);
    } catch (error) {
      console.error('Error in ProvinceService.updateProvince:', error);
      throw error;
    }
  }

  static async deleteProvince(id: number): Promise<boolean> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid province ID');
      }

      const existingProvince = await ProvinceModel.findById(id);
      if (!existingProvince) {
        throw new Error('Province not found');
      }

      const deletedProvince = await ProvinceModel.delete(id);
      return deletedProvince !== null;
    } catch (error) {
      console.error('Error in ProvinceService.deleteProvince:', error);
      throw error;
    }
  }

  static async getProvinceStatistics(id: number): Promise<ProvinceStatistics | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid province ID');
      }

      return await ProvinceModel.getStatistics(id);
    } catch (error) {
      console.error('Error in ProvinceService.getProvinceStatistics:', error);
      throw new Error('Failed to retrieve province statistics');
    }
  }
}