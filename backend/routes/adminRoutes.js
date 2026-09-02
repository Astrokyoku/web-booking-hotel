// ============================================================
// 📁 backend/routes/adminRoutes.js
// Rute REST API Khusus Administrator & Resepsionis Hotel
// Dilindungi oleh Middleware Autentikasi JWT & Role Admin
// ============================================================

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// Pasang proteksi global untuk seluruh rute admin
router.use(authenticate, authorizeAdmin);

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Mengambil statistik KPI, total pendapatan, okupansi, dan data aktivitas
 * @access  Private (Admin Only)
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/bookings
 * @desc    Mengambil seluruh data reservasi tamu dengan filter status & search
 * @access  Private (Admin Only)
 */
router.get('/bookings', adminController.getAllBookings);

/**
 * @route   PUT /api/v1/admin/bookings/:id/status
 * @desc    Mengubah status reservasi (check-in, check-out, confirm, cancel)
 * @access  Private (Admin Only)
 */
router.put('/bookings/:id/status', adminController.updateBookingStatus);

/**
 * @route   GET /api/v1/admin/rooms
 * @desc    Mengambil seluruh data inventori kamar fisik & status okupansinya
 * @access  Private (Admin Only)
 */
router.get('/rooms', adminController.getAllRooms);

/**
 * @route   POST /api/v1/admin/rooms
 * @desc    Menambahkan kamar fisik baru ke dalam hotel
 * @access  Private (Admin Only)
 */
router.post('/rooms', adminController.createRoom);

/**
 * @route   PUT /api/v1/admin/rooms/:id/status
 * @desc    Mengubah status fisik kamar (available, occupied, maintenance, cleaning)
 * @access  Private (Admin Only)
 */
router.put('/rooms/:id/status', adminController.updateRoomStatus);

/**
 * @route   GET /api/v1/admin/guests
 * @desc    Mengambil direktori seluruh tamu hotel, kontak & riwayat transaksinya
 * @access  Private (Admin Only)
 */
router.get('/guests', adminController.getAllGuests);

/**
 * @route   PUT /api/v1/admin/guests/:id/blacklist
 * @desc    Mengubah status akun tamu menjadi blacklisted
 * @access  Private (Admin Only)
 */
router.put('/guests/:id/blacklist', adminController.blacklistGuest);

/**
 * @route   PUT /api/v1/admin/guests/:id/reset-password
 * @desc    Merubah password tamu menjadi default password123
 * @access  Private (Admin Only)
 */
router.put('/guests/:id/reset-password', adminController.resetGuestPassword);

module.exports = router;
