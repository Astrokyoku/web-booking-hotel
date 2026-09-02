const { pool } = require('../backend/config/db');

async function deleteGuests() {
  const client = await pool.connect();
  try {
    console.log('Menghapus semua akun guest dari database...');
    
    // Hitung jumlah sebelum dihapus
    const beforeCount = await client.query('SELECT count(*) FROM users WHERE role = $1', ['guest']);
    console.log(`Jumlah guest sebelum dihapus: ${beforeCount.rows[0].count}`);
    
    // Lakukan penghapusan
    const result = await client.query("DELETE FROM users WHERE role != 'admin' RETURNING email");
    
    console.log(`\nBerhasil menghapus ${result.rowCount} akun guest.`);
    result.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.email}`);
    });
    
  } catch (error) {
    console.error('Gagal menghapus user:', error);
  } finally {
    client.release();
    pool.end();
  }
}

deleteGuests();
