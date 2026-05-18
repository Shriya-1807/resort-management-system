// express-validator result checker

'use strict';

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error  : 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
};

module.exports = { validate };