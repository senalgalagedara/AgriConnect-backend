// controllers/orderController.js
const Order = require('../models/Order');

exports.checkout = async (req, res, next) => {
  try {
    const { userId, contact, shipping } = req.body;
    const order = await Order.createFromCart(userId, contact, shipping);
    const full = await Order.getOrderFull(order.id);
    res.status(201).json(full);
  } catch (e) { next(e); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const full = await Order.getOrderFull(req.params.orderId);
    if (!full) return res.status(404).json({ message: 'Order not found' });
    res.json(full);
  } catch (e) { next(e); }
};
