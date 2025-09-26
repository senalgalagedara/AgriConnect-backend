// routes/adminRoutes.js
const express = require('express');
const ctrl = require('../controllers/adminController');
const router = express.Router();

// view-only list
router.get('/transactions', ctrl.listTransactions);

module.exports = router;
