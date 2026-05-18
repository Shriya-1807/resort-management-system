'use strict';

const express  = require('express');
const { body, param, query } = require('express-validator');
const router   = express.Router();

const restaurantService = require('../services/restaurant.service');
const { validate }      = require('../middleware/validate');
const { authenticate, requireGuest, requireStaff, requireAdmin } = require('../middleware/auth.middleware');

// ── GET /api/restaurant/menu  –  Public menu ─────────────────
router.get('/menu',
  [query('category').optional().trim()],
  validate,
  async (req, res, next) => {
    try { res.json(await restaurantService.getMenu({ category: req.query.category })); }
    catch (err) { next(err); }
  }
);

// ── GET /api/restaurant/menu/categories ──────────────────────
router.get('/menu/categories', async (_req, res, next) => {
  try { res.json(await restaurantService.getMenuCategories()); }
  catch (err) { next(err); }
});

// ── POST /api/restaurant/orders  –  Place order (guest) ──────
router.post('/orders',
  authenticate, requireGuest,
  [
    body('booking_id')    .isInt({ min: 1 }),
    body('room_id')       .isInt({ min: 1 }),
    body('delivery_type') .isIn(['ROOM_SERVICE','DINE_IN']),
    body('items')         .isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.item_id')  .isInt({ min: 1 }),
    body('items.*.quantity') .isInt({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { booking_id, room_id, delivery_type, items } = req.body;
      const result = await restaurantService.placeOrder(
        booking_id, { room_id, delivery_type, items }, req.user
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/restaurant/orders/:booking_id  –  Orders for booking
router.get('/orders/:booking_id',
  authenticate,
  [param('booking_id').isInt({ min: 1 })],
  validate,
  async (req, res, next) => {
    try {
      const result = await restaurantService.getOrdersByBooking(
        parseInt(req.params.booking_id), req.user
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/restaurant/orders/:order_id/status  –  Staff ──
router.patch('/orders/:order_id/status',
  authenticate, requireStaff,
  [
    param('order_id').isInt({ min: 1 }),
    body('status').isIn(['PLACED','PREPARING','READY','SERVED','CANCELLED']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await restaurantService.updateOrderStatus(
        parseInt(req.params.order_id), req.body.status
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── POST /api/restaurant/ratings  –  Rate an order item ──────
router.post('/ratings',
  authenticate, requireGuest,
  [
    body('order_item_id').isInt({ min: 1 }),
    body('stars')        .isInt({ min: 1, max: 5 }),
    body('comment')      .optional().trim().isLength({ max: 400 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { order_item_id, stars, comment } = req.body;
      const result = await restaurantService.rateOrderItem(
        order_item_id, { stars, comment }, req.user
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  }
);

// ── GET /api/restaurant/active-orders  –  Staff kitchen view ─
router.get('/active-orders',
  authenticate, requireStaff,
  async (_req, res, next) => {
    try { res.json(await restaurantService.getActiveOrders()); }
    catch (err) { next(err); }
  }
);

// ── PATCH /api/restaurant/menu/:item_id/availability  –  Admin
router.patch('/menu/:item_id/availability',
  authenticate, requireAdmin,
  [
    param('item_id').isInt({ min: 1 }),
    body('is_available').isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await restaurantService.toggleMenuItemAvailability(
        parseInt(req.params.item_id), req.body.is_available
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

module.exports = router;