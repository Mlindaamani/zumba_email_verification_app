const mysql = require('mysql');
const util = require('node:util');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'email_verification',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Promisify pool.query for async/await
pool.query = util.promisify(pool.query);

module.exports = pool;
