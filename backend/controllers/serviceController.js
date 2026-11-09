// ============================================================
// 📁 backend/controllers/serviceController.js
// Logika bisnis untuk Restoran, Fasilitas, dan MICE/Venue
// Dilengkapi Validasi Kapasitas, Anti Double-Booking, & Verifikasi Pembayaran Admin
// ============================================================

const { query } = require('../config/db');
const crypto = require('crypto');

const generateServiceCode = (prefix) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomChars = crypto.randomBytes(2).toString('hex').substring(0, 3).toUpperCase();
  return `${prefix}-${year}${month}${day}-${randomChars}`;
};

// ============================================================
// RESTAURANT ANGIE
// ============================================================

/**
 * 1. GET /api/v1/services/restaurant/menus
 * Mengambil semua menu restoran
 */
const getRestaurantMenus = async (req, res) => {
  try {
    const result = await query('SELECT * FROM restaurant_menus WHERE is_available = true ORDER BY category, price ASC');
    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Berhasil mengambil data menu restoran',
      data: { menus: result.rows },
    });
  } catch (error) {
    console.error('❌ Error getRestaurantMenus:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memuat menu restoran' });
  }
};

/**
 * 2. POST /api/v1/services/restaurant/book
 * Membuat reservasi meja restoran (Hanya untuk tamu yang login)
 */
const bookRestaurantTable = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reservation_date, session_time, guest_count, special_requests } = req.body;

    if (!reservation_date || !session_time || !guest_count) {
      return res.status(400).json({ status: 'ERROR', message: 'Data reservasi tidak lengkap.' });
    }

    const guests = parseInt(guest_count, 10) || 1;
    // Deposit reservasi meja: Rp 50.000 per orang, minimal Rp 100.000
    const total_price = Math.max(100000, guests * 50000);
    const reservationCode = generateServiceCode('RST');

    const insertResult = await query(
      `INSERT INTO table_reservations (
        reservation_code, user_id, reservation_date, session_time, guest_count, special_requests, total_price, payment_status, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid', 'pending') RETURNING *`,
      [reservationCode, userId, reservation_date, session_time, guests, special_requests || null, total_price]
    );

    const reservation = insertResult.rows[0];

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Reservasi meja restoran berhasil dibuat! Silakan lanjutkan ke pembayaran deposit.',
      data: {
        reservation,
        payment: {
          amount: parseFloat(total_price),
          status: 'unpaid',
        },
      },
    });
  } catch (error) {
    console.error('❌ Error bookRestaurantTable:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal membuat reservasi meja restoran' });
  }
};

/**
 * 2b. POST /api/v1/services/restaurant/:id/pay
 * Konfirmasi Pembayaran Deposit Restoran (Protected - Owner or Admin)
 */
const payRestaurantReservation = async (req, res) => {
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

    const reservationRes = await query(
      `SELECT tr.*, u.full_name as guest_name, u.email as guest_email, u.phone as guest_phone
       FROM table_reservations tr
       JOIN users u ON tr.user_id = u.id
       WHERE tr.id::text = $1 OR tr.reservation_code = $1`,
      [id]
    );

    if (reservationRes.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Data reservasi meja tidak ditemukan.' });
    }

    const reservation = reservationRes.rows[0];

    if (userRole !== 'admin' && reservation.user_id !== userId) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Anda tidak memiliki izin untuk membayar reservasi ini.',
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ status: 'ERROR', message: 'Tidak dapat membayar reservasi yang sudah dibatalkan.' });
    }

    if (reservation.payment_status === 'paid') {
      return res.status(400).json({ status: 'ERROR', message: 'Tagihan reservasi ini sudah dibayar sebelumnya.' });
    }

    const isAdmin = userRole === 'admin';
    const nextPayStatus = isAdmin ? 'paid' : (payment_method === 'cash' ? 'unpaid' : 'waiting_verification');
    const nextBookingStatus = isAdmin ? 'confirmed' : reservation.status;
    const nextPaidAt = nextPayStatus === 'paid' ? new Date() : reservation.paid_at;

    const updateSql = `
      UPDATE table_reservations
      SET payment_status = $1,
          payment_method = $2,
          paid_at = $3,
          status = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;
    const updated = await query(updateSql, [nextPayStatus, payment_method, nextPaidAt, nextBookingStatus, reservation.id]);

    const responseMsg = isAdmin
      ? '🎉 Pembayaran deposit meja berhasil diverifikasi! Reservasi restoran kini CONFIRMED.'
      : (payment_method === 'cash'
          ? '📝 Metode Bayar di Kasir tercatat. Silakan lakukan pembayaran saat tiba di restoran untuk verifikasi Admin.'
          : '⏳ Konfirmasi pembayaran deposit berhasil dikirim! Menunggu verifikasi Admin.');

    return res.status(200).json({
      status: 'SUCCESS',
      message: responseMsg,
      data: {
        reservation: {
          ...updated.rows[0],
          guest_name: reservation.guest_name,
          guest_email: reservation.guest_email,
          guest_phone: reservation.guest_phone,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error payRestaurantReservation:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memproses pembayaran reservasi restoran' });
  }
};

/**
 * 2c. POST /api/v1/services/restaurant/:id/cancel
 * Membatalkan reservasi meja restoran (Owner or Admin)
 */
const cancelRestaurantReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const reservationRes = await query(
      'SELECT * FROM table_reservations WHERE id::text = $1 OR reservation_code = $1',
      [id]
    );

    if (reservationRes.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Data reservasi restoran tidak ditemukan.' });
    }

    const reservation = reservationRes.rows[0];

    if (userRole !== 'admin' && reservation.user_id !== userId) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Anda tidak memiliki izin untuk membatalkan reservasi ini.',
      });
    }

    if (reservation.status === 'completed' || reservation.status === 'cancelled') {
      return res.status(400).json({
        status: 'ERROR',
        message: `Reservasi tidak dapat dibatalkan karena status saat ini adalah "${reservation.status}".`,
      });
    }

    const updateRes = await query(
      `UPDATE table_reservations 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [reservation.id]
    );

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Reservasi meja restoran berhasil dibatalkan.',
      data: { reservation: updateRes.rows[0] },
    });
  } catch (error) {
    console.error('❌ Error cancelRestaurantReservation:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal membatalkan reservasi restoran' });
  }
};

