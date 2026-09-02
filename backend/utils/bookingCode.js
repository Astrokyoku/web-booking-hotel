// ============================================================
// 📁 backend/utils/bookingCode.js
// Generator Kode Unik Reservasi Hotel (Format: HTL-YYYYMMDD-XXX)
// ============================================================

const crypto = require('crypto');

/**
 * Menghasilkan kode booking unik
 * Contoh output: HTL-20260810-7B9
 * @returns {string} - Kode booking unik
 */
const generateBookingCode = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate 3 karakter acak (huruf besar & angka)
  const randomChars = crypto.randomBytes(2).toString('hex').substring(0, 3).toUpperCase();

  return `HTL-${dateStr}-${randomChars}`;
};

module.exports = {
  generateBookingCode,
};
