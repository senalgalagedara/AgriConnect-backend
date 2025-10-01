import { OrderModel } from '../../order/models/OrderModel';
import { PaymentRequest, PaymentResponse, InvoiceInfo } from '../../../types/entities';

export class PaymentService {
  /**
   * Process payment for an order
   */
  static async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate request
      if (!request.orderId || request.orderId <= 0) {
        throw new Error('Valid order ID is required');
      }

      if (!request.method || !['COD', 'CARD'].includes(request.method)) {
        throw new Error('Payment method must be COD or CARD');
      }

      // Validate card number for CARD payments
      let cardLast4: string | undefined;
      if (request.method === 'CARD') {
        const cleanedCard = (request.cardNumber ?? '').replace(/[\s-]/g, '');
        if (!cleanedCard || cleanedCard.length < 13 || cleanedCard.length > 19) {
          throw new Error('Valid card number is required for card payments');
        }
        if (!/^\d+$/.test(cleanedCard)) {
          throw new Error('Card number must contain only digits');
        }
        if (!this.isValidCardNumber(cleanedCard)) {
          throw new Error('Invalid card number');
        }
        cardLast4 = cleanedCard.slice(-4);
      }

      // Mark order as paid
      const payment = await OrderModel.markPaid(request.orderId, request.method, cardLast4);

      // Get the full order details
      const orderWithItems = await OrderModel.getOrderWithItems(request.orderId);

      if (!orderWithItems) {
        throw new Error('Order not found after payment processing');
      }

      const { order, items } = orderWithItems;

      // Create invoice information
      const invoice: InvoiceInfo = {
        orderId: order.order_no || order.id,
        total: order.total,
        customerName: `${order.contact.firstName || ''} ${order.contact.lastName || ''}`.trim(),
        email: order.contact.email,
        createdAt: order.created_at,
        method: request.method === 'CARD' ? 'Credit Card' : 'Cash on Delivery',
      };

      return {
        order,
        items,
        payment,
        invoice,
      };
    } catch (error) {
      console.error('Error in PaymentService.processPayment:', error);
      throw error instanceof Error ? error : new Error('Failed to process payment');
    }
  }

  /**
   * Validate payment method
   */
  static isValidPaymentMethod(method: string): method is 'COD' | 'CARD' {
    return ['COD', 'CARD'].includes(method);
  }

  /**
   * Validate card number format with Luhn check
   * - strips spaces/dashes
   * - ensures 13–19 digits
   * - runs Luhn algorithm
   */
  static isValidCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = Number(cleaned[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  /**
   * Get masked card number
   */
  static getMaskedCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (cleaned.length < 4) return '****';

    const last4 = cleaned.slice(-4);
    const masked = '*'.repeat(Math.max(0, cleaned.length - 4));

    return masked + last4;
  }
}
