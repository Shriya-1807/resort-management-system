'use strict';

const express  = require('express');
const { body, param } = require('express-validator');
const router   = express.Router();

const paymentService = require('../services/payment.service');
const { validate }   = require('../middleware/validate');
const { authenticate, requireGuest } = require('../middleware/auth.middleware');

// ── POST /api/payments  –  Record payment after booking ──────
router.post('/',
  authenticate, requireGuest,
  [
    body('booking_id').isInt({ min: 1 }).withMessage('Valid booking_id required'),
    body('amount')    .isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('method')    .isIn(['Card','UPI','Net Banking']).withMessage('Invalid payment method'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { booking_id, amount, method } = req.body;
      const result = await paymentService.recordPayment(booking_id, { amount, method }, req.user);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/payments/receipt/:booking_id  –  Download receipt
router.get('/receipt/:booking_id',
  authenticate,
  [param('booking_id').isInt({ min: 1 })],
  validate,
  async (req, res, next) => {
    try {
      const receipt = await paymentService.getPaymentByBooking(
        parseInt(req.params.booking_id), req.user
      );
      res.json(receipt);
    } catch (err) { next(err); }
  }
);

module.exports = router;