/**
 * 2d. GET /api/v1/services/restaurant/:id
 * Mengambil detail reservasi meja restoran berdasarkan ID atau kode reservasi
 */
const getRestaurantReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await query(`
      SELECT tr.*, u.full_name as guest_name, u.email as guest_email, u.phone as guest_phone
      FROM table_reservations tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.id::text = $1 OR tr.reservation_code = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Data reservasi restoran tidak ditemukan.' });
    }

    const reservation = result.rows[0];
    if (userRole !== 'admin' && reservation.user_id !== userId) {
      return res.status(403).json({ status: 'ERROR', message: 'Akses ditolak.' });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Detail reservasi restoran berhasil diambil.',
      data: { reservation },
    });
  } catch (error) {
    console.error('❌ Error getRestaurantReservationById:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal mengambil detail reservasi restoran' });
  }
};

/**
 * 2e. GET /api/v1/services/restaurant/my-bookings
 * Mengambil riwayat reservasi restoran milik tamu yang login
 */
const getMyRestaurantBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        tr.id, tr.reservation_code, tr.reservation_date, tr.session_time, 
        tr.guest_count, tr.table_number, tr.special_requests, tr.status,
        tr.total_price, tr.payment_status, tr.payment_method, tr.paid_at, tr.created_at,
        u.full_name as guest_name, u.email as guest_email, u.phone as guest_phone
      FROM table_reservations tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.user_id = $1
      ORDER BY tr.reservation_date DESC, tr.created_at DESC
    `, [userId]);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Berhasil mengambil riwayat reservasi restoran.',
      data: { bookings: result.rows }
    });
  } catch (error) {
    console.error('❌ Error getMyRestaurantBookings:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memuat riwayat reservasi restoran' });
  }
};

// ============================================================
// HOTEL FACILITIES
// ============================================================

/**
 * 3. GET /api/v1/services/facilities
 * Mengambil katalog fasilitas hotel
 */
const getHotelFacilities = async (req, res) => {
  try {
    const result = await query('SELECT * FROM hotel_facilities ORDER BY category, title ASC');
    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Berhasil mengambil data fasilitas hotel',
      data: { facilities: result.rows },
    });
  } catch (error) {
    console.error('❌ Error getHotelFacilities:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memuat fasilitas hotel' });
  }
};

// ============================================================
// MICE & VENUES (BALLROOM/MEETING)
// ============================================================

/**
 * 4. GET /api/v1/services/venues
 * Mengambil daftar ruang pertemuan dan ballroom
 */
const getVenues = async (req, res) => {
  try {
    const result = await query('SELECT * FROM venues ORDER BY capacity_theater DESC');
    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Berhasil mengambil data venue',
      data: { venues: result.rows },
    });
  } catch (error) {
    console.error('❌ Error getVenues:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memuat daftar venue' });
  }
};

