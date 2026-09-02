// ============================================================
// 📁 backend/utils/jwt.js
// Helper untuk pembuatan (signing) dan verifikasi JSON Web Token (JWT)
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_hotel2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Membuat access token JWT dari payload data user
 * @param {object} payload - Objek berisi identitas user (id, email, role)
 * @returns {string} - Signed JWT token string
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Memverifikasi keabsahan JWT token
 * @param {string} token - JWT token string dari Authorization header
 * @returns {object} - Payload terdekripsi jika valid
 * @throws {Error} - Error jika token tidak valid / sudah kedaluwarsa
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
