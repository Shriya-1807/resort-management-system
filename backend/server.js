'use strict';

require('dotenv').config();
const app  = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected');
    conn.release();

    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}  [${process.env.NODE_ENV || 'development'}]`)
    );
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }
})();