/**
 * 5. POST /api/v1/services/venues/book
 * Membuat permohonan reservasi venue (dengan validasi kapasitas & anti double-booking)
 */
const bookVenue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { venue_id, event_date, duration_type, layout_type, attendee_count, special_requests } = req.body;

    if (!venue_id || !event_date || !duration_type || !layout_type || !attendee_count) {
      return res.status(400).json({ status: 'ERROR', message: 'Data reservasi venue tidak lengkap.' });
    }

    // 1. Ambil detail harga & kapasitas venue
    const venueQuery = await query(
      'SELECT id, name, capacity_theater, capacity_banquet, capacity_classroom, halfday_price, fullday_price FROM venues WHERE id = $1',
      [venue_id]
    );
    if (venueQuery.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Venue tidak ditemukan.' });
    }
    
    const venue = venueQuery.rows[0];
    const requestedAttendees = parseInt(attendee_count, 10) || 1;

    // 2. Validasi kapasitas berdasarkan tipe layout
    let maxCapacity = venue.capacity_theater;
    if (layout_type === 'classroom') {
      maxCapacity = venue.capacity_classroom;
    } else if (layout_type === 'banquet' || layout_type === 'u_shape') {
      maxCapacity = venue.capacity_banquet;
    }

    if (requestedAttendees > maxCapacity) {
      return res.status(400).json({
        status: 'ERROR',
        message: `Kapasitas maksimum ${venue.name} untuk layout "${layout_type.replace('_', '-')}" adalah ${maxCapacity} orang (permintaan Anda: ${requestedAttendees} orang).`,
      });
    }

    // 3. Cek ketersediaan venue di tanggal tersebut (Cegah Double-Booking)
    const conflictCheck = await query(
      `SELECT id, venue_booking_code FROM venue_bookings 
       WHERE venue_id = $1 AND event_date = $2 AND status IN ('pending', 'confirmed')
       LIMIT 1`,
      [venue_id, event_date]
    );

    if (conflictCheck.rowCount > 0) {
      return res.status(409).json({
        status: 'ERROR',
        message: `Maaf, "${venue.name}" sudah dipesan pada tanggal tersebut. Silakan pilih tanggal acara atau venue lain.`,
      });
    }

    const total_price = duration_type === 'full_day' ? venue.fullday_price : venue.halfday_price;
    const venueBookingCode = generateServiceCode('VEN');

    const insertResult = await query(
      `INSERT INTO venue_bookings (
        venue_booking_code, user_id, venue_id, event_date, duration_type, layout_type, attendee_count, total_price, special_requests, payment_status, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unpaid', 'pending') RETURNING *`,
      [venueBookingCode, userId, venue_id, event_date, duration_type, layout_type, requestedAttendees, total_price, special_requests || null]
    );

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Reservasi venue berhasil diajukan! Silakan lanjutkan ke pembayaran.',
      data: {
        booking: {
          ...insertResult.rows[0],
          venue_name: venue.name,
        },
        payment: {
          amount: parseFloat(total_price),
          status: 'unpaid',
        },
      },
    });
  } catch (error) {
    console.error('❌ Error bookVenue:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal membuat reservasi venue' });
  }
};

/**
 * 5b. POST /api/v1/services/venues/:id/pay
 * Konfirmasi Pembayaran Ballroom / Venue (Protected - Owner or Admin)
 */
