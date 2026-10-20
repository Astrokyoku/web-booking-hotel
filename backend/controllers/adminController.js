// ============================================================
// 📁 backend/controllers/adminController.js
// Controller untuk Dashboard Admin, Analitik & Manajemen Hotel
// ============================================================

const { pool, query } = require('../config/db');
const { hashPassword } = require('../utils/password');

/**
 * 1. GET /api/v1/admin/stats
 * Mengambil ringkasan statistik KPI & performa hotel secara real-time
 */
const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Revenue (Total Pendapatan dari transaksi yang 'paid')
    const revenueResult = await query(`
      SELECT 
        COALESCE(SUM(p.amount), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN p.paid_at >= CURRENT_DATE - INTERVAL '30 days' THEN p.amount ELSE 0 END), 0) AS monthly_revenue,
        COALESCE(SUM(CASE WHEN p.paid_at >= CURRENT_DATE THEN p.amount ELSE 0 END), 0) AS today_revenue
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.status = 'paid' AND b.status != 'cancelled'
    `);

    // 2. Statistik Reservasi
    const bookingsStatsResult = await query(`
      SELECT 
        COUNT(*) AS total_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_bookings,
        COUNT(CASE WHEN status = 'checked_in' THEN 1 END) AS checked_in_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_bookings,
        COUNT(CASE WHEN check_in_date = CURRENT_DATE AND status IN ('confirmed', 'pending') THEN 1 END) AS today_checkins,
        COUNT(CASE WHEN check_out_date = CURRENT_DATE AND status = 'checked_in' THEN 1 END) AS today_checkouts
      FROM bookings
    `);

    // 3. Statistik Kamar & Okupansi
    const roomsStatsResult = await query(`
      SELECT 
        COUNT(*) AS total_rooms,
        COUNT(CASE WHEN status = 'available' THEN 1 END) AS available_rooms,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) AS occupied_rooms,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) AS maintenance_rooms,
        COUNT(CASE WHEN status = 'cleaning' THEN 1 END) AS cleaning_rooms
      FROM rooms
    `);

    const totalRooms = parseInt(roomsStatsResult.rows[0].total_rooms, 10) || 0;
    const occupiedRooms = parseInt(roomsStatsResult.rows[0].occupied_rooms, 10) || 0;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

    // 4. Total Tamu Terdaftar
    const guestsCountResult = await query(`
      SELECT COUNT(*) AS total_guests FROM users WHERE role = 'guest'
    `);

    // 5. Booking Terbaru (Latest 5 Bookings)
    const recentBookingsResult = await query(`
      SELECT 
        b.id,
        b.booking_code,
        u.full_name AS guest_name,
        u.email AS guest_email,
        rt.name AS room_type_name,
        r.room_number,
        b.check_in_date,
        b.check_out_date,
        b.total_price,
        b.status AS booking_status,
        COALESCE(p.status, 'unpaid') AS payment_status,
        b.created_at
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN payments p ON b.id = p.booking_id
      ORDER BY b.created_at DESC
      LIMIT 6
    `);

    // 6. Statistik Ulasan & Rating
    const reviewsStatsResult = await query(`
      SELECT 
        COUNT(*)::int AS total_reviews,
        COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) AS average_rating
      FROM reviews
    `);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Statistik dashboard admin berhasil diambil.',
      data: {
        financials: {
          total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
          monthly_revenue: parseFloat(revenueResult.rows[0].monthly_revenue),
          today_revenue: parseFloat(revenueResult.rows[0].today_revenue),
        },
        bookings: {
          total: parseInt(bookingsStatsResult.rows[0].total_bookings, 10),
          pending: parseInt(bookingsStatsResult.rows[0].pending_bookings, 10),
          confirmed: parseInt(bookingsStatsResult.rows[0].confirmed_bookings, 10),
          checked_in: parseInt(bookingsStatsResult.rows[0].checked_in_bookings, 10),
          completed: parseInt(bookingsStatsResult.rows[0].completed_bookings, 10),
          cancelled: parseInt(bookingsStatsResult.rows[0].cancelled_bookings, 10),
          today_checkins: parseInt(bookingsStatsResult.rows[0].today_checkins, 10),
          today_checkouts: parseInt(bookingsStatsResult.rows[0].today_checkouts, 10),
        },
        rooms: {
          total: totalRooms,
          available: parseInt(roomsStatsResult.rows[0].available_rooms, 10),
          occupied: occupiedRooms,
          maintenance: parseInt(roomsStatsResult.rows[0].maintenance_rooms, 10),
          cleaning: parseInt(roomsStatsResult.rows[0].cleaning_rooms, 10),
          occupancy_rate_percent: parseFloat(occupancyRate),
        },
        guests: {
          total_registered: parseInt(guestsCountResult.rows[0].total_guests, 10),
        },
        reviews: {
          total: parseInt(reviewsStatsResult.rows[0].total_reviews, 10),
          average_rating: parseFloat(reviewsStatsResult.rows[0].average_rating),
        },
        recent_bookings: recentBookingsResult.rows,
      },
    });
  } catch (error) {
    console.error('❌ Admin getDashboardStats Error:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Gagal memuat statistik dashboard.',
      error: error.message,
    });
  }
};

