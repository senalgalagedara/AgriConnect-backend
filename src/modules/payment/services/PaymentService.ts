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
        if (!request.cardNumber || request.cardNumber.length < 4) {
          throw new Error('Valid card number is required for card payments');
        }
        
        // Simple validation - in real app you'd use proper card validation
        if (!/^\d+$/.test(request.cardNumber)) {
          throw new Error('Card number must contain only digits');
        }
        
        cardLast4 = request.cardNumber.slice(-4);
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
        method: request.method === 'CARD' ? 'Credit Card' : 'Cash on Delivery'
      };

      return {
        order,
        items,
        payment,
        invoice
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
   * Validate card number format (basic validation)
   */
  static isValidCardNumber(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleanedNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Check if it's all digits and has reasonable length
    return /^\d{13,19}$/.test(cleanedNumber);
  }

  /**
   * Get masked card number
   */
  static getMaskedCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (cleaned.length < 4) return '****';
    
    const last4 = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4);
    
    return masked + last4;
  }
}