const payVenueBooking = async (req, res) => {
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

    const bookingRes = await query(
      `SELECT vb.*, v.name as venue_name, u.full_name as guest_name, u.email as guest_email, u.phone as guest_phone
       FROM venue_bookings vb
       JOIN venues v ON vb.venue_id = v.id
       JOIN users u ON vb.user_id = u.id
       WHERE vb.id::text = $1 OR vb.venue_booking_code = $1`,
      [id]
    );

    if (bookingRes.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Data reservasi venue tidak ditemukan.' });
    }

    const booking = bookingRes.rows[0];

    if (userRole !== 'admin' && booking.user_id !== userId) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Akses ditolak: Anda tidak memiliki izin untuk membayar reservasi ini.',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ status: 'ERROR', message: 'Tidak dapat membayar reservasi yang sudah dibatalkan.' });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ status: 'ERROR', message: 'Tagihan reservasi ini sudah dibayar sebelumnya.' });
    }

    const isAdmin = userRole === 'admin';
    const nextPayStatus = isAdmin ? 'paid' : (payment_method === 'cash' ? 'unpaid' : 'waiting_verification');
    const nextBookingStatus = isAdmin ? 'confirmed' : booking.status;
    const nextPaidAt = nextPayStatus === 'paid' ? new Date() : booking.paid_at;

    const updateSql = `
      UPDATE venue_bookings
      SET payment_status = $1,
          payment_method = $2,
          paid_at = $3,
          status = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;
    const updated = await query(updateSql, [nextPayStatus, payment_method, nextPaidAt, nextBookingStatus, booking.id]);

    const responseMsg = isAdmin
      ? '🎉 Pembayaran reservasi venue/ballroom berhasil diverifikasi! Reservasi kini CONFIRMED.'
      : (payment_method === 'cash'
          ? '📝 Metode Bayar di Resepsionis tercatat. Silakan selesaikan pembayaran di hotel untuk verifikasi Admin.'
          : '⏳ Konfirmasi pembayaran venue berhasil dikirim! Menunggu verifikasi Admin.');

    return res.status(200).json({
      status: 'SUCCESS',
      message: responseMsg,
      data: {
        booking: {
          ...updated.rows[0],
          venue_name: booking.venue_name,
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          guest_phone: booking.guest_phone,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error payVenueBooking:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memproses pembayaran reservasi venue' });
  }
};

/**
 * 5c. POST /api/v1/services/venues/:id/cancel
 * Membatalkan reservasi ballroom / venue (Owner or Admin)
 */
const cancelVenueBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const bookingRes = await query(
      'SELECT * FROM venue_bookings WHERE id::text = $1 OR venue_booking_code = $1',
      [id]
    );

    if (bookingRes.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Data reservasi venue tidak ditemukan.' });
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
      `UPDATE venue_bookings 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [booking.id]
    );

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Reservasi venue berhasil dibatalkan. Jadwal ruangan telah dilepaskan kembali.',
      data: { booking: updateRes.rows[0] },
    });
  } catch (error) {
    console.error('❌ Error cancelVenueBooking:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal membatalkan reservasi venue' });
  }
};

/**
 * 5d. GET /api/v1/services/venues/:id
 * Mengambil detail reservasi venue berdasarkan ID atau kode reservasi
 */
const getVenueBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await query(`
      SELECT 
        vb.id, vb.venue_booking_code, vb.event_date, vb.duration_type, 
        vb.layout_type, vb.attendee_count, vb.total_price, vb.status, vb.special_requests, vb.created_at,
        vb.payment_status, vb.payment_method, vb.paid_at,
        v.id as venue_id, v.name as venue_name, v.venue_type, v.image_url as venue_image,
        u.id as guest_id, u.full_name as guest_name, u.email as guest_email, u.phone as guest_phone
      FROM venue_bookings vb
      JOIN venues v ON vb.venue_id = v.id
      JOIN users u ON vb.user_id = u.id
      WHERE vb.id::text = $1 OR vb.venue_booking_code = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Data reservasi venue tidak ditemukan.' });
    }

    const booking = result.rows[0];
    if (userRole !== 'admin' && booking.guest_id !== userId) {
      return res.status(403).json({ status: 'ERROR', message: 'Akses ditolak.' });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Detail reservasi venue berhasil diambil.',
      data: { booking },
    });
  } catch (error) {
    console.error('❌ Error getVenueBookingById:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal mengambil detail reservasi venue' });
  }
};

/**
 * 5e. GET /api/v1/services/venues/my-bookings
 * Mengambil riwayat reservasi venue milik tamu yang login
 */
const getMyVenueBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        vb.id, vb.venue_booking_code, vb.event_date, vb.duration_type, 
        vb.layout_type, vb.attendee_count, vb.total_price, vb.status, vb.special_requests, vb.created_at,
        vb.payment_status, vb.payment_method, vb.paid_at,
        v.name as venue_name, v.venue_type,
        u.full_name as guest_name, u.email as guest_email, u.phone as guest_phone
      FROM venue_bookings vb
      JOIN venues v ON vb.venue_id = v.id
      JOIN users u ON vb.user_id = u.id
      WHERE vb.user_id = $1
      ORDER BY vb.event_date DESC, vb.created_at DESC
    `, [userId]);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Berhasil mengambil riwayat reservasi venue.',
      data: { bookings: result.rows }
    });
  } catch (error) {
    console.error('❌ Error getMyVenueBookings:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal memuat riwayat reservasi venue' });
  }
};

module.exports = {
  getRestaurantMenus,
  bookRestaurantTable,
  payRestaurantReservation,
  cancelRestaurantReservation,
  getRestaurantReservationById,
  getMyRestaurantBookings,
  getHotelFacilities,
  getVenues,
  bookVenue,
  payVenueBooking,
  cancelVenueBooking,
  getVenueBookingById,
  getMyVenueBookings,
};