/**
 * 2. GET /api/v1/admin/bookings
 * Mengambil seluruh daftar reservasi dengan filter status & pencarian
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      whereClauses.push(`b.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search && search.trim() !== '') {
      whereClauses.push(`(
        b.booking_code ILIKE $${paramIndex} OR 
        u.full_name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        r.room_number ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total Count
    const countResult = await query(`
      SELECT COUNT(*) AS total
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      ${whereString}
    `, queryParams);

    const totalRecords = parseInt(countResult.rows[0].total, 10);

    // Fetch Records
    const bookingsQuery = `
      SELECT 
        b.id,
        b.booking_code,
        b.user_id,
        u.full_name AS guest_name,
        u.email AS guest_email,
        u.phone AS guest_phone,
        b.room_id,
        r.room_number,
        r.floor,
        rt.id AS room_type_id,
        rt.name AS room_type_name,
        rt.image_url AS room_image_url,
        b.check_in_date,
        b.check_out_date,
        b.total_nights,
        b.total_price,
        b.status AS booking_status,
        b.special_requests,
        COALESCE(p.id, NULL) AS payment_id,
        COALESCE(p.status, 'unpaid') AS payment_status,
        COALESCE(p.payment_method, '-') AS payment_method,
        p.paid_at,
        b.created_at
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN payments p ON b.id = p.booking_id
      ${whereString}
      ORDER BY b.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit, 10), offset);
    const bookingsResult = await query(bookingsQuery, queryParams);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Daftar reservasi berhasil diambil.',
      pagination: {
        total_records: totalRecords,
        current_page: parseInt(page, 10),
        total_pages: Math.ceil(totalRecords / parseInt(limit, 10)) || 1,
        limit: parseInt(limit, 10),
      },
      data: {
        bookings: bookingsResult.rows,
      },
    });
  } catch (error) {
    console.error('❌ Admin getAllBookings Error:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Gagal memuat daftar reservasi.',
      error: error.message,
    });
  }
};

/**
 * 3. PUT /api/v1/admin/bookings/:id/status
 * Memperbarui status reservasi (Check-in, Check-out, Konfirmasi, Batalkan)
 */
const updateBookingStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'ERROR',
        message: `Status tidak valid. Status yang diizinkan: [${validStatuses.join(', ')}]`,
      });
    }

    await client.query('BEGIN');

    // 1. Ambil data booking saat ini
    const bookingRes = await client.query(`
      SELECT b.*, r.id AS room_id, r.room_number
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = $1
      FOR UPDATE
    `, [id]);

    if (bookingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'ERROR',
        message: 'Data reservasi tidak ditemukan.',
      });
    }

    const booking = bookingRes.rows[0];
    const roomId = booking.room_id;

    // 2. Update status booking
    const updateBookingRes = await client.query(`
      UPDATE bookings 
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    // 3. Sinkronisasi status fisik kamar
    if (status === 'checked_in') {
      // Saat tamu check-in, set kamar jadi 'occupied'
      await client.query(`UPDATE rooms SET status = 'occupied' WHERE id = $1`, [roomId]);
    } else if (status === 'completed') {
      // Saat tamu check-out / completed, kembalikan kamar jadi 'available' atau 'cleaning'
      await client.query(`UPDATE rooms SET status = 'available' WHERE id = $1`, [roomId]);
    } else if (status === 'cancelled') {
      // Saat booking dibatalkan, kembalikan kamar jadi 'available'
      await client.query(`UPDATE rooms SET status = 'available' WHERE id = $1`, [roomId]);
    } else if (status === 'confirmed') {
      // Konfirmasi booking
      await client.query(`UPDATE rooms SET status = 'available' WHERE id = $1`, [roomId]);
    }

    await client.query('COMMIT');

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Status reservasi ${booking.booking_code} berhasil diperbarui menjadi '${status}'.`,
      data: {
        booking: updateBookingRes.rows[0],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Admin updateBookingStatus Error:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Gagal memperbarui status reservasi.',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * 4. GET /api/v1/admin/rooms
 * Mengambil seluruh daftar inventori kamar fisik dan tipe kamar
 */
const getAllRooms = async (req, res) => {
  try {
    const roomsResult = await query(`
      SELECT 
        r.id,
        r.room_number,
        r.floor,
        r.status AS room_status,
        rt.id AS room_type_id,
        rt.name AS room_type_name,
        rt.base_price,
        rt.capacity,
        rt.image_url,
        (
          SELECT b.booking_code 
          FROM bookings b 
          WHERE b.room_id = r.id 
            AND b.status IN ('checked_in', 'confirmed') 
            AND b.check_in_date <= CURRENT_DATE 
            AND b.check_out_date >= CURRENT_DATE 
          LIMIT 1
        ) AS current_booking_code,
        (
          SELECT u.full_name 
          FROM bookings b 
          JOIN users u ON b.user_id = u.id
          WHERE b.room_id = r.id 
            AND b.status IN ('checked_in', 'confirmed') 
            AND b.check_in_date <= CURRENT_DATE 
            AND b.check_out_date >= CURRENT_DATE 
          LIMIT 1
        ) AS current_guest_name
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.floor ASC, r.room_number ASC
    `);

    // Ambil juga list room types untuk opsi dropdown
    const roomTypesResult = await query(`
      SELECT id, name, base_price, capacity, image_url 
      FROM room_types 
      ORDER BY base_price ASC
    `);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Data inventori kamar berhasil diambil.',
      data: {
        rooms: roomsResult.rows,
        room_types: roomTypesResult.rows,
      },
    });
  } catch (error) {
    console.error('❌ Admin getAllRooms Error:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Gagal memuat inventori kamar.',
      error: error.message,
    });
  }
};

/**
 * 5. POST /api/v1/admin/rooms
 * Menambahkan unit kamar fisik baru
 */
const createRoom = async (req, res) => {
  try {
    const { room_number, room_type_id, floor, status = 'available' } = req.body;

    if (!room_number || !room_type_id || floor === undefined) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Nomor kamar, tipe kamar (room_type_id), dan lantai wajib diisi.',
      });
    }

    // Cek apakah nomor kamar sudah ada
    const checkExists = await query('SELECT id FROM rooms WHERE room_number = $1', [room_number]);
    if (checkExists.rowCount > 0) {
      return res.status(409).json({
        status: 'ERROR',
        message: `Kamar dengan nomor '${room_number}' sudah terdaftar dalam sistem.`,
      });
    }

    // Insert room baru
    const insertResult = await query(`
      INSERT INTO rooms (room_number, room_type_id, floor, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [room_number, room_type_id, parseInt(floor, 10), status]);

    return res.status(201).json({
      status: 'SUCCESS',
      message: `Kamar nomor ${room_number} (Lantai ${floor}) berhasil ditambahkan.`,
      data: {
        room: insertResult.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Admin createRoom Error:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Gagal menambahkan kamar baru.',
      error: error.message,
    });
  }
};

/**
 * 6. PUT /api/v1/admin/rooms/:id/status
 * Memperbarui status fisik kamar (available / occupied / maintenance / cleaning)
 */
const updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'occupied', 'maintenance', 'cleaning'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'ERROR',
        message: `Status kamar tidak valid. Pilihan: [${validStatuses.join(', ')}]`,
      });
    }

    const updateResult = await query(`
      UPDATE rooms 
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Kamar tidak ditemukan.',
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Status kamar #${updateResult.rows[0].room_number} berhasil diubah menjadi '${status}'.`,
      data: {
        room: updateResult.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Admin updateRoomStatus Error:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Gagal memperbarui status kamar.',
      error: error.message,
    });
  }
};

/**
 * 7. GET /api/v1/admin/guests
 * Mengambil daftar tamu terdaftar beserta total booking & total pengeluaran
 */
