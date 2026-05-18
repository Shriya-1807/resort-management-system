'use strict';

const express  = require('express');
const { body, param, query } = require('express-validator');
const router   = express.Router();

const bookingService = require('../services/booking.service');
const { validate }   = require('../middleware/validate');
const { authenticate, requireGuest, requireStaff, requireAdmin } = require('../middleware/auth.middleware');

// ── POST /api/bookings  –  Create booking (guest) ────────────
// Payment is expected to follow immediately via POST /api/payments
router.post('/',
  authenticate, requireGuest,
  [
    body('room_type_id').isInt({ min: 1 }).withMessage('Valid room_type_id required'),
    body('check_in')    .isDate().withMessage('check_in must be YYYY-MM-DD'),
    body('check_out')   .isDate().withMessage('check_out must be YYYY-MM-DD'),
    body('num_guests')  .isInt({ min: 1 }).withMessage('num_guests must be ≥ 1'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { room_type_id, check_in, check_out, num_guests } = req.body;
      const result = await bookingService.createBooking({
        guest_id: req.user.id,
        room_type_id,
        check_in,
        check_out,
        num_guests,
      });
      res.status(201).json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/bookings/my  –  My bookings (guest) ─────────────
router.get('/my',
  authenticate, requireGuest,
  async (req, res, next) => {
    try { res.json(await bookingService.getBookingsByGuest(req.user.id)); }
    catch (err) { next(err); }
  }
);

// ── GET /api/bookings  –  All bookings (staff+) ──────────────
router.get('/',
  authenticate, requireStaff,
  [
    query('status').optional().isIn(['PENDING','CONFIRMED','CANCELLED','CHECKED_IN','CHECKED_OUT']),
    query('page')  .optional().isInt({ min: 1 }),
    query('limit') .optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await bookingService.getAllBookings({
        status, page: parseInt(page), limit: parseInt(limit)
      });
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/bookings/:booking_id  –  Single booking ─────────
router.get('/:booking_id',
  authenticate,
  [param('booking_id').isInt({ min: 1 })],
  validate,
  async (req, res, next) => {
    try {
      const booking = await bookingService.getBookingById(
        parseInt(req.params.booking_id), req.user
      );
      res.json(booking);
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/bookings/:booking_id/status  –  Staff/Admin ───
router.patch('/:booking_id/status',
  authenticate, requireStaff,
  [
    param('booking_id').isInt({ min: 1 }),
    body('status').isIn(['PENDING','CONFIRMED','CANCELLED','CHECKED_IN','CHECKED_OUT']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await bookingService.updateBookingStatus(
        parseInt(req.params.booking_id), req.body.status
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

module.exports = router;