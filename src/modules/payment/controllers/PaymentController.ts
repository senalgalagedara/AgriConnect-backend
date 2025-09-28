import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { PaymentRequest, PaymentResponse } from '../../../types/entities';
import { ApiResponse } from '../../../types/database';

/**
 * Process payment for an order
 */
export const processPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, method, cardNumber }: PaymentRequest = req.body;

    // Validate required fields
    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'Order ID is required'
      } as ApiResponse);
      return;
    }

    if (!method) {
      res.status(400).json({
        success: false,
        message: 'Payment method is required'
      } as ApiResponse);
      return;
    }

    if (!PaymentService.isValidPaymentMethod(method)) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be COD or CARD'
      } as ApiResponse);
      return;
    }

    // Additional validation for card payments
    if (method === 'CARD') {
      if (!cardNumber) {
        res.status(400).json({
          success: false,
          message: 'Card number is required for card payments'
        } as ApiResponse);
        return;
      }

      if (!PaymentService.isValidCardNumber(cardNumber)) {
        res.status(400).json({
          success: false,
          message: 'Invalid card number format'
        } as ApiResponse);
        return;
      }
    }

    const paymentResult = await PaymentService.processPayment({ orderId, method, cardNumber });

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: paymentResult
    } as ApiResponse<PaymentResponse>);
  } catch (error) {
    console.error('Error in PaymentController.processPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Get payment methods (for frontend)
 */
export const getPaymentMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentMethods = [
      {
        code: 'COD',
        name: 'Cash on Delivery',
        description: 'Pay when your order is delivered',
        requiresCard: false
      },
      {
        code: 'CARD',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your card',
        requiresCard: true
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Payment methods retrieved successfully',
      data: paymentMethods
    } as ApiResponse);
  } catch (error) {
    console.error('Error in PaymentController.getPaymentMethods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment methods',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

/**
 * Validate card number (utility endpoint)
 */
export const validateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardNumber } = req.body;

    if (!cardNumber) {
      res.status(400).json({
        success: false,
        message: 'Card number is required'
      } as ApiResponse);
      return;
    }

    const isValid = PaymentService.isValidCardNumber(cardNumber);
    const maskedNumber = isValid ? PaymentService.getMaskedCardNumber(cardNumber) : null;

    res.status(200).json({
      success: true,
      message: 'Card validation completed',
      data: {
        valid: isValid,
        maskedNumber
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Error in PaymentController.validateCard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate card',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};