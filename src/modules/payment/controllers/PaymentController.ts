import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PaymentService } from '../services/PaymentService';
import { PaymentRequest, PaymentResponse } from '../../../types/entities';
import { ApiResponse } from '../../../types/database';

/**
 * Process payment for an order
 */
export const processPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle validation middleware results first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',           // <-- keep error as string to satisfy ApiResponse
        data: { errors: errors.array() },    // <-- put details in data
      } as ApiResponse);
      return;
    }

    // Normalize incoming payload
    const rawBody = req.body ?? {};
    const normalizedCardNumber =
      typeof rawBody.cardNumber === 'string'
        ? rawBody.cardNumber.replace(/[\s-]/g, '')
        : undefined;

    const payload: PaymentRequest = {
      orderId: Number(rawBody.orderId),
      method: rawBody.method,
      cardNumber: normalizedCardNumber,
    };

    // Additional server-side guards (even though we already validated)
    if (!payload.orderId) {
      res.status(400).json({
        success: false,
        message: 'Order ID is required',
      } as ApiResponse);
      return;
    }

    if (!payload.method) {
      res.status(400).json({
        success: false,
        message: 'Payment method is required',
      } as ApiResponse);
      return;
    }

    if (!PaymentService.isValidPaymentMethod(payload.method)) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be COD or CARD',
      } as ApiResponse);
      return;
    }

    if (payload.method === 'CARD') {
      if (!payload.cardNumber) {
        res.status(400).json({
          success: false,
          message: 'Card number is required for card payments',
        } as ApiResponse);
        return;
      }

      if (!PaymentService.isValidCardNumber(payload.cardNumber)) {
        res.status(400).json({
          success: false,
          message: 'Invalid card number',
        } as ApiResponse);
        return;
      }
    }

    const paymentResult = await PaymentService.processPayment(payload);

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: paymentResult,
    } as ApiResponse<PaymentResponse>);
  } catch (error) {
    console.error('Error in PaymentController.processPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
};

/**
 * Get payment methods (for frontend)
 */
export const getPaymentMethods = async (_req: Request, res: Response): Promise<void> => {
  try {
    const paymentMethods = [
      {
        code: 'COD',
        name: 'Cash on Delivery',
        description: 'Pay when your order is delivered',
        requiresCard: false,
      },
      {
        code: 'CARD',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your card',
        requiresCard: true,
      },
    ];

    res.status(200).json({
      success: true,
      message: 'Payment methods retrieved successfully',
      data: paymentMethods,
    } as ApiResponse);
  } catch (error) {
    console.error('Error in PaymentController.getPaymentMethods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment methods',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
};

/**
 * Validate card number (utility endpoint)
 */
export const validateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',           // <-- string
        data: { errors: errors.array() },    // <-- details here
      } as ApiResponse);
      return;
    }

    const { cardNumber: rawCardNumber } = req.body;
    const cardNumber = typeof rawCardNumber === 'string' ? rawCardNumber.replace(/[\s-]/g, '') : '';

    if (!cardNumber) {
      res.status(400).json({
        success: false,
        message: 'Card number is required',
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
        maskedNumber,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error in PaymentController.validateCard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate card',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
};
