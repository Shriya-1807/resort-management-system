'use strict';

const express  = require('express');
const { body, param, query } = require('express-validator');
const router   = express.Router();

const cancellationService = require('../services/cancellation.service');
const { validate }        = require('../middleware/validate');
const { authenticate, requireGuest, requireStaff, requireAdmin } = require('../middleware/auth.middleware');

// ── POST /api/cancellations  –  Guest cancels own booking ────
router.post('/',
  authenticate, requireGuest,
  [
    body('booking_id').isInt({ min: 1 }).withMessage('Valid booking_id required'),
    body('reason').optional().trim().isLength({ max: 255 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { booking_id, reason } = req.body;
      const result = await cancellationService.cancelBooking(booking_id, { reason }, req.user);
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/cancellations/my  –  Guest: my cancellations ────
router.get('/my',
  authenticate, requireGuest,
  async (req, res, next) => {
    try { res.json(await cancellationService.getCancellationsByGuest(req.user.id)); }
    catch (err) { next(err); }
  }
);

// ── GET /api/cancellations  –  Admin: all cancellations ──────
router.get('/',
  authenticate, requireAdmin,
  [
    query('page') .optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await cancellationService.getAllCancellations({
        page : parseInt(req.query.page  || 1),
        limit: parseInt(req.query.limit || 20),
      });
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/cancellations/refunds/:refund_id  –  Admin marks refund processed
router.patch('/refunds/:refund_id',
  authenticate, requireAdmin,
  [
    param('refund_id').isInt({ min: 1 }),
    body('gateway_ref').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await cancellationService.processRefund(
        parseInt(req.params.refund_id), req.body
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── Admin/Staff: cancel a booking on behalf of guest ─────────
router.post('/staff',
  authenticate, requireStaff,
  [
    body('booking_id').isInt({ min: 1 }),
    body('reason').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { booking_id, reason } = req.body;
      const result = await cancellationService.cancelBooking(booking_id, { reason }, req.user);
      res.json(result);
    } catch (err) { next(err); }
  }
);

module.exports = router;