'use strict';

const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
const cookieParser  = require('cookie-parser');

const authRoutes        = require('./routes/auth.routes');
const guestRoutes       = require('./routes/guest.routes');
const bookingRoutes     = require('./routes/booking.routes');
const roomRoutes        = require('./routes/room.routes');
const paymentRoutes     = require('./routes/payment.routes');
const cancellationRoutes= require('./routes/cancellation.routes');
const restaurantRoutes  = require('./routes/restaurant.routes');
const ticketRoutes      = require('./routes/ticket.routes');
const adminRoutes       = require('./routes/admin.routes');
const { errorHandler } = require('./middleware/errorhandler');

const app = express();

// ── Security headers ──────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = `${process.env.ALLOWED_ORIGIN || 'http://localhost:3000'},http://localhost:5173,http://localhost:3001`
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin(origin, callback) {
    // 1. Allow server-to-server or postman requests (no origin)
    if (!origin) return callback(null, true);
    
    // 2. Check if wildcard '*' is present OR if the origin matches explicitly
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200 // Ensures preflight OPTIONS requests return a clean 200 status
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── HTTP request logger ───────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Global rate limiter (brute-force guard) ───────────────────
app.use('/api/', rateLimit({
  windowMs : 15 * 60 * 1000,   // 15 min
  max      : 200,
  message  : { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders  : false,
}));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/guest',        guestRoutes);
app.use('/api/rooms',        roomRoutes);
app.use('/api/bookings',     bookingRoutes);
app.use('/api/payments',     paymentRoutes);
app.use('/api/cancellations',cancellationRoutes);
app.use('/api/restaurant',   restaurantRoutes);
app.use('/api/tickets',      ticketRoutes);
app.use('/api/admin',        adminRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── 404 catch ─────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Centralised error handler ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
