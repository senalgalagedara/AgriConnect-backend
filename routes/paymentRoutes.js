// routes/paymentRoutes.js
const express = require('express');
const ctrl = require('../controllers/paymentController');
const router = express.Router();

router.post('/pay', ctrl.pay); // body: { orderId, method, cardNumber? }

module.exports = router;
