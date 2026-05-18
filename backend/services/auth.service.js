'use strict';

const bcrypt          = require('bcrypt');
const pool            = require('../config/db');
const { signToken }   = require('../utils/jwt');
const { createError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

// ── Guest ─────────────────────────────────────────────────────
 //Register a new guest account.
const registerGuest = async ({ first_name, last_name, email, phone, address, password }) => {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await pool.execute(
    `INSERT INTO GuestAccount (first_name, last_name, email, phone, address, password_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, email, phone || null, address || null, hash]
  );

  return { guest_id: result.insertId, email };
};

//Authenticate a guest. Returns a signed JWT.
const loginGuest = async ({ email, password }) => {
  const [rows] = await pool.execute(
    `SELECT guest_id, first_name, last_name, password_hash
       FROM GuestAccount WHERE email = ?`,
    [email]
  );

  if (!rows.length) throw createError(401, 'No account found with that email address');

  const guest   = rows[0];
  const isMatch = await bcrypt.compare(password, guest.password_hash);
  if (!isMatch) throw createError(401, 'Incorrect password');

  const token = signToken({ id: guest.guest_id, role: 'GUEST' });
  return {
    token,
    user: { id: guest.guest_id, first_name: guest.first_name, last_name: guest.last_name, role: 'GUEST' },
  };
};

// ── Staff / Admin ─────────────────────────────────────────────
//Authenticate a staff member. Returns a signed JWT carrying their role.

const loginStaff = async ({ email, password }) => {
  const [rows] = await pool.execute(
    `SELECT staff_id, name, password_hash, role
       FROM StaffAccount WHERE email = ?`,
    [email]
  );

  if (!rows.length) throw createError(401, 'No staff account found with that email address');

  const staff   = rows[0];
  const isMatch = await bcrypt.compare(password, staff.password_hash);
  if (!isMatch) throw createError(401, 'Incorrect password');

  const token = signToken({ id: staff.staff_id, role: staff.role });
  return {
    token,
    user: { id: staff.staff_id, name: staff.name, role: staff.role },
  };
};

//Change password for a guest (used from profile / forgot-password flow).
const changeGuestPassword = async (guest_id, { old_password, new_password }) => {
  const [rows] = await pool.execute(
    `SELECT password_hash FROM GuestAccount WHERE guest_id = ?`,
    [guest_id]
  );
  if (!rows.length) throw createError(404, 'Guest not found');

  const isMatch = await bcrypt.compare(old_password, rows[0].password_hash);
  if (!isMatch) throw createError(401, 'Old password is incorrect');

  const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
  await pool.execute(
    `UPDATE GuestAccount SET password_hash = ? WHERE guest_id = ?`,
    [hash, guest_id]
  );
  return { message: 'Password updated successfully' };
};

module.exports = { registerGuest, loginGuest, loginStaff, changeGuestPassword };