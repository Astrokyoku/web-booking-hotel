// ============================================================
// 📁 backend/middleware/authMiddleware.js
// Middleware untuk Autentikasi JWT & Role-Based Access Control
// ============================================================

const { verifyToken } = require('../utils/jwt');
const { query } = require('../config/db');

/**
 * Middleware untuk memverifikasi apakah request membawa Token JWT yang valid
 * Menempelkan data user yang terverifikasi ke `req.user`
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Cek apakah header Authorization ada dan berformat "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Akses ditolak: Token autentikasi tidak ditemukan. Harap sertakan Bearer Token.',
      });
    }

    // 2. Ambil token dari header
    const token = authHeader.split(' ')[1];

    // 3. Verifikasi token menggunakan JWT helper
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'ERROR',
          message: 'Sesi login telah berakhir (Token expired). Silakan login kembali.',
        });
      }
      return res.status(401).json({
        status: 'ERROR',
        message: 'Token tidak valid atau telah dimodifikasi.',
      });
    }

    // 4. Pastikan user pemilik token masih terdaftar di database
    const userResult = await query(
      'SELECT id, full_name, email, role, phone FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Pengguna pemilik token ini sudah tidak terdaftar.',
      });
    }

    // 5. Lampirkan informasi user ke objek request
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('❌ Auth Middleware Error:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Terjadi kesalahan pada verifikasi autentikasi.',
    });
  }
};

/**
 * Middleware untuk membatasi akses khusus pengguna dengan role 'admin'
 * Harus dipasang SETELAH middleware `authenticate`
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'ERROR',
      message: 'Akses ditolak: Tindakan ini memerlukan hak akses Administrator.',
    });
  }
  next();
};

/**
 * Helper middleware untuk membatasi akses ke beberapa role tertentu
 * @param  {...string} roles - Daftar role yang diizinkan (misal: 'admin', 'guest')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'ERROR',
        message: `Akses ditolak: Hanya role [${roles.join(', ')}] yang diizinkan.`,
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeRoles,
};
