const { pool } = require('../backend/config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Menambahkan kolom status pada tabel users...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' 
      CHECK (status IN ('active', 'blacklisted'));
    `);
    console.log('✅ Berhasil menambahkan kolom status!');
  } catch (err) {
    console.error('❌ Gagal menambah kolom status:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
