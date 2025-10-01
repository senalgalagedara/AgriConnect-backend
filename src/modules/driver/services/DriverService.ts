import { DriverModel } from '../models/DriverModel';
import { Driver, CreateDriverRequest, UpdateDriverRequest } from '../../../types/entities';

export class DriverService {
  /**
   * Get all drivers
   */
  static async getAllDrivers(): Promise<Driver[]> {
    try {
      return await DriverModel.findAll();
    } catch (error) {
      console.error('Error in DriverService.getAllDrivers:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve drivers in service');
    }
  }

  /**
   * Get driver by ID
   */
  static async getDriverById(id: number): Promise<Driver | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid driver ID is required');
      }

      return await DriverModel.findById(id);
    } catch (error) {
      console.error('Error in DriverService.getDriverById:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve driver');
    }
  }

  /**
   * Create new driver
   */
  static async createDriver(driverData: CreateDriverRequest): Promise<Driver> {
    try {
      // Validate required fields
      if (!driverData.name || driverData.name.trim().length === 0) {
        throw new Error('Driver name is required');
      }

      if (!driverData.phone_number || driverData.phone_number.trim().length === 0) {
        throw new Error('Phone number is required');
      }

      if (!driverData.location || driverData.location.trim().length === 0) {
        throw new Error('Location is required');
      }

      if (!driverData.vehicle_type || driverData.vehicle_type.trim().length === 0) {
        throw new Error('Vehicle type is required');
      }

      if (!driverData.capacity || driverData.capacity <= 0) {
        throw new Error('Valid capacity is required');
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
      if (!phoneRegex.test(driverData.phone_number)) {
        throw new Error('Invalid phone number format');
      }

      return await DriverModel.create(driverData);
    } catch (error) {
      console.error('Error in DriverService.createDriver:', error);
      throw error instanceof Error ? error : new Error('Failed to create driver');
    }
  }

  /**
   * Update driver
   */
  static async updateDriver(id: number, driverData: UpdateDriverRequest): Promise<Driver | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid driver ID is required');
      }

      // Validate fields if provided
      if (driverData.name !== undefined && driverData.name.trim().length === 0) {
        throw new Error('Driver name cannot be empty');
      }

      if (driverData.phone_number !== undefined && driverData.phone_number.trim().length === 0) {
        throw new Error('Phone number cannot be empty');
      }

      if (driverData.location !== undefined && driverData.location.trim().length === 0) {
        throw new Error('Location cannot be empty');
      }

      if (driverData.vehicle_type !== undefined && driverData.vehicle_type.trim().length === 0) {
        throw new Error('Vehicle type cannot be empty');
      }

      if (driverData.capacity !== undefined && driverData.capacity <= 0) {
        throw new Error('Capacity must be a positive number');
      }

      // Validate phone number format if provided
      if (driverData.phone_number) {
        const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
        if (!phoneRegex.test(driverData.phone_number)) {
          throw new Error('Invalid phone number format');
        }
      }

      return await DriverModel.update(id, driverData);
    } catch (error) {
      console.error('Error in DriverService.updateDriver:', error);
      throw error instanceof Error ? error : new Error('Failed to update driver');
    }
  }

  /**
   * Delete driver
   */
  static async deleteDriver(id: number): Promise<boolean> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid driver ID is required');
      }

      return await DriverModel.delete(id);
    } catch (error) {
      console.error('Error in DriverService.deleteDriver:', error);
      throw error instanceof Error ? error : new Error('Failed to delete driver');
    }
  }

  /**
   * Get available drivers
   */
  static async getAvailableDrivers(): Promise<Driver[]> {
    try {
      return await DriverModel.findAvailable();
    } catch (error) {
      console.error('Error in DriverService.getAvailableDrivers:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve available drivers');
    }
  }

  /**
   * Update driver availability status
   */
  static async updateDriverAvailability(id: number, status: Driver['availability_status']): Promise<Driver | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid driver ID is required');
      }

      if (!status) {
        throw new Error('Availability status is required');
      }

      const validStatuses = ['available', 'busy', 'offline'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid availability status');
      }

      return await DriverModel.updateAvailabilityStatus(id, status);
    } catch (error) {
      console.error('Error in DriverService.updateDriverAvailability:', error);
      throw error instanceof Error ? error : new Error('Failed to update driver availability');
    }
  }
}