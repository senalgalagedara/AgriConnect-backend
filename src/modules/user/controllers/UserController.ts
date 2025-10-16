import { Request, Response } from 'express';
import { UserModel } from '../models/UserModel';
import { ApiResponse } from '../../../types/database';
import bcrypt from 'bcryptjs';

export class UserController {
  /**
   * Create a new user
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      // Convert camelCase to snake_case for compatibility with frontend
      let { email, password, role, first_name, last_name, contact_number, address, status } = req.body;
      
      // Handle camelCase from frontend
      if (!first_name && req.body.firstName) first_name = req.body.firstName;
      if (!last_name && req.body.lastName) last_name = req.body.lastName;
      if (!contact_number && req.body.contactNumber) contact_number = req.body.contactNumber;
      // Also handle 'phone' field from frontend
      if (!contact_number && req.body.phone) contact_number = req.body.phone;

      // Validate required fields
      if (!email || !password || !role) {
        res.status(400).json({
          success: false,
          message: 'Email, password, and role are required'
        } as ApiResponse);
        return;
      }

      // Validate first_name, last_name, contact_number are not empty
      if (!first_name || first_name.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'First name is required and cannot be empty'
        } as ApiResponse);
        return;
      }

      if (!last_name || last_name.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Last name is required and cannot be empty'
        } as ApiResponse);
        return;
      }

      if (!contact_number || contact_number.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Contact number is required and cannot be empty'
        } as ApiResponse);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format'
        } as ApiResponse);
        return;
      }

      // Validate role
      const validRoles = ['admin', 'consumer', 'farmer', 'supplier', 'driver'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        } as ApiResponse);
        return;
      }

      // Check if email already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Email already exists'
        } as ApiResponse);
        return;
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user with validated fields (no sanitization needed - already validated)
      const user = await UserModel.create({
        email,
        password_hash,
        role,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        contact_number: contact_number.trim(),
        address: address?.trim() || null,
        status: status || 'active'
      });

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in UserController.createUser:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        role: req.query.role as string,
        status: req.query.status as string,
        search: req.query.search as string
      };

      const users = await UserModel.findAll(filters);

      res.status(200).json({
        success: true,
        data: users,
        message: 'Users retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in UserController.getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        } as ApiResponse);
        return;
      }

      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in UserController.getUserById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        } as ApiResponse);
        return;
      }

      const updateData = req.body;

      // Convert camelCase to snake_case for compatibility with frontend
      if ('firstName' in updateData) {
        updateData.first_name = updateData.firstName;
        delete updateData.firstName;
      }
      if ('lastName' in updateData) {
        updateData.last_name = updateData.lastName;
        delete updateData.lastName;
      }
      if ('contactNumber' in updateData) {
        updateData.contact_number = updateData.contactNumber;
        delete updateData.contactNumber;
      }
      // Also handle 'phone' field from frontend
      if ('phone' in updateData) {
        updateData.contact_number = updateData.phone;
        delete updateData.phone;
      }

      // Validate that first_name, last_name, contact_number are not empty if provided
      if ('first_name' in updateData) {
        if (!updateData.first_name || updateData.first_name.trim() === '') {
          res.status(400).json({
            success: false,
            message: 'First name cannot be empty'
          } as ApiResponse);
          return;
        }
        updateData.first_name = updateData.first_name.trim();
      }

      if ('last_name' in updateData) {
        if (!updateData.last_name || updateData.last_name.trim() === '') {
          res.status(400).json({
            success: false,
            message: 'Last name cannot be empty'
          } as ApiResponse);
          return;
        }
        updateData.last_name = updateData.last_name.trim();
      }

      if ('contact_number' in updateData) {
        if (!updateData.contact_number || updateData.contact_number.trim() === '') {
          res.status(400).json({
            success: false,
            message: 'Contact number cannot be empty'
          } as ApiResponse);
          return;
        }
        updateData.contact_number = updateData.contact_number.trim();
      }

      // Trim address if provided (address can be optional)
      if ('address' in updateData && updateData.address) {
        updateData.address = updateData.address.trim();
      }

      // Check if user exists
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      // If email is being updated, check it's not already taken
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await UserModel.findByEmail(updateData.email);
        if (emailExists) {
          res.status(409).json({
            success: false,
            message: 'Email already in use'
          } as ApiResponse);
          return;
        }
      }

      const user = await UserModel.update(id, updateData);

      res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in UserController.updateUser:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Delete user (hard delete)
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        } as ApiResponse);
        return;
      }

      // Check if user exists
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      const deleted = await UserModel.delete(id);

      if (!deleted) {
        res.status(500).json({
          success: false,
          message: 'Failed to delete user'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in UserController.deleteUser:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Soft delete user (set status to inactive)
   */
  static async softDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        } as ApiResponse);
        return;
      }

      // Check if user exists
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      const deleted = await UserModel.softDelete(id);

      if (!deleted) {
        res.status(500).json({
          success: false,
          message: 'Failed to deactivate user'
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in UserController.softDeleteUser:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate user',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const countByRole = await UserModel.getCountByRole();

      res.status(200).json({
        success: true,
        data: {
          byRole: countByRole,
          total: countByRole.reduce((sum, item) => sum + item.count, 0)
        },
        message: 'User statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      console.error('Error in UserController.getUserStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse);
    }
  }
}

export default UserController;
