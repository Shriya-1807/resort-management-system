'use strict';

const pool            = require('../config/db');
const { createError } = require('../middleware/errorHandler');

/**
 * Create a booking via the stored procedure sp_create_booking_by_room_type.
 * Payment MUST be recorded separately right after this call.
 *
 * @returns {{ booking_id, room_id, status, message }}
 */
const createBooking = async ({ guest_id, room_type_id, check_in, check_out, num_guests }) => {
  const conn = await pool.getConnection();
  try {
    await conn.execute('SET @booking_id = NULL, @room_id = NULL, @status = NULL, @message = NULL');

    await conn.execute(
      `CALL sp_create_booking_by_room_type(?, ?, ?, ?, ?, 0, @booking_id, @room_id, @status, @message)`,
      [guest_id, room_type_id, check_in, check_out, num_guests]
    );

    const [[out]] = await conn.execute(
      `SELECT @booking_id AS booking_id, @room_id AS room_id,
              @status AS status, @message AS message`
    );

    if (out.status === 'NO_ROOM')
      throw createError(409, out.message || 'No room available for selected type and dates');

    if (out.status !== 'CONFIRMED')
      throw createError(400, out.message || 'Booking failed');

    return {
      booking_id : out.booking_id,
      room_id    : out.room_id,
      status     : out.status,
      message    : out.message,
    };
  } finally {
    conn.release();
  }
};

/**
 * Fetch a single booking with full details (for receipt / my-booking page).
 * Guests may only see their own; staff/admin see all.
 */
const getBookingById = async (booking_id, requestor) => {
  const [rows] = await pool.execute(
    `SELECT
        b.booking_id, b.check_in, b.check_out, b.num_guests, b.status, b.created_at,
        g.guest_id, g.first_name, g.last_name, g.email, g.phone,
        rt.type_name AS room_type,
        r.room_id, r.room_number, r.floor,
        br.price_per_day,
        DATEDIFF(b.check_out, b.check_in) AS nights,
        ROUND(br.price_per_day * DATEDIFF(b.check_out, b.check_in), 2) AS total_room_cost,
        p.payment_id, p.amount AS amount_paid, p.method AS payment_method, p.paid_at
     FROM Booking b
     JOIN GuestAccount g  ON b.guest_id    = g.guest_id
     JOIN BookingRoom  br ON b.booking_id  = br.booking_id
     JOIN Room         r  ON br.room_id    = r.room_id
     JOIN RoomType     rt ON r.room_type_id = rt.room_type_id
     LEFT JOIN Payment p  ON b.booking_id  = p.booking_id
     WHERE b.booking_id = ?`,
    [booking_id]
  );

  if (!rows.length) throw createError(404, 'Booking not found');

  const booking = rows[0];

  // Ownership check: a GUEST can only view their own booking
  if (requestor.role === 'GUEST' && requestor.id !== booking.guest_id)
    throw createError(403, 'You do not have access to this booking');

  return booking;
};

/**
 * All bookings for a specific guest (my-bookings page).
 */
const getBookingsByGuest = async (guest_id) => {
  const [rows] = await pool.execute(
    `SELECT
        b.booking_id, b.check_in, b.check_out, b.num_guests, b.status, b.created_at,
        rt.type_name AS room_type, r.room_id, r.room_number,
        br.price_per_day,
        DATEDIFF(b.check_out, b.check_in) AS nights,
        ROUND(br.price_per_day * DATEDIFF(b.check_out, b.check_in), 2) AS total_room_cost,
        p.amount AS amount_paid, p.method AS payment_method
     FROM Booking b
     JOIN BookingRoom br ON b.booking_id  = br.booking_id
     JOIN Room        r  ON br.room_id    = r.room_id
     JOIN RoomType    rt ON r.room_type_id = rt.room_type_id
     LEFT JOIN Payment p ON b.booking_id  = p.booking_id
     WHERE b.guest_id = ?
     ORDER BY b.created_at DESC`,
    [guest_id]
  );
  return rows;
};

/**
 * Admin: list all bookings with optional status filter.
 */
const getAllBookings = async ({ status, page = 1, limit = 20 }) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;
  const params = [];
  let where    = '';

  if (status) {
    where = 'WHERE b.status = ?';
    params.push(status);
  }

  const [rows] = await pool.execute(
    `SELECT
        b.booking_id, b.check_in, b.check_out, b.num_guests, b.status, b.created_at,
        g.first_name, g.last_name, g.email, g.phone,
        rt.type_name AS room_type, r.room_number,
        p.amount AS amount_paid, p.method AS payment_method
     FROM Booking b
     JOIN GuestAccount g  ON b.guest_id    = g.guest_id
     JOIN BookingRoom  br ON b.booking_id  = br.booking_id
     JOIN Room         r  ON br.room_id    = r.room_id
     JOIN RoomType     rt ON r.room_type_id = rt.room_type_id
     LEFT JOIN Payment p  ON b.booking_id  = p.booking_id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM Booking b ${where}`,
    params
  );

  return { bookings: rows, total, page: safePage, limit: safeLimit };
};

/**
 * Admin: update booking lifecycle status.
 */
const updateBookingStatus = async (booking_id, status) => {
  const valid = ['PENDING','CONFIRMED','CANCELLED','CHECKED_IN','CHECKED_OUT'];
  if (!valid.includes(status)) throw createError(400, 'Invalid booking status');

  const [result] = await pool.execute(
    `UPDATE Booking SET status = ? WHERE booking_id = ?`,
    [status, booking_id]
  );
  if (!result.affectedRows) throw createError(404, 'Booking not found');
  return { booking_id, status };
};

module.exports = {
  createBooking,
  getBookingById,
  getBookingsByGuest,
  getAllBookings,
  updateBookingStatus,
};
