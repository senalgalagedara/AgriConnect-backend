// controllers/paymentController.js
const Order = require('../models/Order');

exports.pay = async (req, res, next) => {
  try {
    const { orderId, method, cardNumber } = req.body; // method: 'COD' | 'CARD'
    if (!['COD', 'CARD'].includes(method)) return res.status(400).json({ message: 'Invalid method' });
    const cardLast4 = method === 'CARD' && cardNumber ? cardNumber.slice(-4) : null;

    const payment = await Order.markPaid(orderId, method, cardLast4);
    const full = await Order.getOrderFull(orderId);

    // This is what your invoice page needs
    res.status(201).json({
      order: full.order,
      items: full.items,
      payment,
      invoice: {
        orderId: full.order.order_no,
        total: full.order.total,
        customerName: `${full.order.contact.firstName || ''} ${full.order.contact.lastName || ''}`.trim(),
        email: full.order.contact.email,
        createdAt: full.order.created_at,
        method: method === 'CARD' ? 'Credit Card' : 'Cash on Delivery',
      },
    });
  } catch (e) { next(e); }
};
