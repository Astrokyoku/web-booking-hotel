// ============================================================
// 📁 backend/routes/roomRoutes.js
// Routing untuk Manajemen Kamar & Katalog (/api/v1/rooms)
// ============================================================

const express = require('express');
const router = express.Router();

const {
  getAllRoomTypes,
  checkAvailability,
  getRoomTypeById,
  createRoomType,
  createPhysicalRoom,
  updateRoomType,
  deleteRoomType,
} = require('../controllers/roomController');

const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// ============================================================
// PUBLIC ROUTES (Katalog Kamar & Pencarian)
// ============================================================

// GET /api/v1/rooms - Mengambil semua tipe kamar
router.get('/', getAllRoomTypes);

// GET /api/v1/rooms/search/availability - Pencarian ketersediaan kamar kosong & hitung pajak 12%
router.get('/search/availability', checkAvailability);

// GET /api/v1/rooms/:id - Detail tipe kamar
router.get('/:id', getRoomTypeById);

// ============================================================
// ADMIN ONLY ROUTES (Manajemen Kamar)
// ============================================================

// POST /api/v1/rooms/types - Tambah tipe kamar baru
router.post('/types', authenticate, authorizeAdmin, createRoomType);

// POST /api/v1/rooms/physical - Tambah nomor kamar fisik baru
router.post('/physical', authenticate, authorizeAdmin, createPhysicalRoom);

// PUT /api/v1/rooms/types/:id - Update tipe kamar
router.put('/types/:id', authenticate, authorizeAdmin, updateRoomType);

// DELETE /api/v1/rooms/types/:id - Hapus tipe kamar
router.delete('/types/:id', authenticate, authorizeAdmin, deleteRoomType);

module.exports = router;
