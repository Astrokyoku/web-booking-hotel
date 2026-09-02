// ============================================================
// 📁 backend/config/checkDb.js
// Script CLI untuk mengecek isi database secara cepat dari terminal
// Jalankan: npm run db:check
// ============================================================

const { pool, query } = require('./db');

const checkDatabase = async () => {
  console.log('='.repeat(65));
  console.log('🔍 HOTEL BOOKING DATABASE - SUMMARY VIEWER');
  console.log('='.repeat(65));

  try {
    // 1. Ringkasan Total Data per Tabel
    const tables = ['users', 'room_types', 'rooms', 'bookings', 'payments', 'reviews'];
    console.log('\n📊 RINGKASAN JUMLAH DATA:');
    console.log('-'.repeat(40));

    for (const table of tables) {
      const res = await query(`SELECT COUNT(*) AS total FROM ${table}`);
      console.log(`   📁 Tabel [${table.padEnd(12)}] : ${res.rows[0].total.padStart(3)} baris data`);
    }

    // 2. Tampilkan Daftar Pengguna
    console.log('\n👥 DAFTAR PENGGUNA TERDAFTAR (USERS):');
    console.log('-'.repeat(65));
    const usersRes = await query('SELECT id, full_name, email, role, phone FROM users ORDER BY created_at ASC');
    console.table(usersRes.rows);

    // 3. Tampilkan Tipe Kamar & Tarif
    console.log('\n🏷️  DAFTAR TIPE KAMAR & HARGA:');
    console.log('-'.repeat(65));
    const roomTypesRes = await query('SELECT id, name, base_price, capacity, amenities FROM room_types ORDER BY base_price ASC');
    const formattedRoomTypes = roomTypesRes.rows.map(r => ({
      ID: r.id.substring(0, 8) + '...',
      Nama: r.name,
      'Tarif / Malam': `Rp ${Number(r.base_price).toLocaleString('id-ID')}`,
      Kapasitas: `${r.capacity} Orang`,
      Fasilitas: r.amenities ? r.amenities.slice(0, 3).join(', ') + '...' : '-',
    }));
    console.table(formattedRoomTypes);

    // 4. Tampilkan Daftar Kamar Fisik & Status
    console.log('\n🚪 DAFTAR KAMAR FISIK (ROOMS):');
    console.log('-'.repeat(65));
    const roomsRes = await query(`
      SELECT r.room_number, r.floor, rt.name AS tipe_kamar, r.status 
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.room_number ASC
    `);
    console.table(roomsRes.rows);

    // 5. Tampilkan Reservasi Aktif
    console.log('\n📅 DAFTAR BOOKING / RESERVASI:');
    console.log('-'.repeat(65));
    const bookingsRes = await query(`
      SELECT b.booking_code, u.full_name AS pemesan, r.room_number, 
             b.check_in_date, b.check_out_date, b.total_nights, b.total_price, b.status 
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `);
    const formattedBookings = bookingsRes.rows.map(b => ({
      Kode: b.booking_code,
      Pemesan: b.pemesan,
      Kamar: `#${b.room_number}`,
      'Check-In': b.check_in_date.toISOString().split('T')[0],
      'Check-Out': b.check_out_date.toISOString().split('T')[0],
      Malam: b.total_nights,
      Total: `Rp ${Number(b.total_price).toLocaleString('id-ID')}`,
      Status: b.status,
    }));
    console.table(formattedBookings);

    console.log('='.repeat(65));
    console.log('✅ Pengecekan database selesai.');
    console.log('='.repeat(65));

  } catch (error) {
    console.error('❌ Gagal memeriksa database:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

checkDatabase();
