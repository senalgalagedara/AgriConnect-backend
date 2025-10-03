import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ProductService } from '../services/ProductService';
import { ApiResponse, CreateProductRequest, UpdateProductRequest, PaginationOptions } from '../../..';

export class ProductController {

  /**
   * Get all products with filtering and pagination
   */
  static async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      // Extract pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sortBy = req.query.sortBy as string || 'created_at';
      const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const pagination: PaginationOptions = {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        sortBy,
        sortOrder
      };

      // Extract filter parameters
      const filters: {
        status?: string;
        category?: string;
        province_id?: number;
        farmer_id?: number;
        search?: string;
      } = {};
      
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.province_id) filters.province_id = parseInt(req.query.province_id as string);
      if (req.query.farmer_id) filters.farmer_id = parseInt(req.query.farmer_id as string);
      if (req.query.search) filters.search = req.query.search as string;

      const result = await ProductService.getAllProducts(filters, pagination);

      const response: ApiResponse = {
        success: true,
        data: result.products,
        message: 'Products retrieved successfully',
      };

      // Add pagination info to response
      if (result.pages) {
        (response as any).pagination = {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          pages: result.pages
        };
      }

      res.json(response);
    } catch (error) {
      console.error('Error in ProductController.getAllProducts:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving products',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get products by province
   */
  static async getProductsByProvince(req: Request, res: Response): Promise<void> {
    try {
      const provinceId = parseInt(req.params.provinceId);
      
      if (isNaN(provinceId)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid province ID'
        };
        res.status(400).json(response);
        return;
      }

      const products = await ProductService.getProductsByProvince(provinceId);

      const response: ApiResponse = {
        success: true,
        data: products,
        message: 'Products retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProductController.getProductsByProvince:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving products by province',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid product ID'
        };
        res.status(400).json(response);
        return;
      }

      const product = await ProductService.getProductById(id);
      
      if (!product) {
        const response: ApiResponse = {
          success: false,
          message: 'Product not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProductController.getProductById:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving product',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create new product
   */
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
          }))
        };
        res.status(400).json(response);
        return;
      }

      const productData: CreateProductRequest = req.body;
      const product = await ProductService.createProduct(productData);

      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Error in ProductController.createProduct:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error creating product',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(400).json(response);
    }
  }

  /**
   * Update product
   */
  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid product ID'
        };
        res.status(400).json(response);
        return;
      }

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
          }))
        };
        res.status(400).json(response);
        return;
      }

      const updateData: UpdateProductRequest = req.body;
      const product = await ProductService.updateProduct(id, updateData);

      if (!product) {
        const response: ApiResponse = {
          success: false,
          message: 'Product not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product updated successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProductController.updateProduct:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error updating product',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(400).json(response);
    }
  }

  /**
   * Update product stock
   */
  static async updateProductStock(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { stockChange } = req.body;
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid product ID'
        };
        res.status(400).json(response);
        return;
      }

      if (typeof stockChange !== 'number' || stockChange === 0) {
        const response: ApiResponse = {
          success: false,
          message: 'Stock change must be a non-zero number'
        };
        res.status(400).json(response);
        return;
      }

      const product = await ProductService.updateProductStock(id, stockChange);

      if (!product) {
        const response: ApiResponse = {
          success: false,
          message: 'Product not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product stock updated successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProductController.updateProductStock:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error updating product stock',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(400).json(response);
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid product ID'
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await ProductService.deleteProduct(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Product not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Product deleted successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProductController.deleteProduct:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error deleting product',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get products with low stock
   */
  static async getLowStockProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = await ProductService.getLowStockProducts();

      const response: ApiResponse = {
        success: true,
        data: products,
        message: 'Low stock products retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProductController.getLowStockProducts:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving low stock products',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Check product availability
   */
  static async checkProductAvailability(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const quantity = parseInt(req.query.quantity as string) || 1;
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid product ID'
        };
        res.status(400).json(response);
        return;
      }

      const availability = await ProductService.checkProductAvailability(id);

      const response: ApiResponse = {
        success: true,
        data: availability,
        message: 'Product availability checked successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProductController.checkProductAvailability:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error checking product availability',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }
}