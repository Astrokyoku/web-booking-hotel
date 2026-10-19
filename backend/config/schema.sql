-- ============================================================
-- 📁 backend/config/schema.sql
-- DDL (Data Definition Language) untuk Hotel Booking Database
-- Database: PostgreSQL
-- ============================================================

-- Pastikan ekstensi UUID tersedia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABEL USERS
-- Menyimpan data akun pengguna (tamu dan admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'guest' 
                    CHECK (role IN ('guest', 'admin')),
    status          VARCHAR(20) DEFAULT 'active' 
                    CHECK (status IN ('active', 'blacklisted')),
    phone           VARCHAR(20),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat pencarian berdasarkan email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- 2. TABEL ROOM_TYPES
-- Menyimpan kategori/tipe kamar (Deluxe, Suite, Executive, dll.)
-- ============================================================
CREATE TABLE IF NOT EXISTS room_types (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    base_price      DECIMAL(12, 2) NOT NULL CHECK (base_price > 0),
    capacity        INTEGER NOT NULL DEFAULT 2 CHECK (capacity > 0),
    amenities       TEXT[],          -- Array of text: {'WiFi', 'AC', 'Breakfast', 'Bathtub'}
    image_url       VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. TABEL ROOMS
-- Menyimpan data kamar fisik (nomor kamar, lantai, status)
-- Setiap kamar terhubung ke satu room_type
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id    UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    room_number     VARCHAR(10) NOT NULL UNIQUE,
    floor           INTEGER NOT NULL CHECK (floor > 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian kamar berdasarkan tipe
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- ============================================================
-- 4. TABEL BOOKINGS
-- Menyimpan data reservasi/pemesanan kamar oleh tamu
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code    VARCHAR(20) NOT NULL UNIQUE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    check_in_date   DATE NOT NULL,
    check_out_date  DATE NOT NULL,
    total_nights    INTEGER NOT NULL CHECK (total_nights > 0),
    total_price     DECIMAL(14, 2) NOT NULL CHECK (total_price > 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled')),
    guest_count     INTEGER NOT NULL DEFAULT 1 CHECK (guest_count > 0),
    special_requests TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: check_out harus setelah check_in
    CONSTRAINT chk_booking_dates CHECK (check_out_date > check_in_date)
);

-- Index untuk pencarian booking berdasarkan user, room, dan tanggal
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ============================================================
-- 5. TABEL PAYMENTS
-- Menyimpan data transaksi pembayaran untuk setiap booking
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    payment_method  VARCHAR(30) NOT NULL DEFAULT 'bank_transfer'
                    CHECK (payment_method IN ('bank_transfer', 'credit_card', 'ewallet', 'cash')),
    amount          DECIMAL(14, 2) NOT NULL CHECK (amount > 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'unpaid'
                    CHECK (status IN ('unpaid', 'paid', 'refunded')),
    paid_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian payment berdasarkan status
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

-- ============================================================
-- 6. TABEL REVIEWS
-- Menyimpan ulasan dan rating dari tamu setelah menginap
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id      UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian review berdasarkan user dan rating
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);

-- ============================================================
-- 7. TABEL RESTAURANT_MENUS
-- Menyimpan katalog menu makanan & minuman Restoran Angie
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_menus (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category        VARCHAR(50) NOT NULL CHECK (category IN ('appetizer', 'main_course', 'dessert', 'drinks', 'wine')),
    item_name       VARCHAR(150) NOT NULL,
    description     TEXT,
    price           DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    image_url       VARCHAR(500),
    is_available    BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_menus_category ON restaurant_menus(category);

-- ============================================================
-- 8. TABEL TABLE_RESERVATIONS
-- Menyimpan data pemesanan meja di Restoran Angie
-- ============================================================
CREATE TABLE IF NOT EXISTS table_reservations (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_code   VARCHAR(20) NOT NULL UNIQUE,
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reservation_date   DATE NOT NULL,
    session_time       VARCHAR(20) NOT NULL CHECK (session_time IN ('breakfast', 'lunch', 'dinner')),
    guest_count        INTEGER NOT NULL CHECK (guest_count > 0),
    table_number       VARCHAR(10),
    special_requests   TEXT,
    status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_table_reservations_user ON table_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_date ON table_reservations(reservation_date);

-- ============================================================
-- 9. TABEL HOTEL_FACILITIES
-- Menyimpan data fasilitas hotel
-- ============================================================
CREATE TABLE IF NOT EXISTS hotel_facilities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    description     TEXT,
    opening_hours   VARCHAR(100),
    image_url       VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. TABEL VENUES
-- Menyimpan data ballroom dan meeting room untuk MICE
-- ============================================================
CREATE TABLE IF NOT EXISTS venues (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name               VARCHAR(150) NOT NULL,
    venue_type         VARCHAR(50) NOT NULL CHECK (venue_type IN ('ballroom', 'meeting_room')),
    capacity_theater   INTEGER NOT NULL,
    capacity_banquet   INTEGER NOT NULL,
    capacity_classroom INTEGER NOT NULL,
    halfday_price      DECIMAL(14, 2) NOT NULL,
    fullday_price      DECIMAL(14, 2) NOT NULL,
    facilities         TEXT[],
    image_url          VARCHAR(500),
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. TABEL VENUE_BOOKINGS
-- Menyimpan data reservasi venue
-- ============================================================
CREATE TABLE IF NOT EXISTS venue_bookings (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_booking_code   VARCHAR(20) NOT NULL UNIQUE,
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id             UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_date           DATE NOT NULL,
    duration_type        VARCHAR(20) NOT NULL CHECK (duration_type IN ('half_day', 'full_day')),
    layout_type          VARCHAR(30) NOT NULL CHECK (layout_type IN ('theater', 'classroom', 'banquet', 'u_shape')),
    attendee_count       INTEGER NOT NULL CHECK (attendee_count > 0),
    total_price          DECIMAL(14, 2) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    special_requests     TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_user ON venue_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_venue ON venue_bookings(venue_id);

-- ============================================================
-- INFO SKEMA
-- ============================================================
-- Total Tabel  : 11
-- Relasi Utama :
--   users      -> bookings (1:N)
--   users      -> reviews  (1:N)
--   users      -> table_reservations (1:N)
--   users      -> venue_bookings (1:N)
--   room_types -> rooms    (1:N)
--   rooms      -> bookings (1:N)
--   bookings   -> payments (1:1)
--   bookings   -> reviews  (1:1)
--   venues     -> venue_bookings (1:N)
