const Supplier = require('../models/Supplier');
const { validationResult } = require('express-validator');

class SupplierController {
  // Get all suppliers
  static async getAllSuppliers(req, res) {
    try {
      const suppliers = await Supplier.findAll();
      res.json({
        success: true,
        data: suppliers,
        message: 'Suppliers retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching suppliers',
        error: error.message
      });
    }
  }

  // Get suppliers by product ID
  static async getSuppliersByProduct(req, res) {
    try {
      const { productId } = req.params;
      const suppliers = await Supplier.findByProductId(productId);
      
      res.json({
        success: true,
        data: suppliers,
        message: 'Suppliers retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching suppliers',
        error: error.message
      });
    }
  }

  // Get supplier by ID
  static async getSupplierById(req, res) {
    try {
      const { id } = req.params;
      const supplier = await Supplier.findById(id);
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      res.json({
        success: true,
        data: supplier,
        message: 'Supplier retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching supplier',
        error: error.message
      });
    }
  }

  // Create new supplier entry
  static async createSupplier(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const supplier = await Supplier.create(req.body);
      res.status(201).json({
        success: true,
        data: supplier,
        message: 'Supplier entry created successfully'
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      
      // Handle foreign key constraint violation
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'Invalid farmer ID or product ID'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error creating supplier',
        error: error.message
      });
    }
  }

  // Update supplier entry
  static async updateSupplier(req, res) {
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
      const supplier = await Supplier.update(id, req.body);
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      res.json({
        success: true,
        data: supplier,
        message: 'Supplier updated successfully'
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating supplier',
        error: error.message
      });
    }
  }

  // Delete supplier entry
  static async deleteSupplier(req, res) {
    try {
      const { id } = req.params;
      const supplier = await Supplier.delete(id);
      
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      res.json({
        success: true,
        data: supplier,
        message: 'Supplier deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting supplier',
        error: error.message
      });
    }
  }

  // Get supplier statistics
  static async getSupplierStatistics(req, res) {
    try {
      const { productId, farmerId } = req.query;
      const statistics = await Supplier.getStatistics(productId, farmerId);
      
      res.json({
        success: true,
        data: statistics,
        message: 'Supplier statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching supplier statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching supplier statistics',
        error: error.message
      });
    }
  }

  // Get recent supplies
  static async getRecentSupplies(req, res) {
    try {
      const { limit = 10 } = req.query;
      const supplies = await Supplier.getRecentSupplies(parseInt(limit));
      
      res.json({
        success: true,
        data: supplies,
        message: 'Recent supplies retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching recent supplies:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching recent supplies',
        error: error.message
      });
    }
  }

  // Search suppliers
  static async searchSuppliers(req, res) {
    try {
      const { q, productId } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const suppliers = await Supplier.search(q, productId);
      
      res.json({
        success: true,
        data: suppliers,
        message: 'Supplier search completed successfully'
      });
    } catch (error) {
      console.error('Error searching suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching suppliers',
        error: error.message
      });
    }
  }
}

module.exports = SupplierController;