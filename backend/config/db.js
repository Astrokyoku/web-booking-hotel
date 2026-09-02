// ============================================================
// 📁 backend/config/db.js
// Konfigurasi koneksi PostgreSQL menggunakan node-postgres (pg)
// ============================================================

const { Pool } = require('pg');
require('dotenv').config();

// Membuat pool koneksi ke PostgreSQL
// Pool memungkinkan multiple koneksi (connection pooling)
// sehingga lebih efisien dibanding single connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'hotel_booking_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'yourpassword',
  max: 20,              // Maksimal koneksi aktif dalam pool
  idleTimeoutMillis: 30000,  // Timeout koneksi idle (30 detik)
  connectionTimeoutMillis: 5000, // Timeout saat membuat koneksi baru (5 detik)
});

// Event listener untuk monitoring koneksi pool
pool.on('connect', () => {
  console.log('📦 PostgreSQL pool: New client connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

// Fungsi helper untuk menjalankan query
// Penggunaan: const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
const query = (text, params) => pool.query(text, params);

// Fungsi untuk menguji koneksi database
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log(`✅ Database connected successfully at ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
};
