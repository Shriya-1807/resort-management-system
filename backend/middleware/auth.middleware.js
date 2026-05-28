// JWT Guard & Role Guards

'use strict';

const { verifyToken }  = require('../utils/jwt');
const { createError }  = require('./errorhandler');

const authenticate = (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) throw createError(401, 'Authentication token missing');

    req.user = verifyToken(token);   
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return next(createError(401, 'Token expired, please login again'));
    if (err.name === 'JsonWebTokenError')
      return next(createError(401, 'Invalid token'));
    next(err);
  }
};

// Only logged-in guests may pass
const requireGuest = (req, _res, next) => {
  if (req.user?.role !== 'GUEST')
    return next(createError(403, 'Access restricted to guests'));
  next();
};

//Only STAFF or ADMIN may pass
const requireStaff = (req, _res, next) => {
  if (!['STAFF', 'ADMIN'].includes(req.user?.role))
    return next(createError(403, 'Staff access required'));
  next();
};

//Only ADMIN may pass
const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN')
    return next(createError(403, 'Admin access required'));
  next();
};

const requireOwnership = (paramKey) => (req, _res, next) => {
  const resourceId = parseInt(req.params[paramKey] || req.body[paramKey]);
  if (req.user.role === 'GUEST' && req.user.id !== resourceId)
    return next(createError(403, 'You do not have access to this resource'));
  next();
};

module.exports = { authenticate, requireGuest, requireStaff, requireAdmin, requireOwnership };
