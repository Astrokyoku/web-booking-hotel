const { query, pool } = require('./db');

async function fixReviews() {
  try {
    const activeGuests = await query(
      "SELECT id, full_name FROM users WHERE role = 'guest' AND status = 'active' AND full_name NOT ILIKE '%blacklist%' ORDER BY created_at DESC LIMIT 3"
    );

    if (activeGuests.rows.length > 0) {
      const u1 = activeGuests.rows[0]; // Dias
      const u2 = activeGuests.rows.length > 1 ? activeGuests.rows[1] : activeGuests.rows[0]; // Imam

      await query('DELETE FROM reviews');

      // Review 1
      await query(
        'INSERT INTO reviews (user_id, rating, comment) VALUES ($1, $2, $3)',
        [
          u1.id,
          5,
          'Pengalaman menginap terbaik sepanjang masa! Suite Room sangat luas, kasur sangat empuk, dan pemandangan sunset dari balkon benar-benar tak ternilai.',
        ]
      );

      // Review 2
      await query(
        'INSERT INTO reviews (user_id, rating, comment) VALUES ($1, $2, $3)',
        [
          u2.id,
          5,
          'Pelayanan staf sangat luar biasa ramah dan cepat tanggap. Breakfast di restoran bintang 5 menyajikan menu yang sangat lezat dan variatif!',
        ]
      );

      console.log('✅ Clean sample reviews created for active guests:', u1.full_name, 'and', u2.full_name);
    }
  } catch (err) {
    console.error('Error fixing reviews:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixReviews();
