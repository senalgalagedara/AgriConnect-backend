// routes/orderRoutes.js
const express = require('express');
const ctrl = require('../controllers/orderController');
const router = express.Router();

router.post('/checkout', ctrl.checkout);          // body: { userId, contact, shipping }
router.get('/:orderId', ctrl.getOrder);

module.exports = router;
