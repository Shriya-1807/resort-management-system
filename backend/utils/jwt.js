'use strict';

const jwt = require('jsonwebtoken');

const SECRET      = process.env.JWT_SECRET      || 'change_me_in_production_!';
const EXPIRES_IN  = process.env.JWT_EXPIRES_IN  || '7d';

/**
 * Signs a JWT payload.
 * @param {object} payload  – { id, role }  where role = 'GUEST' | 'STAFF' | 'ADMIN'
 */
const signToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

/**
 * Verifies a JWT and returns its decoded payload, or throws.
 */
const verifyToken = (token) =>
  jwt.verify(token, SECRET);

module.exports = { signToken, verifyToken };