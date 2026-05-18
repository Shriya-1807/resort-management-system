'use strict';

const pool            = require('../config/db');
const { createError } = require('../middleware/errorHandler');

// ── Menu ──────────────────────────────────────────────────────

const getMenu = async ({ category } = {}) => {
  let sql    = `SELECT item_id, name, description, price, category, is_available
                  FROM MenuItem WHERE is_available = 1`;
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  sql += ' ORDER BY category, name';
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const getMenuCategories = async () => {
  const [rows] = await pool.execute(
    `SELECT DISTINCT category FROM MenuItem WHERE is_available = 1 ORDER BY category`
  );
  return rows.map(r => r.category);
};

// ── Orders ────────────────────────────────────────────────────

/**
 * Place a food order.
 *
 * @param {number} booking_id
 * @param {number} room_id
 * @param {string} delivery_type  'ROOM_SERVICE' | 'DINE_IN'
 * @param {Array}  items          [{ item_id, quantity }]
 * @param {object} requestor
 */
const placeOrder = async (booking_id, { room_id, delivery_type, items }, requestor) => {
  if (!items?.length) throw createError(400, 'Order must contain at least one item');

  // Verify guest owns the booking
  await _assertGuestOwnsBooking(booking_id, requestor);

  // Verify room belongs to booking
  const [brRows] = await pool.execute(
    `SELECT 1 FROM BookingRoom WHERE booking_id = ? AND room_id = ?`,
    [booking_id, room_id]
  );
  if (!brRows.length)
    throw createError(400, 'Room does not belong to this booking');

  // Fetch item prices
  const itemIds    = items.map(i => i.item_id);
  const placeholders = itemIds.map(() => '?').join(',');
  const [menuItems]  = await pool.execute(
    `SELECT item_id, name, price, is_available FROM MenuItem WHERE item_id IN (${placeholders})`,
    itemIds
  );

  if (menuItems.length !== itemIds.length)
    throw createError(400, 'One or more menu items not found');

  const unavailable = menuItems.filter(m => !m.is_available);
  if (unavailable.length)
    throw createError(400, `Items currently unavailable: ${unavailable.map(m => m.name).join(', ')}`);

  const priceMap = {};
  for (const m of menuItems) priceMap[m.item_id] = m.price;

  let total = 0;
  for (const i of items) total += priceMap[i.item_id] * i.quantity;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.execute(
      `INSERT INTO RestaurantOrder (booking_id, room_id, delivery_type, total_amount)
       VALUES (?, ?, ?, ?)`,
      [booking_id, room_id, delivery_type, +total.toFixed(2)]
    );
    const order_id = orderResult.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO RestaurantOrderItem (order_id, item_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [order_id, item.item_id, item.quantity, priceMap[item.item_id]]
      );
    }

    await conn.commit();
    return { order_id, booking_id, room_id, delivery_type, total_amount: +total.toFixed(2), status: 'PLACED' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Fetch all orders for a booking.
 */
const getOrdersByBooking = async (booking_id, requestor) => {
  await _assertGuestOwnsBooking(booking_id, requestor);

  const [orders] = await pool.execute(
    `SELECT ro.order_id, ro.delivery_type, ro.status, ro.total_amount, ro.ordered_at,
            r.room_number
       FROM RestaurantOrder ro
       JOIN Room r ON ro.room_id = r.room_id
      WHERE ro.booking_id = ?
      ORDER BY ro.ordered_at DESC`,
    [booking_id]
  );

  // Attach items per order
  for (const order of orders) {
    const [items] = await pool.execute(
      `SELECT roi.order_item_id, mi.name, roi.quantity, roi.unit_price,
              IFNULL(mr.stars, NULL) AS rated_stars
         FROM RestaurantOrderItem roi
         JOIN MenuItem mi ON roi.item_id = mi.item_id
         LEFT JOIN MenuItemRating mr ON roi.order_item_id = mr.order_item_id
        WHERE roi.order_id = ?`,
      [order.order_id]
    );
    order.items = items;
  }

  return orders;
};

/**
 * Update order status (staff/admin).
 */
const updateOrderStatus = async (order_id, status) => {
  const valid = ['PLACED','PREPARING','READY','SERVED','CANCELLED'];
  if (!valid.includes(status)) throw createError(400, 'Invalid order status');

  const [result] = await pool.execute(
    `UPDATE RestaurantOrder SET status = ? WHERE order_id = ?`,
    [status, order_id]
  );
  if (!result.affectedRows) throw createError(404, 'Order not found');
  return { order_id, status };
};

/**
 * Rate a served order item.
 */
const rateOrderItem = async (order_item_id, { stars, comment }, requestor) => {
  // Verify requestor owns the order
  const [rows] = await pool.execute(
    `SELECT b.guest_id
       FROM RestaurantOrderItem roi
       JOIN RestaurantOrder ro ON ro.order_id    = roi.order_id
       JOIN Booking         b  ON b.booking_id   = ro.booking_id
      WHERE roi.order_item_id = ?`,
    [order_item_id]
  );
  if (!rows.length) throw createError(404, 'Order item not found');
  if (requestor.role === 'GUEST' && requestor.id !== rows[0].guest_id)
    throw createError(403, 'You do not own this order item');

  await pool.execute(
    `INSERT INTO MenuItemRating (order_item_id, stars, comment) VALUES (?, ?, ?)`,
    [order_item_id, stars, comment || null]
  );
  return { order_item_id, stars, comment };
};

// ── Admin ─────────────────────────────────────────────────────

const getActiveOrders = async () => {
  const [rows] = await pool.execute(`SELECT * FROM vw_active_orders`);
  return rows;
};

const toggleMenuItemAvailability = async (item_id, is_available) => {
  const [result] = await pool.execute(
    `UPDATE MenuItem SET is_available = ? WHERE item_id = ?`,
    [is_available ? 1 : 0, item_id]
  );
  if (!result.affectedRows) throw createError(404, 'Menu item not found');
  return { item_id, is_available: !!is_available };
};

// ── Internal helper ───────────────────────────────────────────
const _assertGuestOwnsBooking = async (booking_id, requestor) => {
  if (['STAFF','ADMIN'].includes(requestor.role)) return;
  const [rows] = await pool.execute(
    `SELECT guest_id FROM Booking WHERE booking_id = ?`,
    [booking_id]
  );
  if (!rows.length) throw createError(404, 'Booking not found');
  if (rows[0].guest_id !== requestor.id)
    throw createError(403, 'You do not own this booking');
};

module.exports = {
  getMenu,
  getMenuCategories,
  placeOrder,
  getOrdersByBooking,
  updateOrderStatus,
  rateOrderItem,
  getActiveOrders,
  toggleMenuItemAvailability,
};