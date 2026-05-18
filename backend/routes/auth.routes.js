'use strict';

const express   = require('express');
const { body }  = require('express-validator');
const router    = express.Router();
const rateLimit = require('express-rate-limit');

const authService   = require('../services/auth.service');
const { validate }  = require('../middleware/validate');
const { authenticate, requireGuest } = require('../middleware/auth.middleware');

// Tight rate limit on auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 15,
  message  : { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ── POST /api/auth/register  –  Guest sign-up ─────────────────
router.post('/register',
  authLimiter,
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name') .trim().notEmpty().withMessage('Last name is required'),
    body('email')     .isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one digit'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const guest = await authService.registerGuest(req.body);
      res.status(201).json({ message: 'Account created successfully', guest });
    } catch (err) { next(err); }
  }
);

// ── POST /api/auth/login  –  Guest login ─────────────────────
router.post('/login',
  authLimiter,
  [
    body('email')   .isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginGuest({ email, password });
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── POST /api/auth/staff/login  –  Staff / Admin login ───────
router.post('/staff/login',
  authLimiter,
  [
    body('email')   .isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginStaff({ email, password });
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/auth/change-password  –  Authenticated guest ──
router.patch('/change-password',
  authenticate,
  requireGuest,
  [
    body('old_password').notEmpty(),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await authService.changeGuestPassword(req.user.id, req.body);
      res.json(result);
    } catch (err) { next(err); }
  }
);

module.exports = router;