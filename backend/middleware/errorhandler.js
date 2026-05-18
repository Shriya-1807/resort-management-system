// Centralised Error Handler

'use strict';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const errorHandler = (err, _req, res, _next) => {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with that value already exists.' });
  }
  if (err.code === 'ER_SIGNAL_EXCEPTION') {
    return res.status(400).json({ error: err.sqlMessage || err.message });
  }

  const status  = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  if (status >= 500) console.error('[ERROR]', err);

  return res.status(status).json({ error: message });
};

module.exports = { createError , errorHandler };