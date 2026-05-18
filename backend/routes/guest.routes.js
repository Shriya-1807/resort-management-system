'use strict';

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const guestService  = require('../services/guest.service');
const { validate }  = require('../middleware/validate');
const { authenticate, requireGuest } = require('../middleware/auth.middleware');

// ── GET /api/guest/profile  –  My profile ────────────────────
router.get('/profile',
  authenticate, requireGuest,
  async (req, res, next) => {
    try { res.json(await guestService.getProfile(req.user.id)); }
    catch (err) { next(err); }
  }
);

// ── PATCH /api/guest/profile  –  Update my profile ───────────
router.patch('/profile',
  authenticate, requireGuest,
  [
    body('first_name').optional().trim().notEmpty(),
    body('last_name') .optional().trim().notEmpty(),
    body('phone')     .optional().isMobilePhone(),
    body('address')   .optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await guestService.updateProfile(req.user.id, req.body);
      res.json(result);
    } catch (err) { next(err); }
  }
);

module.exports = router;