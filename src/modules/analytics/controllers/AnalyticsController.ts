import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await AnalyticsService.getAnalytics();

    res.status(200).json({
      data: analytics
    });
  } catch (error) {
    console.error('Error in AnalyticsController.getAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
