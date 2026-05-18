'use strict';

const pool            = require('../config/db');
const { createError } = require('../middleware/errorHandler');

const getProfile = async (guest_id) => {
  const [rows] = await pool.execute(
    `SELECT guest_id, first_name, last_name, email, phone, address, created_at
       FROM GuestAccount WHERE guest_id = ?`,
    [guest_id]
  );
  if (!rows.length) throw createError(404, 'Guest not found');
  return rows[0];
};

const updateProfile = async (guest_id, { first_name, last_name, phone, address }) => {
  const [result] = await pool.execute(
    `UPDATE GuestAccount
        SET first_name = COALESCE(?, first_name),
            last_name  = COALESCE(?, last_name),
            phone      = COALESCE(?, phone),
            address    = COALESCE(?, address)
      WHERE guest_id = ?`,
    [first_name || null, last_name || null, phone || null, address || null, guest_id]
  );
  if (!result.affectedRows) throw createError(404, 'Guest not found');
  return getProfile(guest_id);
};

// Admin: list all guests
const getAllGuests = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT guest_id, first_name, last_name, email, phone, created_at
       FROM GuestAccount
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM GuestAccount`);
  return { guests: rows, total, page, limit };
};

module.exports = { getProfile, updateProfile, getAllGuests };