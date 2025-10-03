import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ProvinceService } from '../services/ProvinceService';
import { ApiResponse, CreateProvinceRequest, UpdateProvinceRequest } from '../../..';

export class ProvinceController {

  /**
   * Get all provinces
   */
  static async getAllProvinces(req: Request, res: Response): Promise<void> {
    try {
      const provinces = await ProvinceService.getAllProvinces();
      
      const response: ApiResponse = {
        success: true,
        data: provinces,
        message: 'Provinces retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProvinceController.getAllProvinces:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error fetching provinces',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get province by ID
   */
  static async getProvinceById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid province ID'
        };
        res.status(400).json(response);
        return;
      }

      const province = await ProvinceService.getProvinceById(id);
      
      if (!province) {
        const response: ApiResponse = {
          success: false,
          message: 'Province not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: province,
        message: 'Province retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProvinceController.getProvinceById:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error fetching province',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create new province
   */
  static async createProvince(req: Request, res: Response): Promise<void> {
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

      const provinceData: CreateProvinceRequest = req.body;
      const province = await ProvinceService.createProvince(provinceData);

      const response: ApiResponse = {
        success: true,
        data: province,
        message: 'Province created successfully'
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Error in ProvinceController.createProvince:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error creating province',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(400).json(response);
    }
  }

  /**
   * Update province
   */
  static async updateProvince(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid province ID'
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

      const updateData: UpdateProvinceRequest = req.body;
      const province = await ProvinceService.updateProvince(id, updateData);

      if (!province) {
        const response: ApiResponse = {
          success: false,
          message: 'Province not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: province,
        message: 'Province updated successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProvinceController.updateProvince:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error updating province',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(400).json(response);
    }
  }

  /**
   * Delete province
   */
  static async deleteProvince(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid province ID'
        };
        res.status(400).json(response);
        return;
      }

      const deleted = await ProvinceService.deleteProvince(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Province not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Province deleted successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProvinceController.deleteProvince:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error deleting province',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get province statistics
   */
  static async getProvinceStatistics(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid province ID'
        };
        res.status(400).json(response);
        return;
      }

      const statistics = await ProvinceService.getProvinceStatistics(id);

      if (!statistics) {
        const response: ApiResponse = {
          success: false,
          message: 'Province not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: statistics,
        message: 'Province statistics retrieved successfully'
      };
      res.json(response);
    } catch (error) {
      console.error('Error in ProvinceController.getProvinceStatistics:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Error retrieving province statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }
}