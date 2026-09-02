// ============================================================
// 📁 backend/controllers/bookingController.js
// Controller untuk Pembuatan Reservasi, Invoice, Riwayat, Pembayaran & Review
// Menggunakan Database Transaction (ACID) untuk mencegah Double Booking
// ============================================================

const { pool, query } = require('../config/db');
const { generateBookingCode } = require('../utils/bookingCode');
const { calculateBookingPrice } = require('../utils/pricing');

/**
 * 1. CREATE BOOKING - Membuat Reservasi Kamar Baru (Protected - Guest & Admin)
 * Route: POST /api/v1/bookings
 * Body: { room_type_id, check_in_date, check_out_date, guest_count, special_requests }
 */
const createBooking = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { room_type_id, check_in_date, check_out_date, guest_count, special_requests } = req.body;

    // --- 1. Validasi Input Dasar ---
    if (!room_type_id || !check_in_date || !check_out_date) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Tipe kamar (room_type_id), tanggal check-in, dan tanggal check-out wajib diisi.',
      });
    }

    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.',
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Tanggal check-out harus lebih besar dari tanggal check-in.',
      });
    }

    // --- 2. Cek Informasi Tipe Kamar & Kapasitas ---
    const typeRes = await client.query(
      'SELECT id, name, base_price, capacity FROM room_types WHERE id = $1',
      [room_type_id]
    );

    if (typeRes.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Tipe kamar yang dipilih tidak ditemukan.',
      });
    }

    const roomType = typeRes.rows[0];
    const requestedGuests = parseInt(guest_count) || 1;

    if (requestedGuests > roomType.capacity) {
      return res.status(400).json({
        status: 'ERROR',
        message: `Kapasitas maksimum untuk ${roomType.name} adalah ${roomType.capacity} orang.`,
      });
    }

    // --- 3. Hitung Durasi & Rincian Harga dengan Pajak 12% ---
    const pricing = calculateBookingPrice(roomType.base_price, check_in_date, check_out_date);

    // --- 4. MULAI DATABASE TRANSACTION (ACID) ---
    await client.query('BEGIN');

    // Cari dan Kunci (Lock) 1 kamar fisik yang masih kosong pada rentang tanggal tersebut
    const findRoomSql = `
      SELECT r.id, r.room_number, r.floor
      FROM rooms r
      WHERE r.room_type_id = $1
        AND r.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_id = r.id
            AND b.status IN ('pending', 'confirmed', 'checked_in')
            AND b.check_in_date < $3
            AND b.check_out_date > $2
        )
      ORDER BY r.room_number ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1;
    `;

    const roomLockRes = await client.query(findRoomSql, [
      room_type_id,
      check_in_date,
      check_out_date,
    ]);

    if (roomLockRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        status: 'ERROR',
        message: `Maaf, seluruh kamar tipe "${roomType.name}" sudah penuh dipesan pada tanggal tersebut. Silakan pilih tanggal atau tipe kamar lain.`,
      });
    }

    const allocatedRoom = roomLockRes.rows[0];

    // --- 5. Generate Kode Booking Unik ---
    const bookingCode = generateBookingCode();

    // --- 6. Simpan Data Booking ---
    const insertBookingSql = `
      INSERT INTO bookings (
        booking_code, user_id, room_id, check_in_date, check_out_date, 
        total_nights, total_price, guest_count, special_requests, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *;
    `;

    const bookingRes = await client.query(insertBookingSql, [
      bookingCode,
      userId,
      allocatedRoom.id,
      check_in_date,
      check_out_date,
      pricing.total_nights,
      pricing.total_price,
      requestedGuests,
      special_requests || null,
    ]);

    const createdBooking = bookingRes.rows[0];

    // --- 7. Buat Tagihan Pembayaran Awal (Payments - status unpaid) ---
    const insertPaymentSql = `
      INSERT INTO payments (booking_id, amount, status)
      VALUES ($1, $2, 'unpaid')
      RETURNING *;
    `;

    const paymentRes = await client.query(insertPaymentSql, [
      createdBooking.id,
      pricing.total_price,
    ]);

    // --- 8. COMMIT TRANSACTION ---
    await client.query('COMMIT');

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Reservasi berhasil dibuat! Silakan lanjutkan ke pembayaran.',
      data: {
        booking: {
          id: createdBooking.id,
          booking_code: createdBooking.booking_code,
          room_type_name: roomType.name,
          room_number: allocatedRoom.room_number,
          floor: allocatedRoom.floor,
          check_in_date: createdBooking.check_in_date,
          check_out_date: createdBooking.check_out_date,
          guest_count: createdBooking.guest_count,
          special_requests: createdBooking.special_requests,
          status: createdBooking.status,
          created_at: createdBooking.created_at,
        },
        pricing_breakdown: pricing,
        payment: {
          id: paymentRes.rows[0].id,
          amount: paymentRes.rows[0].amount,
          status: paymentRes.rows[0].status,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Create Booking Error:', error.message);
    next(error);
  } finally {
    client.release();
  }
};

