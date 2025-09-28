import { Request, Response } from 'express';
import { DriverService } from '../services/DriverService';
import { CreateDriverRequest, UpdateDriverRequest, Driver } from '../../../types/entities';
import { ApiResponse } from '../../../types/database';

/**
 * Get all drivers
 */
export const getAllDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await DriverService.getAllDrivers();

    res.status(200).json({
      success: true,
      message: 'Drivers retrieved successfully',
      data: drivers
    } as ApiResponse<Driver[]>);
  } catch (error) {
    console.error('Error in DriverController.getAllDrivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve drivers',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get driver by ID
 */
export const getDriverById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (!id || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid driver ID is required'
      } as ApiResponse);
      return;
    }

    const driver = await DriverService.getDriverById(id);

    if (!driver) {
      res.status(404).json({
        success: false,
        message: 'Driver not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Driver retrieved successfully',
      data: driver
    } as ApiResponse<Driver>);
  } catch (error) {
    console.error('Error in DriverController.getDriverById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve driver',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Create new driver
 */
export const createDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const driverData: CreateDriverRequest = req.body;

    const driver = await DriverService.createDriver(driverData);

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver
    } as ApiResponse<Driver>);
  } catch (error) {
    console.error('Error in DriverController.createDriver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create driver',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Update driver
 */
export const updateDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const driverData: UpdateDriverRequest = req.body;

    if (!id || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid driver ID is required'
      } as ApiResponse);
      return;
    }

    const driver = await DriverService.updateDriver(id, driverData);

    if (!driver) {
      res.status(404).json({
        success: false,
        message: 'Driver not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    } as ApiResponse<Driver>);
  } catch (error) {
    console.error('Error in DriverController.updateDriver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Delete driver
 */
export const deleteDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (!id || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid driver ID is required'
      } as ApiResponse);
      return;
    }

    const deleted = await DriverService.deleteDriver(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Driver not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Driver deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error in DriverController.deleteDriver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete driver',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get available drivers
 */
export const getAvailableDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const drivers = await DriverService.getAvailableDrivers();

    res.status(200).json({
      success: true,
      message: 'Available drivers retrieved successfully',
      data: drivers
    } as ApiResponse<Driver[]>);
  } catch (error) {
    console.error('Error in DriverController.getAvailableDrivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available drivers',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Update driver availability status
 */
export const updateDriverAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { availability_status } = req.body;

    if (!id || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid driver ID is required'
      } as ApiResponse);
      return;
    }

    if (!availability_status) {
      res.status(400).json({
        success: false,
        message: 'Availability status is required'
      } as ApiResponse);
      return;
    }

    const driver = await DriverService.updateDriverAvailability(id, availability_status);

    if (!driver) {
      res.status(404).json({
        success: false,
        message: 'Driver not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Driver availability updated successfully',
      data: driver
    } as ApiResponse<Driver>);
  } catch (error) {
    console.error('Error in DriverController.updateDriverAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver availability',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};