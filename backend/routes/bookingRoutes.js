// ============================================================
// 📁 backend/routes/bookingRoutes.js
// Routing Lengkap untuk Reservasi, Pembayaran, Status & Review (/api/v1/bookings)
// ============================================================

const express = require('express');
const router = express.Router();

const {
  createBooking,
  getBookingById,
  getMyBookings,
  getAllBookings,
  payBooking,
  cancelBooking,
  updateBookingStatus,
  submitReview,
} = require('../controllers/bookingController');

const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// ============================================================
// PROTECTED ROUTES (Tamu & Pengguna Login)
// ============================================================

// POST /api/v1/bookings - Membuat reservasi kamar baru
router.post('/', authenticate, createBooking);

// GET /api/v1/bookings/my-bookings - Melihat riwayat pemesanan akun aktif
router.get('/my-bookings', authenticate, getMyBookings);

// GET /api/v1/bookings/admin/all - Melihat seluruh booking hotel (Admin Only)
router.get('/admin/all', authenticate, authorizeAdmin, getAllBookings);

// GET /api/v1/bookings/:id - Detail reservasi / E-Voucher / Invoice (Owner/Admin)
router.get('/:id', authenticate, getBookingById);

// POST /api/v1/bookings/:id/pay - Simulasi Pembayaran reservasi
router.post('/:id/pay', authenticate, payBooking);

// POST /api/v1/bookings/:id/cancel - Pembatalan reservasi (Owner/Admin)
router.post('/:id/cancel', authenticate, cancelBooking);

// PATCH /api/v1/bookings/:id/status - Update status reservasi (Admin Only)
router.patch('/:id/status', authenticate, authorizeAdmin, updateBookingStatus);

// POST /api/v1/bookings/:id/review - Berikan ulasan & rating bintang 1-5
router.post('/:id/review', authenticate, submitReview);

module.exports = router;
