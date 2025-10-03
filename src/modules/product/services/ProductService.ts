import { ProductModel } from '../models/ProductModel';
import { Product, CreateProductRequest, UpdateProductRequest, PaginationOptions } from '../../..';

export class ProductService {

  /**
   * Get all products with filtering and pagination
   */
  static async getAllProducts(
    filters?: {
      status?: string;
      category?: string;
      province_id?: number;
      search?: string;
    },
    pagination?: PaginationOptions
  ): Promise<{ products: Product[], total: number, pages?: number }> {
    try {
      const result = await ProductModel.findAll(filters, pagination);
      
      let pages: number | undefined;
      if (pagination?.limit) {
        pages = Math.ceil(result.total / pagination.limit);
      }
      
      return {
        ...result,
        pages
      };
    } catch (error) {
      console.error('Error in ProductService.getAllProducts:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: number): Promise<Product | null> {
    try {
      return await ProductModel.findById(id);
    } catch (error) {
      console.error('Error in ProductService.getProductById:', error);
      throw error;
    }
  }

  /**
   * Get products by province
   */
  static async getProductsByProvince(provinceId: number): Promise<Product[]> {
    try {
      return await ProductModel.findByProvinceId(provinceId);
    } catch (error) {
      console.error('Error in ProductService.getProductsByProvince:', error);
      throw error;
    }
  }

  /**
   * Create new product
   */
  static async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      // Basic validation
      if (!productData.name || productData.name.trim().length === 0) {
        throw new Error('Product name is required');
      }

      if (!productData.province_id || productData.province_id <= 0) {
        throw new Error('Valid province ID is required');
      }

      if (productData.final_price !== undefined && productData.final_price < 0) {
        throw new Error('Final price cannot be negative');
      }

      if (productData.daily_limit !== undefined && productData.daily_limit < 0) {
        throw new Error('Daily limit cannot be negative');
      }

      return await ProductModel.create(productData);
    } catch (error) {
      console.error('Error in ProductService.createProduct:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  static async updateProduct(id: number, updateData: UpdateProductRequest): Promise<Product | null> {
    try {
      // Basic validation
      if (updateData.name !== undefined && updateData.name.trim().length === 0) {
        throw new Error('Product name cannot be empty');
      }

      if (updateData.final_price !== undefined && updateData.final_price < 0) {
        throw new Error('Final price cannot be negative');
      }

      if (updateData.daily_limit !== undefined && updateData.daily_limit < 0) {
        throw new Error('Daily limit cannot be negative');
      }

      if (updateData.current_stock !== undefined && updateData.current_stock < 0) {
        throw new Error('Current stock cannot be negative');
      }

      return await ProductModel.update(id, updateData);
    } catch (error) {
      console.error('Error in ProductService.updateProduct:', error);
      throw error;
    }
  }

  /**
   * Update product stock
   */
  static async updateProductStock(id: number, stockChange: number): Promise<Product | null> {
    try {
      if (stockChange === 0) {
        throw new Error('Stock change cannot be zero');
      }

      // Get current product to validate stock change
      const currentProduct = await ProductModel.findById(id);
      if (!currentProduct) {
        throw new Error('Product not found');
      }

      const newStock = currentProduct.current_stock + stockChange;
      if (newStock < 0) {
        throw new Error('Insufficient stock for this operation');
      }

      return await ProductModel.updateStock(id, stockChange);
    } catch (error) {
      console.error('Error in ProductService.updateProductStock:', error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: number): Promise<boolean> {
    try {
      return await ProductModel.delete(id);
    } catch (error) {
      console.error('Error in ProductService.deleteProduct:', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(): Promise<Product[]> {
    try {
      return await ProductModel.findLowStock();
    } catch (error) {
      console.error('Error in ProductService.getLowStockProducts:', error);
      throw error;
    }
  }

  /**
   * Check product availability
   */
  static async checkProductAvailability(id: number): Promise<{
    available: boolean;
    current_stock: number;
    daily_limit: number;
    status: string;
  } | null> {
    try {
      return await ProductModel.checkAvailability(id);
    } catch (error) {
      console.error('Error in ProductService.checkProductAvailability:', error);
      throw error;
    }
  }
}