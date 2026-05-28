'use strict';

const pool            = require('../config/db');
const { createError } = require('../middleware/errorhandler');

/**
 * Raise a service ticket.
 */
const createTicket = async (booking_id, { room_id, category, description }, requestor) => {
  // Ownership check
  await _assertGuestOwnsBooking(booking_id, requestor);
  await _assertBookingCurrentlyInStayWindow(booking_id);

  // Verify room belongs to booking
  const [brRows] = await pool.execute(
    `SELECT 1 FROM BookingRoom WHERE booking_id = ? AND room_id = ?`,
    [booking_id, room_id]
  );
  if (!brRows.length)
    throw createError(400, 'Room does not belong to this booking');

  const [result] = await pool.execute(
    `INSERT INTO ServiceTicket (booking_id, room_id, category, description)
     VALUES (?, ?, ?, ?)`,
    [booking_id, room_id, category, description]
  );

  return { ticket_id: result.insertId, booking_id, room_id, category, description, status: 'OPEN' };
};

/**
 * Fetch tickets for a booking (guest view).
 */
const getTicketsByBooking = async (booking_id, requestor) => {
  await _assertGuestOwnsBooking(booking_id, requestor);

  const [rows] = await pool.execute(
    `SELECT st.ticket_id, st.category, st.description, st.status, st.created_at,
            r.room_number, sa.name AS assigned_to
       FROM ServiceTicket st
       JOIN Room r ON st.room_id = r.room_id
       LEFT JOIN StaffAccount sa ON st.assigned_to = sa.staff_id
      WHERE st.booking_id = ?
      ORDER BY st.created_at DESC`,
    [booking_id]
  );
  return rows;
};

/**
 * Admin/Staff: view all open tickets.
 */
const getOpenTickets = async () => {
  const [rows] = await pool.execute(`SELECT * FROM vw_open_tickets ORDER BY created_at`);
  return rows;
};

/**
 * Staff/Admin: update ticket status and optionally assign.
 */
const updateTicket = async (ticket_id, { status, assigned_to }) => {
  const valid = ['OPEN','IN_PROGRESS','RESOLVED','CANCELLED'];
  if (status && !valid.includes(status)) throw createError(400, 'Invalid ticket status');

  const sets   = [];
  const params = [];
  if (status)      { sets.push('status = ?');      params.push(status); }
  if (assigned_to !== undefined) { sets.push('assigned_to = ?'); params.push(assigned_to || null); }

  if (!sets.length) throw createError(400, 'Nothing to update');

  params.push(ticket_id);
  const [result] = await pool.execute(
    `UPDATE ServiceTicket SET ${sets.join(', ')} WHERE ticket_id = ?`,
    params
  );
  if (!result.affectedRows) throw createError(404, 'Ticket not found');
  return { ticket_id, ...(status ? { status } : {}), ...(assigned_to !== undefined ? { assigned_to } : {}) };
};

// ── Internal ──────────────────────────────────────────────────
const _assertGuestOwnsBooking = async (booking_id, requestor) => {
  if (['STAFF','ADMIN'].includes(requestor.role)) return;
  const [rows] = await pool.execute(
    `SELECT guest_id FROM Booking WHERE booking_id = ?`, [booking_id]
  );
  if (!rows.length) throw createError(404, 'Booking not found');
  if (rows[0].guest_id !== requestor.id)
    throw createError(403, 'You do not own this booking');
};

const _assertBookingCurrentlyInStayWindow = async (booking_id) => {
  const [rows] = await pool.execute(
    `SELECT status, check_in, check_out
       FROM Booking
      WHERE booking_id = ?
        AND status IN ('CONFIRMED','CHECKED_IN')
        AND CURDATE() >= check_in
        AND CURDATE() < check_out`,
    [booking_id]
  );

  if (!rows.length) {
    throw createError(400, 'Service tickets are allowed only during the guest stay period after check-in and before check-out');
  }
};

module.exports = { createTicket, getTicketsByBooking, getOpenTickets, updateTicket };
