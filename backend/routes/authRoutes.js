// ============================================================
// 📁 backend/routes/authRoutes.js
// Routing untuk Autentikasi Pengguna (/api/v1/auth)
// ============================================================

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
} = require('../controllers/authController');

const { authenticate } = require('../middleware/authMiddleware');

// ============================================================
// PUBLIC ROUTES (Dapat diakses tanpa token)
// ============================================================

// POST /api/v1/auth/register - Pendaftaran tamu baru
router.post('/register', register);

// POST /api/v1/auth/login - Login tamu / admin
router.post('/login', login);

// ============================================================
// PROTECTED ROUTES (Wajib menyertakan Bearer Token)
// ============================================================

// GET /api/v1/auth/me - Mendapatkan profil pengguna yang sedang login
router.get('/me', authenticate, getProfile);

// PUT /api/v1/auth/profile - Memperbarui nama/telepon/password akun
router.put('/profile', authenticate, updateProfile);

module.exports = router;
