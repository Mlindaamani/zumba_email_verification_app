const crypto = require('node:crypto');

/**
 * Generate a random salt for password hashing
 * @returns {string} 32-character hex string
 */
const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Hash a password with a given salt using PBKDF2
 * @param {string} password - Plain text password
 * @param {string} salt - Salt string
 * @returns {string} Hashed password
 */
const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
};

/**
 * Generate a random token for email verification
 * @returns {string} 64-character hex string
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateSalt,
  hashPassword,
  generateToken,
};
