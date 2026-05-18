'use strict';

const express  = require('express');
const { body, param } = require('express-validator');
const router   = express.Router();

const ticketService = require('../services/ticket.service');
const { validate }  = require('../middleware/validate');
const { authenticate, requireGuest, requireStaff } = require('../middleware/auth.middleware');

// ── POST /api/tickets  –  Guest raises a ticket ──────────────
router.post('/',
  authenticate, requireGuest,
  [
    body('booking_id') .isInt({ min: 1 }),
    body('room_id')    .isInt({ min: 1 }),
    body('category')   .isIn(['CLEANING','EXTRAS','REPAIR','OTHER']),
    body('description').trim().notEmpty().isLength({ max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { booking_id, room_id, category, description } = req.body;
      const result = await ticketService.createTicket(
        booking_id, { room_id, category, description }, req.user
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/tickets/:booking_id  –  Tickets for a booking ───
router.get('/:booking_id',
  authenticate,
  [param('booking_id').isInt({ min: 1 })],
  validate,
  async (req, res, next) => {
    try {
      const result = await ticketService.getTicketsByBooking(
        parseInt(req.params.booking_id), req.user
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/tickets  –  Staff: open tickets ─────────────────
router.get('/',
  authenticate, requireStaff,
  async (_req, res, next) => {
    try { res.json(await ticketService.getOpenTickets()); }
    catch (err) { next(err); }
  }
);

// ── PATCH /api/tickets/:ticket_id  –  Staff updates ticket ───
router.patch('/:ticket_id',
  authenticate, requireStaff,
  [
    param('ticket_id').isInt({ min: 1 }),
    body('status')     .optional().isIn(['OPEN','IN_PROGRESS','RESOLVED','CANCELLED']),
    body('assigned_to').optional().isInt({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await ticketService.updateTicket(
        parseInt(req.params.ticket_id), req.body
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

module.exports = router;