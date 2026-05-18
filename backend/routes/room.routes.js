'use strict';

const express  = require('express');
const { query, body, param } = require('express-validator');
const router   = express.Router();

const roomService   = require('../services/room.service');
const { validate }  = require('../middleware/validate');
const { authenticate, requireStaff, requireAdmin } = require('../middleware/auth.middleware');

// ── GET /api/rooms/types  –  All room types (public) ─────────
router.get('/types', async (_req, res, next) => {
  try { res.json(await roomService.getAllRoomTypes()); }
  catch (err) { next(err); }
});

// ── GET /api/rooms/available  –  Available rooms for dates ───
// Query: check_in, check_out, num_guests
router.get('/available',
  [
    query('check_in') .isDate().withMessage('check_in must be a valid date (YYYY-MM-DD)'),
    query('check_out').isDate().withMessage('check_out must be a valid date (YYYY-MM-DD)'),
    query('num_guests').optional().isInt({ min: 1 }).withMessage('num_guests must be a positive integer'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { check_in, check_out, num_guests = 1 } = req.query;
      const result = await roomService.getAvailableRoomTypes(check_in, check_out, parseInt(num_guests));
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/rooms  –  All rooms (staff+) ────────────────────
router.get('/',
  authenticate, requireStaff,
  async (_req, res, next) => {
    try { res.json(await roomService.getAllRooms()); }
    catch (err) { next(err); }
  }
);

// ── PATCH /api/rooms/:room_id/status  –  Admin only ──────────
router.patch('/:room_id/status',
  authenticate, requireAdmin,
  [
    param('room_id').isInt({ min: 1 }),
    body('status').isIn(['ACTIVE','MAINTENANCE','INACTIVE']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await roomService.updateRoomStatus(parseInt(req.params.room_id), req.body.status);
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/rooms/types/:room_type_id/price  –  Admin only
router.patch('/types/:room_type_id/price',
  authenticate, requireAdmin,
  [
    param('room_type_id').isInt({ min: 1 }),
    body('price_per_day').isFloat({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await roomService.updateRoomTypePrice(
        parseInt(req.params.room_type_id), req.body.price_per_day
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

module.exports = router;