const getAllGuests = async (req, res) => {
  try {
    const guestsResult = await query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.created_at AS registered_at,
        COUNT(b.id) AS total_bookings,
        COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_price ELSE 0 END), 0) AS total_spent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE u.role = 'guest'
      GROUP BY u.id
      ORDER BY total_spent DESC, total_bookings DESC
    `);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Direktori data tamu berhasil diambil.',
      count: guestsResult.rowCount,
      data: {
        guests: guestsResult.rows,
      },
    });
  } catch (error) {
    console.error('❌ Admin getAllGuests Error:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Gagal memuat direktori tamu.',
      error: error.message,
    });
  }
};

/**
 * 8. PUT /api/v1/admin/guests/:id/blacklist
 * Mengubah status akun tamu menjadi blacklisted (atau mengembalikannya ke active)
 */
const blacklistGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'blacklist' atau 'activate'

    const newStatus = action === 'activate' ? 'active' : 'blacklisted';

    const result = await query(
      `UPDATE users SET status = $1 WHERE id = $2 AND role = 'guest' RETURNING id, email, status`,
      [newStatus, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Tamu tidak ditemukan.' });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Status tamu berhasil diubah menjadi ${newStatus}.`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Admin blacklistGuest Error:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal mengubah status tamu.' });
  }
};

/**
 * 9. PUT /api/v1/admin/guests/:id/reset-password
 * Mereset password tamu menjadi "password123"
 */
const resetGuestPassword = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hash password default
    const newPasswordHash = await hashPassword('password123');

    const result = await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 AND role = 'guest' RETURNING id, email`,
      [newPasswordHash, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Tamu tidak ditemukan.' });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Password tamu berhasil di-reset menjadi "password123".',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Admin resetGuestPassword Error:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal me-reset password tamu.' });
  }
};

/**
 * 10. GET /api/v1/admin/restaurant-bookings
 * Mengambil semua data reservasi restoran
 */
const getAllRestaurantBookings = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        tr.id,
        tr.reservation_code,
        u.full_name AS guest_name,
        u.email AS guest_email,
        u.phone AS guest_phone,
        tr.reservation_date,
        tr.session_time,
        tr.guest_count,
        tr.table_number,
        tr.special_requests,
        tr.status,
        tr.created_at
      FROM table_reservations tr
      JOIN users u ON tr.user_id = u.id
      ORDER BY tr.reservation_date DESC, tr.created_at DESC
    `);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Data reservasi restoran berhasil diambil.',
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Admin getAllRestaurantBookings Error:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal mengambil data reservasi restoran.' });
  }
};

/**
 * 11. PUT /api/v1/admin/restaurant-bookings/:id/status
 * Mengubah status reservasi restoran
 */
const updateRestaurantBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, table_number } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'ERROR', message: 'Status reservasi tidak valid.' });
    }

    const updateQuery = `
      UPDATE table_reservations 
      SET status = $1, table_number = COALESCE($2, table_number), updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 
      RETURNING *
    `;
    const result = await query(updateQuery, [status, table_number || null, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Reservasi tidak ditemukan.' });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Status reservasi berhasil diubah menjadi ${status}.`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('❌ Admin updateRestaurantBookingStatus Error:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memperbarui status reservasi restoran.' });
  }
};

/**
 * 12. GET /api/v1/admin/reviews
 * Mengambil seluruh ulasan & rating hotel dengan data lengkap
 */
const getAllReviewsAdmin = async (req, res) => {
  try {
    const sql = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.id AS user_id,
        u.full_name AS guest_name,
        u.email AS guest_email,
        u.status AS guest_status,
        b.booking_code,
        rt.name AS room_type_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN bookings b ON r.booking_id = b.id
      LEFT JOIN rooms rm ON b.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      ORDER BY r.created_at DESC;
    `;
    const result = await query(sql);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Seluruh ulasan tamu berhasil dimuat.',
      data: {
        reviews: result.rows,
      },
    });
  } catch (error) {
    console.error('❌ Admin getAllReviewsAdmin Error:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memuat ulasan.' });
  }
};

/**
 * 13. DELETE /api/v1/admin/reviews/:id
 * Menghapus ulasan oleh Admin (misal karena spam / ujaran kebencian)
 */
const deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteRes = await query('DELETE FROM reviews WHERE id::text = $1 RETURNING id', [id]);

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Ulasan tidak ditemukan.' });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Ulasan tamu berhasil dihapus oleh admin.',
    });
  } catch (error) {
    console.error('❌ Admin deleteReviewAdmin Error:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal menghapus ulasan.' });
  }
};

module.exports = {
  getDashboardStats,
  getAllBookings,
  updateBookingStatus,
  getAllRooms,
  createRoom,
  updateRoomStatus,
  getAllGuests,
  blacklistGuest,
  resetGuestPassword,
  getAllRestaurantBookings,
  updateRestaurantBookingStatus,
  getAllReviewsAdmin,
  deleteReviewAdmin,
};
