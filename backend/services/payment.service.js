'use strict';

const pool            = require('../config/db');
const { createError } = require('../middleware/errorhandler');

/**
 * Record payment for a booking.
 * The trigger trg_payment_booking_status on the DB guards against
 * paying a cancelled / checked-out booking.
 *
 * @param {number} booking_id
 * @param {object} payload  { amount, method }
 * @param {object} requestor  { id, role }
 */
const recordPayment = async (booking_id, { amount, method }, requestor) => {
  // Ownership: guest must own the booking
  if (requestor.role === 'GUEST') {
    const [rows] = await pool.execute(
      `SELECT guest_id FROM Booking WHERE booking_id = ?`,
      [booking_id]
    );
    if (!rows.length) throw createError(404, 'Booking not found');
    if (rows[0].guest_id !== requestor.id)
      throw createError(403, 'You do not own this booking');
  }

  // Validate amount matches expected total
  const [bookingRows] = await pool.execute(
    `SELECT ROUND(br.price_per_day * DATEDIFF(b.check_out, b.check_in), 2) AS expected_amount
       FROM Booking b
       JOIN BookingRoom br ON b.booking_id = br.booking_id
      WHERE b.booking_id = ?`,
    [booking_id]
  );
  if (!bookingRows.length) throw createError(404, 'Booking not found');

  const expected = bookingRows[0].expected_amount;
  // Allow a small tolerance (e.g. frontend rounding)
  if (Math.abs(amount - expected) > 1)
    throw createError(400, `Payment amount must be ₹${expected}. Received ₹${amount}`);

  const [result] = await pool.execute(
    `INSERT INTO Payment (booking_id, amount, method) VALUES (?, ?, ?)`,
    [booking_id, amount, method]
  );

  return {
    payment_id : result.insertId,
    booking_id,
    amount,
    method,
    paid_at    : new Date().toISOString(),
  };
};

/**
 * Fetch payment details (used to generate receipt).
 */
const getPaymentByBooking = async (booking_id, requestor) => {
  const [rows] = await pool.execute(
    `SELECT
        p.payment_id, p.booking_id, p.amount, p.method, p.paid_at,
        b.check_in, b.check_out, b.num_guests, b.status AS booking_status,
        g.guest_id, g.first_name, g.last_name, g.email, g.phone,
        rt.type_name AS room_type, r.room_number, r.floor,
        br.price_per_day,
        DATEDIFF(b.check_out, b.check_in) AS nights
     FROM Payment p
     JOIN Booking      b  ON p.booking_id   = b.booking_id
     JOIN GuestAccount g  ON b.guest_id     = g.guest_id
     JOIN BookingRoom  br ON b.booking_id   = br.booking_id
     JOIN Room         r  ON br.room_id     = r.room_id
     JOIN RoomType     rt ON r.room_type_id = rt.room_type_id
     WHERE p.booking_id = ?`,
    [booking_id]
  );

  if (!rows.length) throw createError(404, 'Payment record not found for this booking');

  const rec = rows[0];
  if (requestor.role === 'GUEST' && requestor.id !== rec.guest_id)
    throw createError(403, 'You do not have access to this receipt');

  // Compute totals for receipt
  rec.total_room_cost = +(rec.price_per_day * rec.nights).toFixed(2);
  return rec;
};

module.exports = { recordPayment, getPaymentByBooking };