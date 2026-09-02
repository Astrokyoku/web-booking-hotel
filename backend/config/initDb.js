// ============================================================
// 📁 backend/config/initDb.js
// Script untuk menginisialisasi database (membuat DB & tabel otomatis)
// Jalankan: npm run db:init
// ============================================================

const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'hotel_booking_db';

const ensureDatabaseExists = async () => {
  // Hubungkan ke database default 'postgres' terlebih dahulu
  const rootClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    const res = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`🔨 Database "${dbName}" belum ada. Membuat database baru...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" berhasil dibuat!`);
    } else {
      console.log(`📦 Database "${dbName}" sudah ada.`);
    }
  } catch (error) {
    console.error('❌ Gagal memeriksa/membuat database:', error.message);
    throw error;
  } finally {
    await rootClient.end();
  }
};

const initDatabase = async () => {
  console.log('='.repeat(55));
  console.log('🏨 Hotel Booking - Database Initialization');
  console.log('='.repeat(55));

  try {
    // 1. Pastikan database fisik hotel_booking_db sudah ada
    await ensureDatabaseExists();

    // 2. Buat koneksi pool ke database hotel_booking_db
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });

    // 3. Baca file schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('📄 Schema SQL file loaded successfully');

    // 4. Eksekusi schema SQL ke database
    console.log('⏳ Creating tables & extensions...');
    await pool.query(schema);
    console.log('✅ All tables created successfully!');

    // 5. Verifikasi tabel yang sudah dibuat
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Tables in database:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    console.log(`\n✅ Total: ${result.rows.length} tables active`);
    console.log('='.repeat(55));

    await pool.end();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
};

initDatabase();
