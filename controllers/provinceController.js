const Province = require('../models/Province');
const { validationResult } = require('express-validator');

class ProvinceController {
  // Get all provinces
  static async getAllProvinces(req, res) {
    try {
      const provinces = await Province.findAll();
      res.json({
        success: true,
        data: provinces,
        message: 'Provinces retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching provinces:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching provinces',
        error: error.message
      });
    }
  }

  // Get province by ID
  static async getProvinceById(req, res) {
    try {
      const { id } = req.params;
      const province = await Province.findById(id);
      
      if (!province) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }

      res.json({
        success: true,
        data: province,
        message: 'Province retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching province:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching province',
        error: error.message
      });
    }
  }

  // Create new province
  static async createProvince(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const province = await Province.create(req.body);
      res.status(201).json({
        success: true,
        data: province,
        message: 'Province created successfully'
      });
    } catch (error) {
      console.error('Error creating province:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Province with this name already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error creating province',
        error: error.message
      });
    }
  }

  // Update province
  static async updateProvince(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const province = await Province.update(id, req.body);
      
      if (!province) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }

      res.json({
        success: true,
        data: province,
        message: 'Province updated successfully'
      });
    } catch (error) {
      console.error('Error updating province:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Province with this name already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error updating province',
        error: error.message
      });
    }
  }

  // Delete province
  static async deleteProvince(req, res) {
    try {
      const { id } = req.params;
      const province = await Province.delete(id);
      
      if (!province) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }

      res.json({
        success: true,
        data: province,
        message: 'Province deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting province:', error);
      
      // Handle foreign key constraint violation
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete province. It has associated products or farmers.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error deleting province',
        error: error.message
      });
    }
  }

  // Get province statistics
  static async getProvinceStatistics(req, res) {
    try {
      const { id } = req.params;
      const statistics = await Province.getStatistics(id);
      
      if (!statistics) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }

      res.json({
        success: true,
        data: statistics,
        message: 'Province statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching province statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching province statistics',
        error: error.message
      });
    }
  }
}

module.exports = ProvinceController;