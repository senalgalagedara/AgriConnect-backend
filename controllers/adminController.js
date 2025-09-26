// controllers/adminController.js
const Order = require('../models/Order');

exports.listTransactions = async (req, res, next) => {
  try {
    const { q = '', limit = 50, offset = 0 } = req.query;
    const rows = await Order.listPaidOrders({ q, limit: Number(limit), offset: Number(offset) });
    res.json(rows);
  } catch (e) { next(e); }
};
