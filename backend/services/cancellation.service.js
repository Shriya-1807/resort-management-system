'use strict';

const pool            = require('../config/db');
const { createError } = require('../middleware/errorHandler');

/**
 * Cancel a booking.
 *
 * Business rules enforced here (in addition to DB triggers):
 *  1. Only CONFIRMED (not yet checked-in) bookings can be cancelled by a guest.
 *  2. Cancellation is only allowed before the check-in date.
 *  3. A Cancellation audit row is inserted; if a payment exists a Refund row is created.
 */
const cancelBooking = async (booking_id, { reason }, requestor) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch booking with lock
    const [rows] = await conn.execute(
      `SELECT b.booking_id, b.guest_id, b.check_in, b.check_out, b.status,
              p.payment_id, p.amount AS paid_amount
         FROM Booking b
         LEFT JOIN Payment p ON b.booking_id = p.booking_id
        WHERE b.booking_id = ?
        FOR UPDATE`,
      [booking_id]
    );

    if (!rows.length) throw createError(404, 'Booking not found');
    const booking = rows[0];

    // Ownership check
    if (requestor.role === 'GUEST' && requestor.id !== booking.guest_id)
      throw createError(403, 'You do not own this booking');

    // Status check – guests can only cancel CONFIRMED bookings;
    // staff/admin can cancel CONFIRMED or CHECKED_IN
    const allowedStatuses = ['CONFIRMED', 'CHECKED_IN'];
    if (!allowedStatuses.includes(booking.status))
      throw createError(400, `Cannot cancel a booking with status "${booking.status}"`);

    // Date check – guests cannot cancel after check-in date
    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn  = new Date(booking.check_in);

    if (requestor.role === 'GUEST' && checkIn <= today)
      throw createError(400, 'Cancellation is only allowed before the check-in date');

    // 1. Mark booking CANCELLED
    await conn.execute(
      `UPDATE Booking SET status = 'CANCELLED' WHERE booking_id = ?`,
      [booking_id]
    );

    // 2. Insert cancellation audit (trigger trg_cancellation_booking_status requires CANCELLED)
    const [cancelResult] = await conn.execute(
      `INSERT INTO Cancellation (booking_id, reason) VALUES (?, ?)`,
      [booking_id, reason || 'Guest requested cancellation']
    );
    const cancellation_id = cancelResult.insertId;

    // 3. If payment exists, create a PENDING refund for the full amount
    let refund = null;
    if (booking.payment_id) {
      const [refundResult] = await conn.execute(
        `INSERT INTO Refund (payment_id, cancellation_id, amount, status)
         VALUES (?, ?, ?, 'PENDING')`,
        [booking.payment_id, cancellation_id, booking.paid_amount]
      );
      refund = {
        refund_id      : refundResult.insertId,
        amount         : booking.paid_amount,
        status         : 'PENDING',
      };
    }

    await conn.commit();

    return {
      booking_id,
      cancellation_id,
      message: 'Booking cancelled successfully',
      refund,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * List cancellations for a guest.
 */
const getCancellationsByGuest = async (guest_id) => {
  const [rows] = await pool.execute(
    `SELECT c.cancellation_id, c.booking_id, c.reason, c.cancelled_at,
            b.check_in, b.check_out,
            rt.type_name AS room_type, r.room_number,
            rf.refund_id, rf.amount AS refund_amount, rf.status AS refund_status
       FROM Cancellation c
       JOIN Booking      b  ON c.booking_id   = b.booking_id
       JOIN GuestAccount g  ON b.guest_id     = g.guest_id
       JOIN BookingRoom  br ON b.booking_id   = br.booking_id
       JOIN Room         r  ON br.room_id     = r.room_id
       JOIN RoomType     rt ON r.room_type_id = rt.room_type_id
       LEFT JOIN Refund  rf ON c.cancellation_id = rf.cancellation_id
      WHERE b.guest_id = ?
      ORDER BY c.cancelled_at DESC`,
    [guest_id]
  );
  return rows;
};

/**
 * Admin: list all cancellations with optional pagination.
 */
const getAllCancellations = async ({ page = 1, limit = 20 }) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;
  const [rows] = await pool.execute(
    `SELECT c.cancellation_id, c.booking_id, c.reason, c.cancelled_at,
            g.first_name, g.last_name, g.email,
            b.check_in, b.check_out,
            rt.type_name AS room_type, r.room_number,
            rf.refund_id, rf.amount AS refund_amount, rf.status AS refund_status,
            rf.gateway_ref
       FROM Cancellation c
       JOIN Booking      b  ON c.booking_id   = b.booking_id
       JOIN GuestAccount g  ON b.guest_id     = g.guest_id
       JOIN BookingRoom  br ON b.booking_id   = br.booking_id
       JOIN Room         r  ON br.room_id     = r.room_id
       JOIN RoomType     rt ON r.room_type_id = rt.room_type_id
       LEFT JOIN Refund  rf ON c.cancellation_id = rf.cancellation_id
      ORDER BY c.cancelled_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}`
  );
  return rows;
};

/**
 * Admin: mark a refund as PROCESSED.
 */
const processRefund = async (refund_id, { gateway_ref }) => {
  const [result] = await pool.execute(
    `UPDATE Refund
        SET status = 'PROCESSED', gateway_ref = ?, processed_at = UTC_TIMESTAMP()
      WHERE refund_id = ? AND status = 'PENDING'`,
    [gateway_ref || null, refund_id]
  );
  if (!result.affectedRows)
    throw createError(404, 'Refund not found or already processed');
  return { refund_id, status: 'PROCESSED', gateway_ref };
};

module.exports = {
  cancelBooking,
  getCancellationsByGuest,
  getAllCancellations,
  processRefund,
};
