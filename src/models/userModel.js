const pool = require('../config/database');

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
const findByEmail = async (email) => {
  const rows = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const findById = async (id) => {
  const rows = await pool.query(
    'SELECT id, name, email, verified FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

/**
 * Find user by verification token
 * @param {string} token - Verification token
 * @returns {Promise<Object|null>} User object or null
 */
const findByVerifyToken = async (token) => {
  const rows = await pool.query(
    'SELECT id, email FROM users WHERE verify_token = ?',
    [token]
  );
  return rows[0] || null;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Insert result
 */
const create = async (userData) => {
  const { name, email, passwordHash, salt, verifyToken } = userData;
  return await pool.query(
    'INSERT INTO users (name, email, password_hash, password_salt, verified, verify_token) VALUES (?, ?, ?, ?, 0, ?)',
    [name, email, passwordHash, salt, verifyToken]
  );
};

/**
 * Mark user as verified and clear verification token
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Update result
 */
const markAsVerified = async (userId) => {
  return await pool.query(
    'UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?',
    [userId]
  );
};

module.exports = {
  findByEmail,
  findById,
  findByVerifyToken,
  create,
  markAsVerified,
};
