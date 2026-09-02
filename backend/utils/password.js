// ============================================================
// 📁 backend/utils/password.js
// Helper untuk hashing dan verifikasi password menggunakan bcryptjs
// ============================================================

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Mengenkripsi password mentah menjadi hash yang aman
 * @param {string} plainPassword - Password teks biasa dari input pengguna
 * @returns {Promise<string>} - Password hash string
 */
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Membandingkan password teks biasa dengan password hash di database
 * @param {string} plainPassword - Password yang dimasukkan saat login
 * @param {string} hashedPassword - Hash password tersimpan di database
 * @returns {Promise<boolean>} - true jika cocok, false jika salah
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
