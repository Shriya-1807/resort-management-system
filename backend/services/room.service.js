'use strict';

const pool            = require('../config/db');
const { createError } = require('../middleware/errorhandler');

/**
 * Fetch all room types with their amenities.
 */
const getAllRoomTypes = async () => {
  const [types] = await pool.execute(
    `SELECT rt.room_type_id, rt.type_name, rt.max_occupancy, rt.price_per_day
       FROM RoomType rt
      ORDER BY rt.price_per_day`
  );

  // Attach amenities per type
  const [amenities] = await pool.execute(
    `SELECT rta.room_type_id, a.name AS amenity
       FROM RoomTypeAmenity rta
       JOIN Amenity a ON a.amenity_id = rta.amenity_id
      ORDER BY a.name`
  );

  const map = {};
  for (const row of amenities) {
    if (!map[row.room_type_id]) map[row.room_type_id] = [];
    map[row.room_type_id].push(row.amenity);
  }

  return types.map(t => ({ ...t, amenities: map[t.room_type_id] || [] }));
};

/**
 * Find available room types for a date range and guest count.
 * Returns only types that have at least one free ACTIVE room.
 */
const getAvailableRoomTypes = async (check_in, check_out, num_guests) => {
  if (check_out <= check_in)
    throw createError(400, 'check_out must be after check_in');

  const [rows] = await pool.execute(
    `SELECT
        rt.room_type_id,
        rt.type_name,
        rt.max_occupancy,
        rt.price_per_day,
        COUNT(r.room_id) AS available_count
     FROM RoomType rt
     JOIN Room r ON r.room_type_id = rt.room_type_id
       AND r.status = 'ACTIVE'
       AND NOT EXISTS (
             SELECT 1
               FROM BookingRoom br
               JOIN Booking b ON b.booking_id = br.booking_id
              WHERE br.room_id   = r.room_id
                AND b.status     IN ('PENDING','CONFIRMED','CHECKED_IN')
                AND b.check_in   < ?
                AND b.check_out  > ?
           )
     WHERE rt.max_occupancy >= ?
     GROUP BY rt.room_type_id
     HAVING available_count > 0
     ORDER BY rt.price_per_day`,
    [check_out, check_in, num_guests]
  );

  // Attach amenities
  const amenityMap = await _amenityMap();
  return rows.map(r => ({ ...r, amenities: amenityMap[r.room_type_id] || [] }));
};

// Internal helper
const _amenityMap = async () => {
  const [rows] = await pool.execute(
    `SELECT rta.room_type_id, a.name FROM RoomTypeAmenity rta
       JOIN Amenity a ON a.amenity_id = rta.amenity_id`
  );
  const map = {};
  for (const r of rows) {
    if (!map[r.room_type_id]) map[r.room_type_id] = [];
    map[r.room_type_id].push(r.name);
  }
  return map;
};

// ── Admin-only room management ────────────────────────────────

const getAllRooms = async () => {
  const [rows] = await pool.execute(
    `SELECT r.room_id, r.room_number, r.floor, r.status,
            rt.type_name, rt.price_per_day
       FROM Room r
       JOIN RoomType rt ON r.room_type_id = rt.room_type_id
      ORDER BY r.room_number`
  );
  return rows;
};

const updateRoomStatus = async (room_id, status) => {
  const valid = ['ACTIVE','MAINTENANCE','INACTIVE'];
  if (!valid.includes(status)) throw createError(400, 'Invalid room status');

  const [result] = await pool.execute(
    `UPDATE Room SET status = ? WHERE room_id = ?`,
    [status, room_id]
  );
  if (!result.affectedRows) throw createError(404, 'Room not found');
  return { room_id, status };
};

const updateRoomTypePrice = async (room_type_id, price_per_day) => {
  if (price_per_day < 0) throw createError(400, 'Price cannot be negative');
  const [result] = await pool.execute(
    `UPDATE RoomType SET price_per_day = ? WHERE room_type_id = ?`,
    [price_per_day, room_type_id]
  );
  if (!result.affectedRows) throw createError(404, 'Room type not found');
  return { room_type_id, price_per_day };
};

module.exports = {
  getAllRoomTypes,
  getAvailableRoomTypes,
  getAllRooms,
  updateRoomStatus,
  updateRoomTypePrice,
};