const pool = require("../config/database");

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
const findByEmail = async (email) => {
  const rows = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const findById = async (id) => {
  const rows = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] || null;
};

/**
 * Find user by verification token
 * @param {string} token - Verification token
 * @returns {Promise<Object|null>} User object or null
 */
const findByVerifyToken = async (token) => {
  const rows = await pool.query("SELECT * FROM users WHERE verify_token = ?", [
    token,
  ]);
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
    "INSERT INTO users (name, email, password_hash, password_salt, verify_token, verified, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())",
    [name, email, passwordHash, salt, verifyToken],
  );
};

/**
 * Mark user as verified
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Update result
 */
const markAsVerified = async (userId) => {
  return await pool.query(
    "UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?",
    [userId],
  );
};

/**
 * Create a password reset token for user
 * @param {number} userId - User ID
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Insert result
 */
const createResetToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  return await pool.query(
    "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
    [token, expiresAt, userId],
  );
};

/**
 * Find user by reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} User object or null
 */
const findByResetToken = async (token) => {
  const rows = await pool.query(
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
    [token],
  );
  return rows[0] || null;
};

/**
 * Update user password
 * @param {number} userId - User ID
 * @param {string} passwordHash - New password hash
 * @param {string} salt - New salt
 * @returns {Promise<Object>} Update result
 */
const updatePassword = async (userId, passwordHash, salt) => {
  return await pool.query(
    "UPDATE users SET password_hash = ?, password_salt = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
    [passwordHash, salt, userId],
  );
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {string} name - User name
 * @returns {Promise<Object>} Update result
 */
const updateProfile = async (userId, name) => {
  return await pool.query("UPDATE users SET name = ? WHERE id = ?", [
    name,
    userId,
  ]);
};

/**
 * Create activity log entry
 * @param {number} userId - User ID
 * @param {string} activity - Activity description
 * @param {string} ipAddress - IP address
 * @returns {Promise<Object>} Insert result
 */
const logActivity = async (userId, activity, ipAddress = null) => {
  return await pool.query(
    "INSERT INTO activity_logs (user_id, activity, ip_address, created_at) VALUES (?, ?, ?, NOW())",
    [userId, activity, ipAddress],
  );
};

/**
 * Get user activity logs
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>} Activity logs
 */
const getActivityLogs = async (userId, limit = 10) => {
  return await pool.query(
    "SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
};

module.exports = {
  findByEmail,
  findById,
  findByVerifyToken,
  create,
  markAsVerified,
  createResetToken,
  findByResetToken,
  updatePassword,
  updateProfile,
  logActivity,
  getActivityLogs,
};

