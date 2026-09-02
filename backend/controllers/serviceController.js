// ============================================================
// 📁 backend/controllers/serviceController.js
// Logika bisnis untuk Restoran, Fasilitas, dan MICE/Venue
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

    const reservationCode = generateServiceCode('RST');

    const insertResult = await query(
      `INSERT INTO table_reservations (reservation_code, user_id, reservation_date, session_time, guest_count, special_requests)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [reservationCode, userId, reservation_date, session_time, guest_count, special_requests]
    );

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Reservasi meja restoran berhasil dibuat.',
      data: { reservation: insertResult.rows[0] },
    });
  } catch (error) {
    console.error('❌ Error bookRestaurantTable:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal membuat reservasi meja restoran' });
  }
};

/**
 * 2b. GET /api/v1/services/restaurant/my-bookings
 * Mengambil riwayat reservasi restoran milik tamu yang login
 */
const getMyRestaurantBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        tr.id, tr.reservation_code, tr.reservation_date, tr.session_time, 
        tr.guest_count, tr.table_number, tr.special_requests, tr.status, tr.created_at,
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
 * Membuat permohonan reservasi venue
 */
const bookVenue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { venue_id, event_date, duration_type, layout_type, attendee_count, special_requests } = req.body;

    if (!venue_id || !event_date || !duration_type || !layout_type || !attendee_count) {
      return res.status(400).json({ status: 'ERROR', message: 'Data reservasi venue tidak lengkap.' });
    }

    // Ambil detail harga venue
    const venueQuery = await query('SELECT halfday_price, fullday_price FROM venues WHERE id = $1', [venue_id]);
    if (venueQuery.rowCount === 0) {
      return res.status(404).json({ status: 'ERROR', message: 'Venue tidak ditemukan.' });
    }
    
    const venue = venueQuery.rows[0];
    const total_price = duration_type === 'full_day' ? venue.fullday_price : venue.halfday_price;
    const venueBookingCode = generateServiceCode('VEN');

    const insertResult = await query(
      `INSERT INTO venue_bookings (venue_booking_code, user_id, venue_id, event_date, duration_type, layout_type, attendee_count, total_price, special_requests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [venueBookingCode, userId, venue_id, event_date, duration_type, layout_type, attendee_count, total_price, special_requests]
    );

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Reservasi venue berhasil diajukan.',
      data: { booking: insertResult.rows[0] },
    });
  } catch (error) {
    console.error('❌ Error bookVenue:', error.message);
    return res.status(500).json({ status: 'ERROR', message: 'Gagal membuat reservasi venue' });
  }
};

module.exports = {
  getRestaurantMenus,
  bookRestaurantTable,
  getMyRestaurantBookings,
  getHotelFacilities,
  getVenues,
  bookVenue
};
