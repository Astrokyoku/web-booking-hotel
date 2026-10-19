// ============================================================
// 📁 backend/controllers/reviewController.js
// Controller untuk Rating & Ulasan Hotel oleh Tamu (Guest)
// ============================================================

const { query } = require('../config/db');

/**
 * 1. GET ALL REVIEWS - Mengambil semua ulasan dan statistik rating hotel (Public)
 * Route: GET /api/v1/reviews
 */
const getAllReviews = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;

    // 1. Ambil daftar ulasan beserta info user dan tipe kamar (jika terkait booking)
    const listSql = `
      SELECT 
        r.id,
        r.user_id,
        r.booking_id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS reviewer_name,
        u.role AS user_role,
        b.booking_code,
        rt.name AS room_type_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN rooms rm ON b.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      ORDER BY r.created_at DESC
      LIMIT $1;
    `;
    const listResult = await query(listSql, [limit]);

    // 2. Hitung statistik agregat (Rata-rata, Total Ulasan, Breakdown Bintang)
    const statsSql = `
      SELECT 
        COUNT(*)::int AS total_reviews,
        COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) AS average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END)::int AS star_5,
        COUNT(CASE WHEN rating = 4 THEN 1 END)::int AS star_4,
        COUNT(CASE WHEN rating = 3 THEN 1 END)::int AS star_3,
        COUNT(CASE WHEN rating = 2 THEN 1 END)::int AS star_2,
        COUNT(CASE WHEN rating = 1 THEN 1 END)::int AS star_1
      FROM reviews;
    `;
    const statsResult = await query(statsSql);
    const stats = statsResult.rows[0] || {
      total_reviews: 0,
      average_rating: 5.0,
      star_5: 0,
      star_4: 0,
      star_3: 0,
      star_2: 0,
      star_1: 0,
    };

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Data ulasan hotel berhasil dimuat.',
      data: {
        stats: {
          total_reviews: parseInt(stats.total_reviews, 10),
          average_rating: parseFloat(stats.average_rating),
          stars_breakdown: {
            5: parseInt(stats.star_5, 10),
            4: parseInt(stats.star_4, 10),
            3: parseInt(stats.star_3, 10),
            2: parseInt(stats.star_2, 10),
            1: parseInt(stats.star_1, 10),
          },
        },
        reviews: listResult.rows,
      },
    });
  } catch (error) {
    console.error('❌ Get All Reviews Error:', error.message);
    next(error);
  }
};

/**
 * 2. CREATE REVIEW - Tamu mengirim ulasan dan rating hotel (Protected)
 * Route: POST /api/v1/reviews
 * Body: { rating: 1-5, comment: string, booking_id?: string }
 */
const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rating, comment, booking_id } = req.body;

    // Cek status akun user (blacklist tidak boleh memberi ulasan)
    const userCheck = await query('SELECT id, status, full_name FROM users WHERE id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Pengguna tidak ditemukan.',
      });
    }

    if (userCheck.rows[0].status === 'blacklisted') {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Akun Anda sedang dalam daftar hitam (blacklisted) dan tidak dapat memberikan ulasan.',
      });
    }

    // Validasi rating
    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Nilai rating tidak valid. Harap pilih bintang antara 1 sampai 5.',
      });
    }

    // Validasi komentar
    const trimmedComment = comment ? comment.trim() : '';
    if (!trimmedComment || trimmedComment.length < 3) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Komentar ulasan wajib diisi (minimal 3 karakter).',
      });
    }

    let validBookingId = null;

    // Jika review dikaitkan dengan booking kamar
    if (booking_id) {
      const bookingRes = await query(
        'SELECT id, user_id, status FROM bookings WHERE (id::text = $1 OR booking_code = $1)',
        [booking_id]
      );

      if (bookingRes.rowCount === 0) {
        return res.status(404).json({
          status: 'ERROR',
          message: 'Data reservasi yang ingin diulas tidak ditemukan.',
        });
      }

      const booking = bookingRes.rows[0];

      if (booking.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'ERROR',
          message: 'Akses ditolak: Anda hanya dapat memberi ulasan pada reservasi milik akun Anda sendiri.',
        });
      }

      // Cek apakah reservasi ini sudah pernah diulas sebelumnya
      const existingBookingReview = await query(
        'SELECT id FROM reviews WHERE booking_id = $1',
        [booking.id]
      );
      if (existingBookingReview.rowCount > 0) {
        return res.status(409).json({
          status: 'ERROR',
          message: 'Anda sudah pernah memberikan ulasan untuk reservasi ini.',
        });
      }

      validBookingId = booking.id;
    }

    // Simpan ulasan ke database
    const insertSql = `
      INSERT INTO reviews (user_id, booking_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const insertResult = await query(insertSql, [
      userId,
      validBookingId,
      parsedRating,
      trimmedComment,
    ]);

    const createdReview = insertResult.rows[0];

    // Ambil info lengkap ulasan yang baru dibuat
    const fullReviewSql = `
      SELECT 
        r.id,
        r.user_id,
        r.booking_id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS reviewer_name,
        u.role AS user_role,
        b.booking_code,
        rt.name AS room_type_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN rooms rm ON b.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      WHERE r.id = $1;
    `;
    const fullReviewRes = await query(fullReviewSql, [createdReview.id]);

    return res.status(201).json({
      status: 'SUCCESS',
      message: '⭐ Terima kasih banyak! Ulasan dan rating Anda berhasil disimpan.',
      data: {
        review: fullReviewRes.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Create Review Error:', error.message);
    next(error);
  }
};

/**
 * 3. GET MY REVIEWS - Mengambil riwayat ulasan yang ditulis oleh user yang login (Protected)
 * Route: GET /api/v1/reviews/my-reviews
 */
const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        r.id,
        r.booking_id,
        r.rating,
        r.comment,
        r.created_at,
        b.booking_code,
        rt.name AS room_type_name
      FROM reviews r
      LEFT JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN rooms rm ON b.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC;
    `;
    const result = await query(sql, [userId]);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Riwayat ulasan pengguna berhasil diambil.',
      data: {
        reviews: result.rows,
      },
    });
  } catch (error) {
    console.error('❌ Get My Reviews Error:', error.message);
    next(error);
  }
};

/**
 * 4. DELETE REVIEW - Menghapus ulasan (User pemilik ulasan atau Admin)
 * Route: DELETE /api/v1/reviews/:id (Protected)
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const findSql = 'SELECT id, user_id FROM reviews WHERE id::text = $1';
    const findRes = await query(findSql, [id]);

    if (findRes.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Ulasan tidak ditemukan.',
      });
    }

    const review = findRes.rows[0];

    // Hanya pemilik ulasan atau role admin yang boleh menghapus
    if (review.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Anda tidak memiliki izin untuk menghapus ulasan ini.',
      });
    }

    await query('DELETE FROM reviews WHERE id::text = $1', [id]);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Ulasan berhasil dihapus.',
    });
  } catch (error) {
    console.error('❌ Delete Review Error:', error.message);
    next(error);
  }
};

module.exports = {
  getAllReviews,
  createReview,
  getMyReviews,
  deleteReview,
};
