// ============================================================
// 📁 backend/config/seed.js
// Database Seeder - Mengisi data dummy untuk pengujian
// Jalankan: npm run db:seed
// ============================================================

const bcrypt = require('bcryptjs');
const { pool } = require('./db');

// ============================================================
// DATA DUMMY
// ============================================================

// 1. Data Users (Admin & Guest)
const usersData = [
  {
    full_name: 'Admin Lumina Resort',
    email: 'admin@luminaresort.com',
    password: 'admin123',
    role: 'admin',
    phone: '081234567890',
  },
  {
    full_name: 'Staff Resepsionis',
    email: 'staff@luminaresort.com',
    password: 'staff123',
    role: 'admin',
    phone: '081234567891',
  },
  {
    full_name: 'Budi Santoso',
    email: 'budi@gmail.com',
    password: 'tamu123',
    role: 'guest',
    phone: '082112345678',
  },
  {
    full_name: 'Siti Rahayu',
    email: 'siti.rahayu@gmail.com',
    password: 'tamu123',
    role: 'guest',
    phone: '085698765432',
  },
  {
    full_name: 'Ahmad Wijaya',
    email: 'ahmad.wijaya@gmail.com',
    password: 'tamu123',
    role: 'guest',
    phone: '087812345678',
  },
];

// 2. Data Room Types (Tipe Kamar)
const roomTypesData = [
  {
    name: 'Standard Room',
    description: 'Kamar standar yang nyaman dengan fasilitas lengkap untuk menginap singkat maupun lama. Dilengkapi tempat tidur queen size, meja kerja, dan pemandangan taman.',
    base_price: 450000,
    capacity: 2,
    amenities: ['WiFi', 'AC', 'TV LED 32"', 'Hot Water', 'Towel Set'],
    image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Deluxe Room',
    description: 'Kamar deluxe premium dengan desain modern dan ruang yang lebih luas. Dilengkapi tempat tidur king size, minibar, balkon pribadi dengan pemandangan kolam renang.',
    base_price: 750000,
    capacity: 2,
    amenities: ['WiFi', 'AC', 'TV LED 43"', 'Hot Water', 'Minibar', 'Balcony', 'Bathrobe', 'Breakfast'],
    image_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Suite Room',
    description: 'Suite mewah dengan ruang tamu terpisah, kamar mandi premium dengan bathtub jacuzzi, dan pemandangan laut langsung dari balkon pribadi. Sempurna untuk pengalaman menginap eksklusif.',
    base_price: 1500000,
    capacity: 3,
    amenities: ['WiFi', 'AC', 'TV LED 55"', 'Hot Water', 'Minibar', 'Balcony', 'Bathtub Jacuzzi', 'Bathrobe', 'Breakfast', 'Living Room', 'Coffee Machine'],
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Executive Family Room',
    description: 'Kamar keluarga eksklusif berkapasitas besar dengan dua kamar tidur terhubung, ruang bermain anak, dan fasilitas lengkap untuk liburan keluarga.',
    base_price: 2200000,
    capacity: 5,
    amenities: ['WiFi', 'AC', 'TV LED 55"', 'Hot Water', 'Minibar', 'Balcony', 'Bathtub', 'Bathrobe', 'Breakfast', 'Living Room', 'Kitchen', 'Kids Area', 'Sea View'],
    image_url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
  },
];

// 3. Data Rooms (Kamar Fisik) — akan diisi setelah room_types di-insert
const roomsTemplate = [
  // Standard Rooms (Lantai 1)
  { type_index: 0, room_number: '101', floor: 1 },
  { type_index: 0, room_number: '102', floor: 1 },
  { type_index: 0, room_number: '103', floor: 1 },
  // Deluxe Rooms (Lantai 2)
  { type_index: 1, room_number: '201', floor: 2 },
  { type_index: 1, room_number: '202', floor: 2 },
  { type_index: 1, room_number: '203', floor: 2 },
  // Suite Rooms (Lantai 3)
  { type_index: 2, room_number: '301', floor: 3 },
  { type_index: 2, room_number: '302', floor: 3 },
  { type_index: 2, room_number: '303', floor: 3 },
  // Executive Family Rooms (Lantai 4)
  { type_index: 3, room_number: '401', floor: 4 },
  { type_index: 3, room_number: '402', floor: 4 },
  { type_index: 3, room_number: '403', floor: 4 },
];

