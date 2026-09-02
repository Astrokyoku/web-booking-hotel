// ============================================================
// 📁 backend/controllers/authController.js
// Controller untuk Registrasi, Login, dan Profil Pengguna
// ============================================================

const { query } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

// Regex sederhana untuk validasi format email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 1. REGISTER - Mendaftarkan akun tamu (Guest) baru
 * Route: POST /api/v1/auth/register (Public)
 */
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // --- Validasi Input ---
    if (!full_name || !email || !password) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Nama lengkap, email, dan password wajib diisi.',
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Format email tidak valid.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Password minimal harus terdiri dari 6 karakter.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- Cek apakah email sudah terdaftar ---
    const existingUser = await query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        status: 'ERROR',
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
      });
    }

    // --- Hash Password & Simpan ke Database ---
    const passwordHash = await hashPassword(password);
    const role = 'guest'; // Pendaftaran publik selalu sebagai 'guest'

    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, phone, created_at`,
      [full_name.trim(), normalizedEmail, passwordHash, role, phone ? phone.trim() : null]
    );

    const newUser = result.rows[0];

    // --- Generate JWT Token langsung untuk auto-login ---
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Registrasi akun berhasil!',
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    console.error('❌ Register Error:', error.message);
    next(error);
  }
};

/**
 * 2. LOGIN - Autentikasi Pengguna (Admin & Guest)
 * Route: POST /api/v1/auth/login (Public)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // --- Validasi Input ---
    if (!email || !password) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Email dan password wajib diisi.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- Cari User berdasarkan Email ---
    const result = await query(
      'SELECT id, full_name, email, password_hash, role, status, phone, created_at FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Email atau password yang Anda masukkan salah.',
      });
    }

    const user = result.rows[0];

    // --- Cek Status Akun (Blacklist) ---
    if (user.status === 'blacklisted') {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akun Anda telah dinonaktifkan (blacklist) oleh Administrator.',
      });
    }

    // --- Verifikasi Password dengan Bcrypt ---
    const isPasswordMatch = await comparePassword(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Email atau password yang Anda masukkan salah.',
      });
    }

    // --- Generate JWT Token ---
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Hapus password_hash dari response agar aman
    delete user.password_hash;

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Selamat datang kembali, ${user.full_name}!`,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    next(error);
  }
};

/**
 * 3. GET PROFILE - Mendapatkan info profil akun yang sedang login
 * Route: GET /api/v1/auth/me (Protected - All Authenticated Users)
 */
const getProfile = async (req, res) => {
  // `req.user` sudah diisi oleh middleware `authenticate`
  return res.status(200).json({
    status: 'SUCCESS',
    message: 'Profil pengguna berhasil diambil.',
    data: {
      user: req.user,
    },
  });
};

/**
 * 4. UPDATE PROFILE - Mengubah data profil atau password
 * Route: PUT /api/v1/auth/profile (Protected - All Authenticated Users)
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, current_password, new_password } = req.body;

    // Ambil data user saat ini
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Pengguna tidak ditemukan.',
      });
    }

    const currentHash = userResult.rows[0].password_hash;
    let updatedPasswordHash = currentHash;

    // Jika user ingin mengganti password
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Password saat ini (current_password) wajib diisi untuk mengganti password.',
        });
      }

      const isMatch = await comparePassword(current_password, currentHash);
      if (!isMatch) {
        return res.status(401).json({
          status: 'ERROR',
          message: 'Password saat ini yang Anda masukkan salah.',
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Password baru minimal harus 6 karakter.',
        });
      }

      updatedPasswordHash = await hashPassword(new_password);
    }

    // Update data di database
    const updateResult = await query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           password_hash = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, full_name, email, role, phone, updated_at`,
      [
        full_name ? full_name.trim() : null,
        phone !== undefined ? phone : null,
        updatedPasswordHash,
        userId,
      ]
    );

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Profil berhasil diperbarui.',
      data: {
        user: updateResult.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Update Profile Error:', error.message);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};
