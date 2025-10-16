import { OrderModel } from '../../order/models/OrderModel';
import { PaymentRequest, PaymentResponse, InvoiceInfo } from '../../../types/entities';
import { NotificationService } from '../../product/services/NotificationService';

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

      // 1) Mark order as paid (DB returns snake_case fields)
      const paymentRaw = await OrderModel.markPaid(request.orderId, request.method, cardLast4);

      // 2) Normalize DB row → app Payment object (camelCase + status mapping)
      //    Using `any` here prevents TS from complaining if your app Payment type
      //    differs slightly (keys/unions). Adjust keys below to your exact interface if needed.
      const payment: any = {
        id: paymentRaw.id,
        orderId: paymentRaw.order_id,
        amount: Number(paymentRaw.amount),
        method: paymentRaw.method, // 'COD' | 'CARD'
        cardLast4: paymentRaw.card_last4 ?? undefined,
        // Map DB status to app status
        status: paymentRaw.status === 'succeeded' ? 'paid' : 'pending',
        createdAt:
          typeof paymentRaw.created_at === 'string'
            ? paymentRaw.created_at
            : new Date().toISOString(),
        updatedAt:
          typeof paymentRaw.created_at === 'string'
            ? paymentRaw.created_at
            : new Date().toISOString(),
      };

      // 3) Load full order + items
      const orderWithItems = await OrderModel.getOrderWithItems(request.orderId);
      if (!orderWithItems) {
        throw new Error('Order not found after payment processing');
      }
      const { order, items } = orderWithItems;

      // 4) Build invoice
      const invoice: InvoiceInfo = {
        orderId: (order as any).order_no || order.id,
        total: (order as any).total,
        customerName: `${(order as any).contact?.firstName || ''} ${(order as any).contact?.lastName || ''}`.trim(),
        email: (order as any).contact?.email,
        createdAt: (order as any).created_at,
        method: request.method === 'CARD' ? 'Credit Card' : 'Cash on Delivery',
      };

      // 5) Return response
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
   * Delete payment record and create notification
   */
  static async deletePayment(paymentId: number, orderId: number, orderNo: number): Promise<void> {
    try {
      // Create notification for payment deletion
      const message = `💳 Payment record for Order #${orderNo} has been deleted from the system.`;
      await NotificationService.notifyOrderCancelled(orderId, orderNo, 0);
    } catch (error) {
      console.error('Error in PaymentService.deletePayment:', error);
      // Don't throw - notification failure shouldn't break deletion
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
