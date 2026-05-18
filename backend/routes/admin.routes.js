'use strict';

const express  = require('express');
const { body, query } = require('express-validator');
const bcrypt   = require('bcrypt');
const pool     = require('../config/db');
const router   = express.Router();

const guestService = require('../services/guest.service');
const { validate } = require('../middleware/validate');
const { authenticate, requireAdmin, requireStaff } = require('../middleware/auth.middleware');
const { createError } = require('../middleware/errorHandler');

// All admin routes require authentication. Role checks per route below.

// ── GET /api/admin/dashboard  –  Key metrics ─────────────────
router.get('/dashboard',
  authenticate, requireStaff,          // staff can see dashboard too
  async (_req, res, next) => {
    try {
      const [[{ total_bookings }]] = await pool.execute(
        `SELECT COUNT(*) AS total_bookings FROM Booking`
      );
      const [[{ active_bookings }]] = await pool.execute(
        `SELECT COUNT(*) AS active_bookings FROM Booking WHERE status IN ('CONFIRMED','CHECKED_IN')`
      );
      const [[{ total_revenue }]] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM Payment`
      );
      const [[{ open_tickets }]] = await pool.execute(
        `SELECT COUNT(*) AS open_tickets FROM ServiceTicket WHERE status IN ('OPEN','IN_PROGRESS')`
      );
      const [[{ active_orders }]] = await pool.execute(
        `SELECT COUNT(*) AS active_orders FROM RestaurantOrder WHERE status IN ('PLACED','PREPARING','READY')`
      );
      const [[{ total_guests }]] = await pool.execute(
        `SELECT COUNT(*) AS total_guests FROM GuestAccount`
      );

      res.json({
        total_bookings,
        active_bookings,
        total_revenue,
        open_tickets,
        active_orders,
        total_guests,
      });
    } catch (err) { next(err); }
  }
);

// ── GET /api/admin/guests  –  All guests list ────────────────
router.get('/guests',
  authenticate, requireAdmin,
  [
    query('page') .optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await guestService.getAllGuests({
        page : parseInt(req.query.page  || 1),
        limit: parseInt(req.query.limit || 20),
      });
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── POST /api/admin/staff  –  Create a new staff account ─────
router.post('/staff',
  authenticate, requireAdmin,
  [
    body('name')    .trim().notEmpty(),
    body('email')   .isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role')    .isIn(['ADMIN','STAFF']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const hash = await bcrypt.hash(password, 12);
      const [result] = await pool.execute(
        `INSERT INTO StaffAccount (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        [name, email, hash, role]
      );
      res.status(201).json({ staff_id: result.insertId, name, email, role });
    } catch (err) { next(err); }
  }
);

// ── GET /api/admin/staff  –  All staff accounts ──────────────
router.get('/staff',
  authenticate, requireAdmin,
  async (_req, res, next) => {
    try {
      const [rows] = await pool.execute(
        `SELECT staff_id, name, email, role, created_at FROM StaffAccount ORDER BY created_at DESC`
      );
      res.json(rows);
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/admin/staff/:staff_id  –  Remove staff ───────
router.delete('/staff/:staff_id',
  authenticate, requireAdmin,
  async (req, res, next) => {
    try {
      const staff_id = parseInt(req.params.staff_id);
      // Prevent self-deletion
      if (staff_id === req.user.id)
        throw createError(400, 'You cannot delete your own account');

      const [result] = await pool.execute(
        `DELETE FROM StaffAccount WHERE staff_id = ?`, [staff_id]
      );
      if (!result.affectedRows) throw createError(404, 'Staff member not found');
      res.json({ message: 'Staff account removed', staff_id });
    } catch (err) { next(err); }
  }
);

// ── GET /api/admin/revenue  –  Revenue breakdown ─────────────
router.get('/revenue',
  authenticate, requireAdmin,
  async (_req, res, next) => {
    try {
      const [byRoomType] = await pool.execute(
        `SELECT rt.type_name, COUNT(b.booking_id) AS bookings,
                SUM(p.amount) AS revenue
           FROM Booking b
           JOIN BookingRoom  br ON b.booking_id   = br.booking_id
           JOIN Room         r  ON br.room_id      = r.room_id
           JOIN RoomType     rt ON r.room_type_id  = rt.room_type_id
           JOIN Payment      p  ON b.booking_id    = p.booking_id
          GROUP BY rt.room_type_id`
      );
      const [byMonth] = await pool.execute(
        `SELECT DATE_FORMAT(p.paid_at, '%Y-%m') AS month,
                SUM(p.amount) AS revenue, COUNT(*) AS payments
           FROM Payment p
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12`
      );
      res.json({ by_room_type: byRoomType, by_month: byMonth });
    } catch (err) { next(err); }
  }
);

// ── GET /api/admin/refunds  –  Pending refunds ───────────────
router.get('/refunds',
  authenticate, requireAdmin,
  async (_req, res, next) => {
    try {
      const [rows] = await pool.execute(`SELECT * FROM vw_refund_receipts ORDER BY initiated_at DESC`);
      res.json(rows);
    } catch (err) { next(err); }
  }
);

module.exports = router;