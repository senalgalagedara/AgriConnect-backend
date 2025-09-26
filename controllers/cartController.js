// controllers/cartController.js
const Cart = require('../models/Cart');

exports.getCart = async (req, res, next) => {
  try {
    const data = await Cart.getCartWithItems(req.params.userId);
    res.json(data);
  } catch (e) { next(e); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    const data = await Cart.addItem(req.params.userId, productId, qty || 1);
    res.status(201).json(data);
  } catch (e) { next(e); }
};

exports.updateQty = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const data = await Cart.updateQty(req.params.userId, req.params.itemId, Number(qty));
    res.json(data);
  } catch (e) { next(e); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const data = await Cart.removeItem(req.params.userId, req.params.itemId);
    res.json(data);
  } catch (e) { next(e); }
};