// 4. Data Restaurant Menus
const restaurantMenusData = [
  { category: 'appetizer', item_name: 'Truffle Mushroom Soup', description: 'Sup jamur creamy dengan sentuhan minyak truffle', price: 125000, image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80' },
  { category: 'main_course', item_name: 'Wagyu Beef Steak A5', description: 'Steak sapi Wagyu A5 panggang dengan saus red wine', price: 950000, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80' },
  { category: 'dessert', item_name: 'Gold Leaf Chocolate Lava', description: 'Kue cokelat leleh dengan topping emas murni 24k', price: 250000, image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80' },
  { category: 'wine', item_name: 'Château Margaux 2015', description: 'Anggur merah klasik Prancis (Botol)', price: 4500000, image_url: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&w=800&q=80' },
];

// 5. Data Hotel Facilities
const facilitiesData = [
  { title: 'Infinity Pool Ocean View', category: 'Recreation', description: 'Kolam renang tanpa batas menghadap lautan lepas, sempurna untuk sunset.', opening_hours: '06:00 - 20:00', image_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80' },
  { title: 'Royal Spa & Wellness', category: 'Wellness', description: 'Fasilitas spa mewah dengan terapi tradisional dan modern.', opening_hours: '09:00 - 22:00', image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80' },
  { title: 'Executive Fitness Center', category: 'Health', description: 'Pusat kebugaran lengkap dengan peralatan canggih dan personal trainer.', opening_hours: '24 Hours', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80' },
];

// 6. Data Venues
const venuesData = [
  { name: 'Grand Luxury Ballroom', venue_type: 'ballroom', capacity_theater: 1000, capacity_banquet: 500, capacity_classroom: 600, halfday_price: 35000000, fullday_price: 60000000, facilities: ['Sound System', 'LED Screen', 'Stage', 'VIP Room'], image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80' },
  { name: 'Executive Boardroom VIP', venue_type: 'meeting_room', capacity_theater: 50, capacity_banquet: 30, capacity_classroom: 40, halfday_price: 5000000, fullday_price: 8000000, facilities: ['Projector', 'Whiteboard', 'Video Conference', 'Coffee Break Area'], image_url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80' },
];

// ============================================================
// FUNGSI SEEDER
// ============================================================

const seedDatabase = async () => {
  console.log('='.repeat(55));
  console.log('🌱 Hotel Booking - Database Seeder');
  console.log('='.repeat(55));

  const client = await pool.connect();

  try {
    // Mulai transaction agar data konsisten
    await client.query('BEGIN');

    // -------------------------------------------------------
    // STEP 1: Hapus data lama (urutan sesuai dependensi FK)
    // -------------------------------------------------------
    console.log('\n🗑️  Clearing existing data...');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM rooms');
    await client.query('DELETE FROM room_types');
    await client.query('DELETE FROM users');
    console.log('   ✅ Old data cleared');

    // -------------------------------------------------------
    // STEP 2: Insert Users
    // -------------------------------------------------------
    console.log('\n👥 Seeding users...');
    const insertedUsers = [];
    for (const user of usersData) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      const result = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, phone) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role`,
        [user.full_name, user.email, hashedPassword, user.role, user.phone]
      );
      insertedUsers.push(result.rows[0]);
      console.log(`   ✅ ${result.rows[0].role.toUpperCase()}: ${result.rows[0].email}`);
    }

    // -------------------------------------------------------
    // STEP 3: Insert Room Types
    // -------------------------------------------------------
    console.log('\n🏷️  Seeding room types...');
    const insertedRoomTypes = [];
    for (const type of roomTypesData) {
      const result = await client.query(
        `INSERT INTO room_types (name, description, base_price, capacity, amenities, image_url) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, base_price`,
        [type.name, type.description, type.base_price, type.capacity, type.amenities, type.image_url]
      );
      insertedRoomTypes.push(result.rows[0]);
      console.log(`   ✅ ${result.rows[0].name} — Rp ${Number(result.rows[0].base_price).toLocaleString('id-ID')}/malam`);
    }

    // -------------------------------------------------------
    // STEP 4: Insert Rooms (Kamar Fisik)
    // -------------------------------------------------------
    console.log('\n🚪 Seeding rooms...');
    const insertedRooms = [];
    for (const room of roomsTemplate) {
      const roomTypeId = insertedRoomTypes[room.type_index].id;
      const result = await client.query(
        `INSERT INTO rooms (room_type_id, room_number, floor, status) 
         VALUES ($1, $2, $3, 'available') RETURNING id, room_number, floor`,
        [roomTypeId, room.room_number, room.floor]
      );
      insertedRooms.push({ ...result.rows[0], type_index: room.type_index });
      console.log(`   ✅ Room #${result.rows[0].room_number} (Lantai ${result.rows[0].floor}) — ${insertedRoomTypes[room.type_index].name}`);
    }

    // -------------------------------------------------------
    // STEP 5: Insert Sample Bookings
    // -------------------------------------------------------
    console.log('\n📅 Seeding sample bookings...');

    // Booking 1: Budi memesan Standard Room 101
    const booking1 = await client.query(
      `INSERT INTO bookings (booking_code, user_id, room_id, check_in_date, check_out_date, total_nights, total_price, status, special_request)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, booking_code, status`,
      [
        'HTL-20260810-001',
        insertedUsers[2].id,   // Budi
        insertedRooms[0].id,   // Room 101 (Standard)
        '2026-08-10',
        '2026-08-13',
        3,
        3 * 450000 * 1.1,     // 3 malam × 450k + 10% pajak
        'confirmed',
        'Extra pillow please',
      ]
    );
    console.log(`   ✅ ${booking1.rows[0].booking_code} — Budi → Room #101 (${booking1.rows[0].status})`);

    // Booking 2: Siti memesan Deluxe Room 201
    const booking2 = await client.query(
      `INSERT INTO bookings (booking_code, user_id, room_id, check_in_date, check_out_date, total_nights, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, booking_code, status`,
      [
        'HTL-20260815-002',
        insertedUsers[3].id,   // Siti
        insertedRooms[3].id,   // Room 201 (Deluxe)
        '2026-08-15',
        '2026-08-17',
        2,
        2 * 750000 * 1.1,     // 2 malam × 750k + 10% pajak
        'pending',
      ]
    );
    console.log(`   ✅ ${booking2.rows[0].booking_code} — Siti → Room #201 (${booking2.rows[0].status})`);

    // Booking 3: Ahmad memesan Suite Room 301
    const booking3 = await client.query(
      `INSERT INTO bookings (booking_code, user_id, room_id, check_in_date, check_out_date, total_nights, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, booking_code, status`,
      [
        'HTL-20260820-003',
        insertedUsers[4].id,   // Ahmad
        insertedRooms[6].id,   // Room 301 (Suite)
        '2026-08-20',
        '2026-08-23',
        3,
        3 * 1500000 * 1.1,    // 3 malam × 1.5jt + 10% pajak
        'confirmed',
      ]
    );
    console.log(`   ✅ ${booking3.rows[0].booking_code} — Ahmad → Room #301 (${booking3.rows[0].status})`);

    // -------------------------------------------------------
    // STEP 6: Insert Sample Payments
    // -------------------------------------------------------
    console.log('\n💳 Seeding sample payments...');

    // Payment untuk Booking 1 (Paid)
    await client.query(
      `INSERT INTO payments (booking_id, payment_method, amount, status, paid_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [booking1.rows[0].id, 'bank_transfer', 3 * 450000 * 1.1, 'paid', '2026-08-08 14:30:00+07']
    );
    console.log(`   ✅ ${booking1.rows[0].booking_code} — Bank Transfer (PAID)`);

    // Payment untuk Booking 2 (Unpaid)
    await client.query(
      `INSERT INTO payments (booking_id, payment_method, amount, status)
       VALUES ($1, $2, $3, $4)`,
      [booking2.rows[0].id, 'ewallet', 2 * 750000 * 1.1, 'unpaid']
    );
    console.log(`   ✅ ${booking2.rows[0].booking_code} — E-Wallet (UNPAID)`);

    // Payment untuk Booking 3 (Paid)
    await client.query(
      `INSERT INTO payments (booking_id, payment_method, amount, status, paid_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [booking3.rows[0].id, 'credit_card', 3 * 1500000 * 1.1, 'paid', '2026-08-18 10:00:00+07']
    );
    console.log(`   ✅ ${booking3.rows[0].booking_code} — Credit Card (PAID)`);

    // -------------------------------------------------------
    // STEP 7: Insert Sample Reviews
    // -------------------------------------------------------
    console.log('\n⭐ Seeding sample reviews...');

    await client.query(
      `INSERT INTO reviews (user_id, booking_id, rating, comment)
       VALUES ($1, $2, $3, $4)`,
      [
        insertedUsers[2].id,
        booking1.rows[0].id,
        5,
        'Kamar sangat bersih dan nyaman! Staff ramah dan pelayanan memuaskan. Pasti akan kembali lagi.',
      ]
    );
    console.log('   ✅ Budi — ⭐⭐⭐⭐⭐ (5/5)');

    // -------------------------------------------------------
    // COMMIT TRANSACTION
    // -------------------------------------------------------
    await client.query('COMMIT');

    // -------------------------------------------------------
    // STEP 8: Insert Phase 6 Data (Menus, Facilities, Venues)
    // -------------------------------------------------------
    console.log('\n🍽️ Seeding Restaurant Menus...');
    for (const menu of restaurantMenusData) {
      await client.query(
        `INSERT INTO restaurant_menus (category, item_name, description, price, image_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [menu.category, menu.item_name, menu.description, menu.price, menu.image_url]
      );
    }
    console.log(`   ✅ ${restaurantMenusData.length} menu items inserted.`);

    console.log('\n🏊 Seeding Hotel Facilities...');
    for (const fac of facilitiesData) {
      await client.query(
        `INSERT INTO hotel_facilities (title, category, description, opening_hours, image_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [fac.title, fac.category, fac.description, fac.opening_hours, fac.image_url]
      );
    }
    console.log(`   ✅ ${facilitiesData.length} facilities inserted.`);

    console.log('\n🏛️ Seeding Venues & Ballrooms...');
    for (const venue of venuesData) {
      await client.query(
        `INSERT INTO venues (name, venue_type, capacity_theater, capacity_banquet, capacity_classroom, halfday_price, fullday_price, facilities, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [venue.name, venue.venue_type, venue.capacity_theater, venue.capacity_banquet, venue.capacity_classroom, venue.halfday_price, venue.fullday_price, venue.facilities, venue.image_url]
      );
    }
    console.log(`   ✅ ${venuesData.length} venues inserted.`);

    // -------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------
    console.log('\n' + '='.repeat(55));
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(55));
    console.log(`   👥 Users     : ${usersData.length} records`);
    console.log(`   🏷️  Room Types: ${roomTypesData.length} types`);
    console.log(`   🚪 Rooms     : ${roomsTemplate.length} rooms`);
    console.log(`   📅 Bookings  : 3 sample bookings`);
    console.log(`   💳 Payments  : 3 sample payments`);
    console.log(`   ⭐ Reviews   : 1 sample review`);
    console.log('='.repeat(55));
    console.log('\n📌 Demo Accounts:');
    console.log('   Admin : admin@luminaresort.com / admin123');
    console.log('   Guest : budi@gmail.com / tamu123');
    console.log('='.repeat(55));

  } catch (error) {
    // Rollback jika ada error
    await client.query('ROLLBACK');
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
};

seedDatabase();
