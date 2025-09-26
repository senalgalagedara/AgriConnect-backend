// routes/cartRoutes.js
const express = require('express');
const ctrl = require('../controllers/cartController');
const router = express.Router();

// /api/cart/:userId
router.get('/:userId', ctrl.getCart);
router.post('/:userId/items', ctrl.addItem);
router.patch('/:userId/items/:itemId', ctrl.updateQty);
router.delete('/:userId/items/:itemId', ctrl.removeItem);

module.exports = router;
