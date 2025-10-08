import { SupplierModel } from '../models/SupplierModel';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest, PaginationOptions } from '../../../types';

export class SupplierService {

  static async getAllSuppliers(
    filters?: {
      farmer_id?: number;
      product_id?: number;
      status?: string;
      search?: string;
    },
    pagination?: PaginationOptions
  ): Promise<{ suppliers: Supplier[], total: number, pages?: number }> {
    try {
      const result = await SupplierModel.findAllPaginated(filters, pagination);
      
      let pages: number | undefined;
      if (pagination?.limit) {
        pages = Math.ceil(result.total / pagination.limit);
      }
      
      return {
        ...result,
        pages
      };
    } catch (error) {
      console.error('Error in SupplierService.getAllSuppliers:', error);
      throw error;
    }
  }

  static async getSupplierById(id: number): Promise<Supplier | null> {
    try {
      return await SupplierModel.findById(id);
    } catch (error) {
      console.error('Error in SupplierService.getSupplierById:', error);
      throw error;
    }
  }

  static async getSuppliersByFarmer(farmerId: number): Promise<Supplier[]> {
    try {
      return await SupplierModel.findByFarmerId(farmerId);
    } catch (error) {
      console.error('Error in SupplierService.getSuppliersByFarmer:', error);
      throw error;
    }
  }

  static async getSuppliersByProduct(productId: number): Promise<Supplier[]> {
    try {
      return await SupplierModel.findByProductId(productId);
    } catch (error) {
      console.error('Error in SupplierService.getSuppliersByProduct:', error);
      throw error;
    }
  }

  static async createSupplier(supplierData: CreateSupplierRequest): Promise<Supplier> {
    try {
      if (!supplierData.farmer_id || supplierData.farmer_id <= 0) {
        throw new Error('Valid farmer ID is required');
      }

      if (!supplierData.product_id || supplierData.product_id <= 0) {
        throw new Error('Valid product ID is required');
      }

      if (supplierData.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (supplierData.price_per_unit <= 0) {
        throw new Error('Price per unit must be greater than 0');
      }

      return await SupplierModel.create(supplierData);
    } catch (error) {
      console.error('Error in SupplierService.createSupplier:', error);
      throw error;
    }
  }

  static async updateSupplier(id: number, updateData: UpdateSupplierRequest): Promise<Supplier | null> {
    try {
      if (updateData.farmer_id !== undefined && updateData.farmer_id <= 0) {
        throw new Error('Valid farmer ID is required');
      }

      if (updateData.product_id !== undefined && updateData.product_id <= 0) {
        throw new Error('Valid product ID is required');
      }

      if (updateData.quantity !== undefined && updateData.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (updateData.price_per_unit !== undefined && updateData.price_per_unit <= 0) {
        throw new Error('Price per unit must be greater than 0');
      }

      return await SupplierModel.update(id, updateData);
    } catch (error) {
      console.error('Error in SupplierService.updateSupplier:', error);
      throw error;
    }
  }

  static async deleteSupplier(id: number): Promise<boolean> {
    try {
      const supplier = await SupplierModel.findById(id);
      if (!supplier) {
        throw new Error('Supplier record not found');
      }

      return await SupplierModel.delete(id);
    } catch (error) {
      console.error('Error in SupplierService.deleteSupplier:', error);
      throw error;
    }
  }
}