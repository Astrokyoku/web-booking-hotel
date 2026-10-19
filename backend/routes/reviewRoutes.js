// ============================================================
// 📁 backend/routes/reviewRoutes.js
// Routing untuk Rating & Ulasan Hotel (/api/v1/reviews)
// ============================================================

const express = require('express');
const router = express.Router();

const {
  getAllReviews,
  createReview,
  getMyReviews,
  deleteReview,
} = require('../controllers/reviewController');

const { authenticate } = require('../middleware/authMiddleware');

// GET /api/v1/reviews - Mengambil seluruh ulasan hotel & ringkasan statistik (Public)
router.get('/', getAllReviews);

// GET /api/v1/reviews/my-reviews - Mengambil riwayat ulasan akun aktif (Protected)
router.get('/my-reviews', authenticate, getMyReviews);

// POST /api/v1/reviews - Memberikan rating dan ulasan hotel (Protected)
router.post('/', authenticate, createReview);

// DELETE /api/v1/reviews/:id - Menghapus ulasan (Owner atau Admin)
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
