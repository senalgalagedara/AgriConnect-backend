import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { FarmerService } from '../services/FarmerService';
import { ApiResponse, CreateFarmerRequest, UpdateFarmerRequest, PaginationOptions, PaginatedResponse } from '../../..';

export class FarmerController {

  /**
   * Get all farmers with filtering and pagination
   */
  static async getAllFarmers(req: Request, res: Response): Promise<void> {
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
        province_id?: number;
        search?: string;
      } = {};

      if (req.query.province_id) {
        filters.province_id = parseInt(req.query.province_id as string);
      }

      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const result = await FarmerService.getAllFarmers(filters, pagination);

      const response: PaginatedResponse<any> = {
        success: true,
        data: result.farmers,
        message: 'Farmers retrieved successfully',
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          pages: result.pages || 0
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in FarmerController.getAllFarmers:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving farmers',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get farmer by ID
   */
  static async getFarmerById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid farmer ID'
        };
        res.status(400).json(response);
        return;
      }

      const farmer = await FarmerService.getFarmerById(id);

      if (!farmer) {
        const response: ApiResponse = {
          success: false,
          message: 'Farmer not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: farmer,
        message: 'Farmer retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FarmerController.getFarmerById:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving farmer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get farmers by province
   */
  static async getFarmersByProvince(req: Request, res: Response): Promise<void> {
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

      const farmers = await FarmerService.getFarmersByProvince(provinceId);

      const response: ApiResponse = {
        success: true,
        data: farmers,
        message: `Farmers from province ${provinceId} retrieved successfully`
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FarmerController.getFarmersByProvince:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving farmers by province',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create new farmer
   */
  static async createFarmer(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
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

      const farmerData: CreateFarmerRequest = {
        name: req.body.name,
        contact_number: req.body.contact_number,
        email: req.body.email,
        address: req.body.address,
        province_id: req.body.province_id,
        registration_number: req.body.registration_number
      };

      const newFarmer = await FarmerService.createFarmer(farmerData);

      const response: ApiResponse = {
        success: true,
        data: newFarmer,
        message: 'Farmer created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Error in FarmerController.createFarmer:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error creating farmer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Update farmer
   */
  static async updateFarmer(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
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
          message: 'Invalid farmer ID'
        };
        res.status(400).json(response);
        return;
      }

      const updateData: UpdateFarmerRequest = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.contact_number !== undefined) updateData.contact_number = req.body.contact_number;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.address !== undefined) updateData.address = req.body.address;
      if (req.body.province_id !== undefined) updateData.province_id = req.body.province_id;
      if (req.body.registration_number !== undefined) updateData.registration_number = req.body.registration_number;

      const updatedFarmer = await FarmerService.updateFarmer(id, updateData);

      if (!updatedFarmer) {
        const response: ApiResponse = {
          success: false,
          message: 'Farmer not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: updatedFarmer,
        message: 'Farmer updated successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FarmerController.updateFarmer:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error updating farmer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Delete farmer
   */
  static async deleteFarmer(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid farmer ID'
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await FarmerService.deleteFarmer(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Farmer not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Farmer deleted successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in FarmerController.deleteFarmer:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error deleting farmer',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }
}