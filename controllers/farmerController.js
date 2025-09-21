const Farmer = require('../models/Farmer');
const { validationResult } = require('express-validator');

class FarmerController {
  // Get all farmers
  static async getAllFarmers(req, res) {
    try {
      const farmers = await Farmer.findAll();
      res.json({
        success: true,
        data: farmers,
        message: 'Farmers retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching farmers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching farmers',
        error: error.message
      });
    }
  }

  // Get farmers by province
  static async getFarmersByProvince(req, res) {
    try {
      const { provinceId } = req.params;
      const farmers = await Farmer.findByProvinceId(provinceId);
      
      res.json({
        success: true,
        data: farmers,
        message: 'Farmers retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching farmers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching farmers',
        error: error.message
      });
    }
  }

  // Get farmer by ID
  static async getFarmerById(req, res) {
    try {
      const { id } = req.params;
      const farmer = await Farmer.findById(id);
      
      if (!farmer) {
        return res.status(404).json({
          success: false,
          message: 'Farmer not found'
        });
      }

      res.json({
        success: true,
        data: farmer,
        message: 'Farmer retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching farmer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching farmer',
        error: error.message
      });
    }
  }

  // Create new farmer
  static async createFarmer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const farmer = await Farmer.create(req.body);
      res.status(201).json({
        success: true,
        data: farmer,
        message: 'Farmer created successfully'
      });
    } catch (error) {
      console.error('Error creating farmer:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Farmer with this registration number already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error creating farmer',
        error: error.message
      });
    }
  }

  // Update farmer
  static async updateFarmer(req, res) {
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
      const farmer = await Farmer.update(id, req.body);
      
      if (!farmer) {
        return res.status(404).json({
          success: false,
          message: 'Farmer not found'
        });
      }

      res.json({
        success: true,
        data: farmer,
        message: 'Farmer updated successfully'
      });
    } catch (error) {
      console.error('Error updating farmer:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Farmer with this registration number already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error updating farmer',
        error: error.message
      });
    }
  }

  // Delete farmer
  static async deleteFarmer(req, res) {
    try {
      const { id } = req.params;
      const farmer = await Farmer.delete(id);
      
      if (!farmer) {
        return res.status(404).json({
          success: false,
          message: 'Farmer not found'
        });
      }

      res.json({
        success: true,
        data: farmer,
        message: 'Farmer deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting farmer:', error);
      
      // Handle foreign key constraint violation
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete farmer. They have active supplies.'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error deleting farmer',
        error: error.message
      });
    }
  }

  // Get farmer supplies
  static async getFarmerSupplies(req, res) {
    try {
      const { id } = req.params;
      const supplies = await Farmer.getSupplies(id);
      
      res.json({
        success: true,
        data: supplies,
        message: 'Farmer supplies retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching farmer supplies:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching farmer supplies',
        error: error.message
      });
    }
  }

  // Search farmers
  static async searchFarmers(req, res) {
    try {
      const { q, provinceId } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const farmers = await Farmer.search(q, provinceId);
      
      res.json({
        success: true,
        data: farmers,
        message: 'Farmer search completed successfully'
      });
    } catch (error) {
      console.error('Error searching farmers:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching farmers',
        error: error.message
      });
    }
  }
}

module.exports = FarmerController;