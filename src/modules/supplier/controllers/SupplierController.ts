import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { SupplierService } from '../services/SupplierService';
import { ApiResponse, CreateSupplierRequest, UpdateSupplierRequest, PaginationOptions, PaginatedResponse } from '../../../types';

export class SupplierController {

  static async getAllSuppliers(req: Request, res: Response): Promise<void> {
    try {
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

      const filters: {
        farmer_id?: number;
        product_id?: number;
        status?: string;
        search?: string;
      } = {};

      if (req.query.farmer_id) {
        filters.farmer_id = parseInt(req.query.farmer_id as string);
      }

      if (req.query.product_id) {
        filters.product_id = parseInt(req.query.product_id as string);
      }

      if (req.query.status) {
        filters.status = req.query.status as string;
      }

      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const result = await SupplierService.getAllSuppliers(filters, pagination);

      const response: PaginatedResponse<any> = {
        success: true,
        data: result.suppliers,
        message: 'Supplier records retrieved successfully',
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          pages: result.pages || 0
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in SupplierController.getAllSuppliers:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving supplier records',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  static async getSupplierById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid supplier ID'
        };
        res.status(400).json(response);
        return;
      }

      const supplier = await SupplierService.getSupplierById(id);

      if (!supplier) {
        const response: ApiResponse = {
          success: false,
          message: 'Supplier record not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: supplier,
        message: 'Supplier record retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in SupplierController.getSupplierById:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving supplier record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  static async getSuppliersByFarmer(req: Request, res: Response): Promise<void> {
    try {
      const farmerId = parseInt(req.params.farmerId);
      
      if (isNaN(farmerId)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid farmer ID'
        };
        res.status(400).json(response);
        return;
      }

      const suppliers = await SupplierService.getSuppliersByFarmer(farmerId);

      const response: ApiResponse = {
        success: true,
        data: suppliers,
        message: `Supplier records for farmer ${farmerId} retrieved successfully`
      };
      res.json(response);
    } catch (error) {
      console.error('Error in SupplierController.getSuppliersByFarmer:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving supplier records by farmer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  static async getSuppliersByProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.productId);
      
      if (isNaN(productId)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid product ID'
        };
        res.status(400).json(response);
        return;
      }

      const suppliers = await SupplierService.getSuppliersByProduct(productId);

      const response: ApiResponse = {
        success: true,
        data: suppliers,
        message: `Supplier records for product ${productId} retrieved successfully`
      };
      res.json(response);
    } catch (error) {
      console.error('Error in SupplierController.getSuppliersByProduct:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving supplier records by product',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  static async createSupplier(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: 'value' in err ? err.path || 'unknown' : 'unknown',
            message: err.msg || 'Validation error'
          }))
        };
        res.status(400).json(response);
        return;
      }

      const supplierData: CreateSupplierRequest = {
        farmer_id: req.body.farmer_id,
        product_id: req.body.product_id,
        quantity: req.body.quantity,
        price_per_unit: req.body.price_per_unit,
        supply_date: req.body.supply_date,
        notes: req.body.notes,
        status: req.body.status
      };

      const newSupplier = await SupplierService.createSupplier(supplierData);

      const response: ApiResponse = {
        success: true,
        data: newSupplier,
        message: 'Supplier record created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Error in SupplierController.createSupplier:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error creating supplier record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  static async updateSupplier(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: 'value' in err ? err.path || 'unknown' : 'unknown',
            message: err.msg || 'Validation error'
          }))
        };
        res.status(400).json(response);
        return;
      }

      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid supplier ID'
        };
        res.status(400).json(response);
        return;
      }

      const updateData: UpdateSupplierRequest = {};
      
      if (req.body.farmer_id !== undefined) updateData.farmer_id = req.body.farmer_id;
      if (req.body.product_id !== undefined) updateData.product_id = req.body.product_id;
      if (req.body.quantity !== undefined) updateData.quantity = req.body.quantity;
      if (req.body.price_per_unit !== undefined) updateData.price_per_unit = req.body.price_per_unit;
      if (req.body.supply_date !== undefined) updateData.supply_date = req.body.supply_date;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      if (req.body.status !== undefined) updateData.status = req.body.status;

      const updatedSupplier = await SupplierService.updateSupplier(id, updateData);

      if (!updatedSupplier) {
        const response: ApiResponse = {
          success: false,
          message: 'Supplier record not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: updatedSupplier,
        message: 'Supplier record updated successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in SupplierController.updateSupplier:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error updating supplier record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  static async deleteSupplier(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid supplier ID'
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await SupplierService.deleteSupplier(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Supplier record not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Supplier record deleted successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in SupplierController.deleteSupplier:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error deleting supplier record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }
}