const Product = require('../models/Product');
const { validationResult } = require('express-validator');

class ProductController {
  // Get products by province
  static async getProductsByProvince(req, res) {
    try {
      const { provinceId } = req.params;
      const products = await Product.findByProvinceId(provinceId);
      
      res.json({
        success: true,
        data: products,
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching products',
        error: error.message
      });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product',
        error: error.message
      });
    }
  }

  // Get product by name and province
  static async getProductByName(req, res) {
    try {
      const { productName } = req.params;
      const { provinceId } = req.query;
      
      if (!provinceId) {
        return res.status(400).json({
          success: false,
          message: 'Province ID is required'
        });
      }

      const product = await Product.findByNameAndProvince(productName, provinceId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in this province'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product',
        error: error.message
      });
    }
  }

  // Create new product
  static async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const product = await Product.create(req.body);
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      console.error('Error creating product:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Product already exists in this province'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
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
      const product = await Product.update(id, req.body);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating product',
        error: error.message
      });
    }
  }

  // Update daily limit
  static async updateDailyLimit(req, res) {
    try {
      const { id } = req.params;
      const { daily_limit } = req.body;
      
      if (!daily_limit || daily_limit < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid daily limit is required'
        });
      }

      const product = await Product.updateDailyLimit(id, daily_limit);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Daily limit updated successfully'
      });
    } catch (error) {
      console.error('Error updating daily limit:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating daily limit',
        error: error.message
      });
    }
  }

  // Delete product
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.delete(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting product',
        error: error.message
      });
    }
  }

  // Get product with suppliers
  static async getProductWithSuppliers(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findWithSuppliers(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product,
        message: 'Product with suppliers retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching product with suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product with suppliers',
        error: error.message
      });
    }
  }

  // Search products
  static async searchProducts(req, res) {
    try {
      const { provinceId } = req.params;
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const products = await Product.search(provinceId, q);
      
      res.json({
        success: true,
        data: products,
        message: 'Products search completed successfully'
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching products',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;