/**
 * 2. GET BOOKING BY ID / KODE - Mendapatkan detail e-voucher / invoice
 * Route: GET /api/v1/bookings/:id (Protected - Owner or Admin)
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const sql = `
      SELECT 
        b.id,
        b.booking_code,
        b.check_in_date,
        b.check_out_date,
        b.total_nights,
        b.total_price,
        b.guest_count,
        b.special_requests,
        b.status AS booking_status,
        b.created_at,
        u.id AS guest_id,
        u.full_name AS guest_name,
        u.email AS guest_email,
        u.phone AS guest_phone,
        rt.id AS room_type_id,
        rt.name AS room_type_name,
        rt.base_price AS price_per_night,
        rt.image_url AS room_image,
        r.room_number,
        r.floor,
        p.id AS payment_id,
        p.payment_method,
        p.amount AS payment_amount,
        p.status AS payment_status,
        p.paid_at
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE b.id::text = $1 OR b.booking_code = $1;
    `;

    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Data reservasi tidak ditemukan.',
      });
    }

    const booking = result.rows[0];

    // Otorisasi: Hanya pemilik booking atau Admin yang boleh melihat
    if (userRole !== 'admin' && booking.guest_id !== userId) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Anda tidak memiliki izin untuk melihat reservasi ini.',
      });
    }

    const pricing = calculateBookingPrice(
      booking.price_per_night,
      booking.check_in_date,
      booking.check_out_date
    );

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Detail reservasi berhasil diambil.',
      data: {
        booking,
        pricing_breakdown: pricing,
      },
    });
  } catch (error) {
    console.error('❌ Get Booking By ID Error:', error.message);
    next(error);
  }
};

/**
 * 3. GET MY BOOKINGS - Mendapatkan seluruh riwayat booking user aktif
 * Route: GET /api/v1/bookings/my-bookings (Protected - Logged In User)
 */
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        b.id,
        b.booking_code,
        b.check_in_date,
        b.check_out_date,
        b.total_nights,
        b.total_price,
        b.guest_count,
        b.status AS booking_status,
        b.created_at,
        rt.name AS room_type_name,
        rt.image_url AS room_image,
        r.room_number,
        p.status AS payment_status,
        p.payment_method
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC;
    `;

    const result = await query(sql, [userId]);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Riwayat pemesanan berhasil diambil.',
      count: result.rowCount,
      data: {
        bookings: result.rows,
      },
    });
  } catch (error) {
    console.error('❌ Get My Bookings Error:', error.message);
    next(error);
  }
};

/**
 * 4. GET ALL BOOKINGS - Mendapatkan seluruh reservasi di hotel (Admin Only)
 * Route: GET /api/v1/bookings/admin/all (Protected - Admin Only)
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT 
        b.id,
        b.booking_code,
        b.check_in_date,
        b.check_out_date,
        b.total_nights,
        b.total_price,
        b.guest_count,
        b.status AS booking_status,
        b.created_at,
        u.full_name AS guest_name,
        u.email AS guest_email,
        u.phone AS guest_phone,
        rt.name AS room_type_name,
        r.room_number,
        p.status AS payment_status,
        p.payment_method
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Seluruh data reservasi berhasil diambil.',
      count: result.rowCount,
      page: parseInt(page),
      data: {
        bookings: result.rows,
      },
    });
  } catch (error) {
    console.error('❌ Get All Bookings Error:', error.message);
    next(error);
  }
};

/**
 * 5. PAY BOOKING - Simulasi Pembayaran Reservasi (Protected - Owner or Admin)
 * Route: POST /api/v1/bookings/:id/pay
 * Body: { payment_method: 'bank_transfer' | 'credit_card' | 'ewallet' | 'cash' }
 */
const payBooking = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { payment_method = 'bank_transfer' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const validMethods = ['bank_transfer', 'credit_card', 'ewallet', 'cash'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({
        status: 'ERROR',
        message: `Metode pembayaran tidak valid. Pilihan: ${validMethods.join(', ')}`,
      });
    }

    await client.query('BEGIN');

    // Cek data booking dengan locking
    const bookingRes = await client.query(
      `SELECT * FROM bookings 
       WHERE id::text = $1 OR booking_code = $1 
       FOR UPDATE`,
      [id]
    );

    if (bookingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'ERROR',
        message: 'Data reservasi tidak ditemukan.',
      });
    }

    const booking = bookingRes.rows[0];

    // Ambil data payment terkait
    const paymentCheckRes = await client.query(
      `SELECT * FROM payments WHERE booking_id = $1 FOR UPDATE`,
      [booking.id]
    );

    const paymentRecord = paymentCheckRes.rows[0];

    // Cek kepemilikan
    if (userRole !== 'admin' && booking.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Anda tidak memiliki izin untuk membayar reservasi ini.',
      });
    }

    if (booking.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'ERROR',
        message: 'Tidak dapat membayar reservasi yang sudah dibatalkan.',
      });
    }

    if (paymentRecord && paymentRecord.status === 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'ERROR',
        message: 'Tagihan reservasi ini sudah dibayar sebelumnya.',
      });
    }

    // 1. Update status di tabel payments
    const updatePaymentSql = `
      UPDATE payments 
      SET status = 'paid', 
          payment_method = $1, 
          paid_at = CURRENT_TIMESTAMP, 
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $2
      RETURNING *;
    `;
    const paymentResult = await client.query(updatePaymentSql, [payment_method, booking.id]);

    // 2. Update status booking menjadi 'confirmed'
    const updateBookingSql = `
      UPDATE bookings 
      SET status = 'confirmed', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const bookingResult = await client.query(updateBookingSql, [booking.id]);

    await client.query('COMMIT');

    return res.status(200).json({
      status: 'SUCCESS',
      message: '🎉 Pembayaran berhasil dikonfirmasi! Reservasi Anda sekarang CONFIRMED.',
      data: {
        booking: bookingResult.rows[0],
        payment: paymentResult.rows[0],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Pay Booking Error:', error.message);
    next(error);
  } finally {
    client.release();
  }
};

/**
 * 6. CANCEL BOOKING - Membatalkan Reservasi (Protected - Owner or Admin)
 * Route: POST /api/v1/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const bookingRes = await query(
      'SELECT id, user_id, status FROM bookings WHERE id::text = $1 OR booking_code = $1',
      [id]
    );

    if (bookingRes.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Data reservasi tidak ditemukan.',
      });
    }

    const booking = bookingRes.rows[0];

    if (userRole !== 'admin' && booking.user_id !== userId) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Anda tidak memiliki izin untuk membatalkan reservasi ini.',
      });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'ERROR',
        message: `Reservasi tidak dapat dibatalkan karena status saat ini adalah "${booking.status}".`,
      });
    }

    const updateRes = await query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, booking_code, status, updated_at`,
      [booking.id]
    );

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Reservasi berhasil dibatalkan. Kamar telah dilepaskan kembali.',
      data: {
        booking: updateRes.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Cancel Booking Error:', error.message);
    next(error);
  }
};

/**
 * 7. UPDATE BOOKING STATUS - Mengubah status booking (Admin Only)
 * Route: PATCH /api/v1/bookings/:id/status (Protected - Admin Only)
 * Body: { status: 'confirmed' | 'checked_in' | 'completed' | 'cancelled' }
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'ERROR',
        message: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}`,
      });
    }

    const result = await query(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id::text = $2 OR booking_code = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Data reservasi tidak ditemukan.',
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Status reservasi berhasil diubah menjadi "${status}".`,
      data: {
        booking: result.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Update Booking Status Error:', error.message);
    next(error);
  }
};

/**
 * 8. SUBMIT REVIEW - Memberikan Rating & Ulasan untuk Kamar yang Dipesan (Protected)
 * Route: POST /api/v1/bookings/:id/review
 * Body: { rating: 1-5, comment: string }
 */
const submitReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const parsedRating = parseInt(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Rating harus berupa angka antara 1 sampai 5 bintang.',
      });
    }

    const bookingRes = await query(
      'SELECT id, user_id, status FROM bookings WHERE id::text = $1 OR booking_code = $1',
      [id]
    );

    if (bookingRes.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Data reservasi tidak ditemukan.',
      });
    }

    const booking = bookingRes.rows[0];

    if (booking.user_id !== userId) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Anda hanya dapat memberi ulasan pada reservasi milik Anda sendiri.',
      });
    }

    // Cek apakah sudah pernah review sebelumnya
    const existingReview = await query('SELECT id FROM reviews WHERE booking_id = $1', [booking.id]);
    if (existingReview.rowCount > 0) {
      return res.status(409).json({
        status: 'ERROR',
        message: 'Anda sudah memberikan ulasan untuk reservasi ini sebelumnya.',
      });
    }

    const insertSql = `
      INSERT INTO reviews (booking_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      booking.id,
      userId,
      parsedRating,
      comment ? comment.trim() : null,
    ]);

    return res.status(201).json({
      status: 'SUCCESS',
      message: '⭐ Terima kasih! Ulasan dan rating Anda berhasil disimpan.',
      data: {
        review: result.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Submit Review Error:', error.message);
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookingById,
  getMyBookings,
  getAllBookings,
  payBooking,
  cancelBooking,
  updateBookingStatus,
  submitReview,
};
