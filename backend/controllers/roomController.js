// ============================================================
// 📁 backend/controllers/roomController.js
// Controller untuk Manajemen Tipe Kamar, Kamar Fisik, & Cek Ketersediaan
// ============================================================

const { query } = require('../config/db');
const { calculateBookingPrice, calculateNights } = require('../utils/pricing');

/**
 * 1. GET ALL ROOM TYPES - Mengambil seluruh katalog tipe kamar
 * Route: GET /api/v1/rooms (Public)
 */
const getAllRoomTypes = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        rt.id,
        rt.name,
        rt.description,
        rt.base_price,
        rt.capacity,
        rt.amenities,
        rt.image_url,
        COUNT(r.id)::int AS total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END)::int AS available_rooms,
        COALESCE(ROUND(AVG(rev.rating), 1), 5.0)::float AS average_rating,
        COUNT(rev.id)::int AS total_reviews
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      LEFT JOIN bookings b ON r.id = b.room_id
      LEFT JOIN reviews rev ON b.id = rev.booking_id
      GROUP BY rt.id
      ORDER BY rt.base_price ASC;
    `;

    const result = await query(sql);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Katalog kamar berhasil diambil.',
      count: result.rowCount,
      data: {
        room_types: result.rows,
      },
    });
  } catch (error) {
    console.error('❌ Get All Room Types Error:', error.message);
    next(error);
  }
};

/**
 * 2. CHECK AVAILABILITY - Algoritma Pencarian Kamar Kosong (Anti-Double Booking)
 * Route: GET /api/v1/rooms/search/availability (Public)
 * Query: ?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&guests=2&min_price=0&max_price=2000000
 */
const checkAvailability = async (req, res, next) => {
  try {
    const { check_in, check_out, guests, min_price, max_price } = req.query;

    // --- 1. Validasi Parameter Tanggal ---
    if (!check_in || !check_out) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Parameter check_in dan check_out (format: YYYY-MM-DD) wajib disertakan.',
      });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Format tanggal tidak valid. Harap gunakan format YYYY-MM-DD.',
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Tanggal check-out harus lebih besar dari tanggal check-in (minimal menginap 1 malam).',
      });
    }

    const nights = calculateNights(check_in, check_out);

    // --- 2. Query Anti-Overlapping Booking ---
    // Logika Overlap: Booking bertabrakan jika (b.check_in_date < $checkOutDate AND b.check_out_date > $checkInDate)
    let sql = `
      SELECT 
        rt.id,
        rt.name,
        rt.description,
        rt.base_price,
        rt.capacity,
        rt.amenities,
        rt.image_url,
        COALESCE(ROUND(AVG(rev.rating), 1), 5.0)::float AS average_rating,
        COUNT(rev.id)::int AS total_reviews,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', available_r.id,
            'room_number', available_r.room_number,
            'floor', available_r.floor
          )
        ) AS available_rooms,
        COUNT(available_r.id)::int AS available_count
      FROM room_types rt
      JOIN (
        -- Subquery: Hanya ambil kamar fisik yang TIDAK dibooking pada rentang tanggal tsb
        SELECT r.*
        FROM rooms r
        WHERE r.status = 'available'
          AND NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.room_id = r.id
              AND b.status IN ('pending', 'confirmed', 'checked_in')
              AND b.check_in_date < $2
              AND b.check_out_date > $1
          )
      ) available_r ON rt.id = available_r.room_type_id
      LEFT JOIN bookings b ON available_r.id = b.room_id
      LEFT JOIN reviews rev ON b.id = rev.booking_id
      WHERE 1=1
    `;

    const params = [check_in, check_out];
    let paramIndex = 3;

    // Filter Kapasitas Tamu (Guests)
    if (guests) {
      sql += ` AND rt.capacity >= $${paramIndex}`;
      params.push(parseInt(guests));
      paramIndex++;
    }

    // Filter Rentang Harga
    if (min_price) {
      sql += ` AND rt.base_price >= $${paramIndex}`;
      params.push(parseFloat(min_price));
      paramIndex++;
    }
    if (max_price) {
      sql += ` AND rt.base_price <= $${paramIndex}`;
      params.push(parseFloat(max_price));
      paramIndex++;
    }

    sql += `
      GROUP BY rt.id
      ORDER BY rt.base_price ASC;
    `;

    const result = await query(sql, params);

    // --- 3. Format Response dengan Kalkulasi Pajak 12% & Total Biaya ---
    const formattedResults = result.rows.map((rt) => {
      const pricing = calculateBookingPrice(rt.base_price, check_in, check_out);
      return {
        ...rt,
        pricing_breakdown: pricing,
      };
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Pencarian berhasil. Ditemukan ${formattedResults.length} tipe kamar yang tersedia.`,
      search_query: {
        check_in,
        check_out,
        total_nights: nights,
        guests: guests ? parseInt(guests) : null,
      },
      count: formattedResults.length,
      data: {
        available_room_types: formattedResults,
      },
    });
  } catch (error) {
    console.error('❌ Check Availability Error:', error.message);
    next(error);
  }
};

/**
 * 3. GET ROOM TYPE BY ID - Mengambil detail lengkap 1 tipe kamar
 * Route: GET /api/v1/rooms/:id (Public)
 */
const getRoomTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const roomTypeSql = `
      SELECT 
        rt.*,
        COUNT(r.id)::int AS total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END)::int AS available_rooms,
        COALESCE(ROUND(AVG(rev.rating), 1), 5.0)::float AS average_rating,
        COUNT(rev.id)::int AS total_reviews
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      LEFT JOIN bookings b ON r.id = b.room_id
      LEFT JOIN reviews rev ON b.id = rev.booking_id
      WHERE rt.id = $1
      GROUP BY rt.id;
    `;

    const typeResult = await query(roomTypeSql, [id]);

    if (typeResult.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Tipe kamar tidak ditemukan.',
      });
    }

    const roomsSql = `
      SELECT id, room_number, floor, status 
      FROM rooms 
      WHERE room_type_id = $1 
      ORDER BY room_number ASC;
    `;
    const roomsResult = await query(roomsSql, [id]);

    const reviewsSql = `
      SELECT 
        rev.id, 
        rev.rating, 
        rev.comment, 
        rev.created_at, 
        u.full_name AS reviewer_name
      FROM reviews rev
      JOIN bookings b ON rev.booking_id = b.id
      JOIN rooms r ON b.room_id = r.id
      JOIN users u ON rev.user_id = u.id
      WHERE r.room_type_id = $1
      ORDER BY rev.created_at DESC
      LIMIT 10;
    `;
    const reviewsResult = await query(reviewsSql, [id]);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Detail tipe kamar berhasil diambil.',
      data: {
        room_type: typeResult.rows[0],
        rooms: roomsResult.rows,
        reviews: reviewsResult.rows,
      },
    });
  } catch (error) {
    console.error('❌ Get Room Type By ID Error:', error.message);
    next(error);
  }
};

/**
 * 4. CREATE ROOM TYPE - Menambahkan tipe kamar baru (Admin Only)
 * Route: POST /api/v1/rooms/types (Protected - Admin)
 */
const createRoomType = async (req, res, next) => {
  try {
    const { name, description, base_price, capacity, amenities, image_url } = req.body;

    if (!name || !base_price || !capacity) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Nama tipe kamar, tarif dasar (base_price), dan kapasitas wajib diisi.',
      });
    }

    if (Number(base_price) <= 0 || Number(capacity) <= 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Tarif dasar dan kapasitas harus bernilai lebih dari 0.',
      });
    }

    const sql = `
      INSERT INTO room_types (name, description, base_price, capacity, amenities, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await query(sql, [
      name.trim(),
      description || null,
      base_price,
      capacity,
      amenities || [],
      image_url || '/assets/images/default-room.jpg',
    ]);

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Tipe kamar baru berhasil ditambahkan.',
      data: {
        room_type: result.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Create Room Type Error:', error.message);
    next(error);
  }
};

/**
 * 5. CREATE PHYSICAL ROOM - Menambahkan nomor kamar fisik baru (Admin Only)
 * Route: POST /api/v1/rooms/physical (Protected - Admin)
 */
const createPhysicalRoom = async (req, res, next) => {
  try {
    const { room_type_id, room_number, floor, status } = req.body;

    if (!room_type_id || !room_number || !floor) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Tipe kamar ID, nomor kamar, dan lantai wajib diisi.',
      });
    }

    const existing = await query('SELECT id FROM rooms WHERE room_number = $1', [room_number.trim()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({
        status: 'ERROR',
        message: `Nomor kamar "${room_number}" sudah terdaftar sebelumnya.`,
      });
    }

    const sql = `
      INSERT INTO rooms (room_type_id, room_number, floor, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await query(sql, [
      room_type_id,
      room_number.trim(),
      floor,
      status || 'available',
    ]);

    return res.status(201).json({
      status: 'SUCCESS',
      message: `Kamar fisik #${room_number} berhasil ditambahkan.`,
      data: {
        room: result.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Create Physical Room Error:', error.message);
    next(error);
  }
};

/**
 * 6. UPDATE ROOM TYPE - Mengubah data tipe kamar (Admin Only)
 * Route: PUT /api/v1/rooms/types/:id (Protected - Admin)
 */
const updateRoomType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, base_price, capacity, amenities, image_url } = req.body;

    const check = await query('SELECT id FROM room_types WHERE id = $1', [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Tipe kamar tidak ditemukan.',
      });
    }

    const sql = `
      UPDATE room_types
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          base_price = COALESCE($3, base_price),
          capacity = COALESCE($4, capacity),
          amenities = COALESCE($5, amenities),
          image_url = COALESCE($6, image_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *;
    `;

    const result = await query(sql, [
      name ? name.trim() : null,
      description !== undefined ? description : null,
      base_price || null,
      capacity || null,
      amenities || null,
      image_url || null,
      id,
    ]);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Data tipe kamar berhasil diperbarui.',
      data: {
        room_type: result.rows[0],
      },
    });
  } catch (error) {
    console.error('❌ Update Room Type Error:', error.message);
    next(error);
  }
};

/**
 * 7. DELETE ROOM TYPE - Menghapus tipe kamar (Admin Only)
 * Route: DELETE /api/v1/rooms/types/:id (Protected - Admin)
 */
const deleteRoomType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM room_types WHERE id = $1 RETURNING id, name', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Tipe kamar tidak ditemukan.',
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: `Tipe kamar "${result.rows[0].name}" dan seluruh kamar fisiknya berhasil dihapus.`,
    });
  } catch (error) {
    console.error('❌ Delete Room Type Error:', error.message);
    next(error);
  }
};

module.exports = {
  getAllRoomTypes,
  checkAvailability,
  getRoomTypeById,
  createRoomType,
  createPhysicalRoom,
  updateRoomType,
  deleteRoomType,
};
