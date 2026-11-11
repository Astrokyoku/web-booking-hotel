// ============================================================
// 📁 backend/config/seed.js
// Database Seeder - PAKUBUWONO EDHOTEL (SMKN 30 JAKARTA)
// Jalankan: npm run db:seed
// ============================================================

const bcrypt = require('bcryptjs');
const { pool } = require('./db');

// ============================================================
// DATA DUMMY - PAKUBUWONO EDHOTEL
// ============================================================

// 1. Data Users (Admin & Guest)
const usersData = [
  {
    full_name: 'Admin Pakubuwono Edhotel',
    email: 'admin@pakubuwonoedhotel.com',
    password: 'admin123',
    role: 'admin',
    phone: '081234567890',
  },
  {
    full_name: 'Admin Pakubuwono (Legacy)',
    email: 'admin@luminaresort.com',
    password: 'admin123',
    role: 'admin',
    phone: '081234567890',
  },
  {
    full_name: 'Staff Resepsionis Edhotel',
    email: 'staff@pakubuwonoedhotel.com',
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

// 2. Data 6 Room Types sesuai Dokumen Resmi PAKUBUWONO EDHOTEL
const roomTypesData = [
  {
    name: 'Superior Room',
    description:
      'Desain interior modern, simpel, dan fungsional seluas 20–24 sqm dengan tempat tidur Twin Bed yang memberikan kenyamanan esensial dan fasilitas praktis lengkap untuk masa menginap yang menyenangkan.',
    base_price: 785000,
    price_usd: 50,
    room_size: '20–24 sqm',
    bed_type: 'Twin Bed',
    bathroom_details:
      'Kamar mandi pribadi dilengkapi dengan shower, toilet, wastafel (washbasin), dan cermin.',
    tv_details: '32–40-inch LED / Smart TV',
    interior_design:
      'Desain interior simpel, modern, dan fungsional yang menghadirkan kenyamanan esensial serta fasilitas praktis untuk masa menginap yang menyenangkan.',
    capacity: 2,
    amenities: [
      'Air Conditioning',
      'Wi-Fi',
      '32–40" LED / Smart TV',
      'Private Shower Bathroom',
      'Small Working Desk & Chair',
      'Wardrobe',
      'Telephone',
      'Safety Deposit Box',
      'Mini Refrigerator',
      'Electric Kettle',
      'Coffee & Tea Maker',
      'Complimentary Bottled Water',
      'Bedroom Slippers',
      'Basic Bathroom Amenities',
    ],
    image_url: 'assets/images/room-superior.jpg',
  },
  {
    name: 'Deluxe Room',
    description:
      'Lebih luas dan elegan dibandingkan Superior Room (25–30 sqm) dengan Twin Bed, menampilkan furnitur yang ditingkatkan, lounge chair, sentuhan akhir interior yang berkelas, serta kenyamanan ekstra.',
    base_price: 1020000,
    price_usd: 65,
    room_size: '25–30 sqm',
    bed_type: 'Twin Bed',
    bathroom_details:
      'Kamar mandi pribadi dilengkapi dengan shower, toilet, wastafel, cermin besar, serta bathtub pada unit pilihan.',
    tv_details: '40–43-inch LED / Smart TV',
    interior_design:
      'Lebih lapang dan elegan dibandingkan Superior Room, menampilkan furnitur yang ditingkatkan, sentuhan akhir interior yang halus, dan kenyamanan ekstra.',
    capacity: 2,
    amenities: [
      'Air Conditioning',
      'Wi-Fi',
      '40–43" LED / Smart TV',
      'Shower & Bathtub (Selected)',
      'Working Desk',
      'Lounge Chair',
      'Wardrobe',
      'Telephone',
      'Safety Deposit Box',
      'Mini Refrigerator',
      'Electric Kettle',
      'Coffee & Tea Maker',
      'Complimentary Bottled Water',
      'Hair Dryer',
      'Bedroom Slippers',
      'Optional Bathrobe',
      'Complete Bathroom Amenities',
    ],
    image_url: 'assets/images/room-deluxe.jpg',
  },
  {
    name: 'Executive Room',
    description:
      'Kamar eksklusif dan berkelas seluas 30–36 sqm dengan King Bed, meja kerja eksekutif, kursi ergonomis, serta sofa santai yang menawarkan privasi dan kenyamanan tinggi bagi pelaku bisnis maupun wisatawan.',
    base_price: 1255000,
    price_usd: 80,
    room_size: '30–36 sqm',
    bed_type: 'King Bed',
    bathroom_details:
      'Kamar mandi pribadi menampilkan shower terpisah atau kombinasi bathtub dengan shower, toilet, wastafel, dan cermin besar.',
    tv_details: '43–50-inch Smart TV',
    interior_design:
      'Desain interior eksklusif dan berkelas yang menawarkan kenyamanan serta privasi lebih tinggi bagi pebisnis maupun wisatawan, dengan opsi akses Executive Lounge.',
    capacity: 2,
    amenities: [
      'Air Conditioning',
      'High-Speed Wi-Fi',
      '43–50" Smart TV',
      'Separate Shower / Bathtub Combo',
      'Executive Working Desk',
      'Ergonomic Chair',
      'Small Sofa',
      'Wardrobe',
      'Telephone',
      'Safety Deposit Box',
      'Mini Refrigerator',
      'Coffee & Tea Maker',
      'Complimentary Bottled Water',
      'Hair Dryer',
      'Bathrobe & Bedroom Slippers',
      'Premium Bathroom Amenities',
      'Executive Lounge Access (Selected)',
    ],
    image_url: 'assets/images/room-executive.jpg',
  },
  {
    name: 'Junior Suite Room',
    description:
      'Tata letak open-plan yang luas (36–45 sqm) dengan King Bed, memadukan area tidur dan ruang duduk (sofa & meja kopi) dalam satu ruangan berfurnitur elegan serta kamar mandi lengkap dengan bathtub dan vanity area.',
    base_price: 1490000,
    price_usd: 95,
    room_size: '36–45 sqm',
    bed_type: 'King Bed',
    bathroom_details:
      'Kamar mandi pribadi mewah dilengkapi dengan shower dan bathtub, toilet, wastafel, serta area rias (vanity area).',
    tv_details: '50–55-inch Smart TV',
    interior_design:
      'Tata letak open-plan yang luas memadukan area tidur dan area duduk (living area) dalam satu ruangan, menampilkan perabotan elegan dan sentuhan akhir interior kelas atas.',
    capacity: 2,
    amenities: [
      'Air Conditioning',
      'Wi-Fi',
      '50–55" Smart TV',
      'Shower & Bathtub + Vanity Area',
      'Sofa & Coffee Table (Living Area)',
      'Working Desk',
      'Large Wardrobe',
      'Coffee Machine / Coffee & Tea Maker',
      'Telephone',
      'Safety Deposit Box',
      'Mini Refrigerator',
      'Complimentary Bottled Water',
      'Hair Dryer',
      'Bathrobe & Bedroom Slippers',
      'Premium Bathroom Amenities',
    ],
    image_url: 'assets/images/room-junior-suite.jpg',
  },
  {
    name: 'Suite Room',
    description:
      'Tata letak kamar tidur King Bed dan ruang tamu (living room) terpisah seluas 50–80 sqm yang memberikan privasi lebih tinggi, keleluasaan ruang, double washbasin, bathtub, mesin kopi, dan televisi di setiap ruangan.',
    base_price: 1725000,
    price_usd: 110,
    room_size: '50–80 sqm',
    bed_type: 'King Bed',
    bathroom_details:
      'Kamar mandi pribadi yang luas menampilkan bathtub, area shower terpisah, toilet, wastafel ganda (double washbasin), cermin besar, dan vanity area.',
    tv_details: '55–65-inch Smart TV (Kamar Tidur & Ruang Tamu Terpisah)',
    interior_design:
      'Tata letak kamar tidur dan ruang tamu terpisah yang menghadirkan privasi lebih tinggi, keleluasaan ruang, dan tingkat kenyamanan maksimal dengan perabotan premium serta fasilitas eksklusif.',
    capacity: 3,
    amenities: [
      'Air Conditioning',
      'Premium Wi-Fi',
      'Dual 55–65" Smart TV',
      'Separate Living Room',
      'Bathtub, Separate Shower & Double Washbasin',
      'Sofa & Coffee Table',
      'Optional Dining Table',
      'Working Desk',
      'Large Wardrobe',
      'Coffee Machine',
      'Telephone',
      'Safety Deposit Box',
      'Mini Refrigerator',
      'Complimentary Bottled Water',
      'Hair Dryer',
      'Bathrobe & Bedroom Slippers',
      'Premium Bathroom Amenities',
    ],
    image_url: 'assets/images/room-suite.jpg',
  },
  {
    name: 'Presidential Suite',
    description:
      'Tingkat kemewahan dan eksklusivitas tertinggi seluas 100–200 sqm+ dengan Premium King Bed, ruang keluarga luas, ruang makan, walk-in closet, ruang kerja privat, pantry/kitchenette, smart room control, freestanding bathtub & jacuzzi, serta layanan Personal Butler.',
    base_price: 3925000,
    price_usd: 250,
    room_size: '100–200 sqm or more',
    bed_type: 'Premium King Bed',
    bathroom_details:
      'Kamar mandi ultra-mewah menampilkan freestanding bathtub, ruang shower terpisah, toilet terpisah, double washbasin, vanity area, serta opsi jacuzzi eksklusif.',
    tv_details: '65–85-inch Smart TV atau lebih besar (Master Bedroom & Living Room)',
    interior_design:
      'Tingkat kemewahan dan eksklusivitas tertinggi yang menampilkan ruang hunian sangat luas, area fungsional khusus, perabotan premium, desain interior berkelas, dan layanan keramahtamahan personal.',
    capacity: 4,
    amenities: [
      'Smart Room Control System',
      'Premium Wi-Fi',
      'Multiple 65–85" Smart TVs',
      'Exclusive Living Room & Dining Area',
      'Master Bedroom & Walk-in Closet',
      'Private Working Area',
      'Pantry / Kitchenette & Mini Bar',
      'Freestanding Bathtub & Jacuzzi (Selected)',
      'Premium Coffee Machine',
      'Large Safety Deposit Box',
      'Hair Dryer',
      'Premium Bathrobe & Branded Amenities',
      'Personalized Butler Service',
    ],
    image_url: 'assets/images/room-presidential-suite.jpg',
  },
];

// 3. Data Rooms (Kamar Fisik per Lantai)
const roomsTemplate = [
  // 1. Superior Rooms (Lantai 1)
  { type_index: 0, room_number: '101', floor: 1 },
  { type_index: 0, room_number: '102', floor: 1 },
  { type_index: 0, room_number: '103', floor: 1 },
  // 2. Deluxe Rooms (Lantai 2)
  { type_index: 1, room_number: '201', floor: 2 },
  { type_index: 1, room_number: '202', floor: 2 },
  { type_index: 1, room_number: '203', floor: 2 },
  // 3. Executive Rooms (Lantai 3)
  { type_index: 2, room_number: '301', floor: 3 },
  { type_index: 2, room_number: '302', floor: 3 },
  { type_index: 2, room_number: '303', floor: 3 },
  // 4. Junior Suite Rooms (Lantai 4)
  { type_index: 3, room_number: '401', floor: 4 },
  { type_index: 3, room_number: '402', floor: 4 },
  { type_index: 3, room_number: '403', floor: 4 },
  // 5. Suite Rooms (Lantai 5)
  { type_index: 4, room_number: '501', floor: 5 },
  { type_index: 4, room_number: '502', floor: 5 },
  { type_index: 4, room_number: '503', floor: 5 },
  // 6. Presidential Suites (Lantai 6)
  { type_index: 5, room_number: '601', floor: 6 },
  { type_index: 5, room_number: '602', floor: 6 },
];

// 4. Data Menu Andrawina Restaurant (1st Floor)
const restaurantMenusData = [
  {
    category: 'appetizer',
    item_name: 'Soto Betawi Royal Senayan',
    description: 'Hidangan pembuka autentik khas Jakarta dengan kuah susu gurih, daging sapi pilihan, dan emping renyah',
    price: 95000,
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'appetizer',
    item_name: 'Truffle Cream Mushroom Soup',
    description: 'Sup jamur champignon lembut dengan aroma minyak truffle putih dan garlic brioche panggang',
    price: 115000,
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'main_course',
    item_name: 'Nasi Goreng Andrawina Spesial',
    description: 'Nasi goreng warisan Nusantara dilengkapi sate ayam bumbu kacang, udang bakar, acar, dan telur mata sapi',
    price: 145000,
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'main_course',
    item_name: 'Australian Prime Sirloin Steak',
    description: 'Steak daging sapi impor panggang dengan kentang tumbuk lembut, sayuran organik, dan saus lada hitam',
    price: 385000,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'dessert',
    item_name: 'Klepon Lava Cake & Gelato',
    description: 'Kreasi pastry modern perpaduan pandan hangat berinti gula aren cair dengan es krim kelapa',
    price: 85000,
    image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'drinks',
    item_name: 'Pakubuwono Signature Mocktail & Artisan Coffee',
    description: 'Pilihan kopi Arabika Nusantara atau mocktail segar racikan barista Andrawina & Café Lantai 2',
    price: 65000,
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
  },
];

// 5. Data 10 Fasilitas Hotel Resmi (Sesuai Dokumen PDF PAKUBUWONO EDHOTEL)
const facilitiesData = [
  {
    title: '1. Swimming Pool (1st Floor)',
    category: 'Lantai 1 • Rekreasi & Olahraga Air',
    description:
      'Fasilitas rekreasi dan bersantai di Lantai 1 di mana para tamu dapat menikmati aktivitas berenang, relaksasi, dan kegiatan air lainnya. Dilengkapi kursi berjemur (sun loungers), fasilitas shower bilas, ruang ganti, dan handuk kolam.',
    opening_hours: 'Lantai 1 • 06:00 - 20:00',
    image_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '2. Fitness Center / Gym (5th Floor)',
    category: 'Lantai 5 • Kebugaran & Kesehatan',
    description:
      'Area olahraga khusus di Lantai 5 yang dilengkapi dengan treadmill, sepeda statis, dumbbell, mesin beban (weight machines), serta peralatan kebugaran lainnya untuk membantu tamu menjaga kesehatan dan kebugaran fisik selama menginap.',
    opening_hours: 'Lantai 5 • 06:00 - 22:00',
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '3. Andrawina Restaurant (1st Floor)',
    category: 'Lantai 1 • Kuliner & Restoran',
    description:
      'Fasilitas bersantap utama di Lantai 1 yang menyajikan beragam hidangan kuliner lokal Nusantara dan internasional untuk sarapan (breakfast), makan siang (lunch), dan makan malam (dinner) dengan layanan makanan & minuman profesional.',
    opening_hours: 'Lantai 1 • 06:00 - 22:00',
    image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '4. Meeting Room (2nd Floor)',
    category: 'Lantai 2 • Bisnis & Konferensi',
    description:
      'Ruang khusus di Lantai 2 untuk rapat bisnis, seminar, presentasi, sesi pelatihan (training), dan pertemuan korporat. Dilengkapi meja, kursi, proyektor atau layar LED, sistem tata suara (sound system), dan akses internet.',
    opening_hours: 'Lantai 2 • 08:00 - 22:00',
    image_url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '5. Ballroom (2nd Floor)',
    category: 'Lantai 2 • Perhelatan & Banquet',
    description:
      'Ruang acara berkapasitas besar di Lantai 2 yang dirancang untuk resepsi pernikahan, konferensi, gala dinner, pameran (exhibition), dan acara korporat. Dilengkapi panggung (stage), sound system, peralatan tata cahaya, dan fasilitas banquet.',
    opening_hours: 'Lantai 2 • Sesuai Jadwal Acara',
    image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '6. Spa & Wellness Center (7th Floor)',
    category: 'Lantai 7 • Relaksasi & Kebugaran',
    description:
      'Fasilitas relaksasi dan perawatan tubuh di Lantai 7 yang menawarkan layanan pijat (massage), perawatan tubuh, aromaterapi, dan perawatan kecantikan untuk meningkatkan kenyamanan, ketenangan, dan kebugaran tamu secara menyeluruh.',
    opening_hours: 'Lantai 7 • 09:00 - 21:00',
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '7. Lobby & Lounge (1st Floor)',
    category: 'Lantai 1 • Resepsionis & Area Tunggu',
    description:
      'Area resepsionis utama dan ruang penyambutan di Lantai 1 di mana tamu melakukan check-in, check-out, menunggu, dan bersantai. Dilengkapi meja resepsionis, sofa yang nyaman, meja tamu, serta area pusat informasi.',
    opening_hours: 'Lantai 1 • 24 Jam',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: '8. Café / Coffee Shop (2nd Floor)',
    category: 'Lantai 2 • Kafe & Bersantai',
    description:
      'Area bersantap kasual dan relaksasi di Lantai 2 yang menyajikan kopi pilihan, teh, aneka minuman, pastry, dan makanan ringan. Menyediakan ruang nyaman untuk pertemuan informal, bekerja, maupun bersosialisasi.',
    opening_hours: 'Lantai 2 • 07:00 - 22:00',
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: "9. Kids Club / Children's Playground (2nd Floor)",
    category: 'Lantai 2 • Rekreasi Anak & Keluarga',
    description:
      'Area rekreasi khusus anak-anak di Lantai 2 yang menyediakan fasilitas bermain aman, permainan edukatif, aktivitas kreatif, serta hiburan seru untuk kenyamanan keluarga yang menginap.',
    opening_hours: 'Lantai 2 • 08:00 - 20:00',
    image_url: 'assets/images/facility-kids-playground.jpg',
  },
  {
    title: '10. Parking Area (Basement)',
    category: 'Basement • Parkir & Keamanan',
    description:
      'Fasilitas parkir khusus di area Basement dan Outdoor bagi tamu hotel, pengunjung restoran, serta tamu acara/event, didukung penuh oleh layanan keamanan 24 jam dan manajemen kendaraan profesional.',
    opening_hours: 'Basement & Outdoor • 24 Jam',
    image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
  },
];

// 6. Data Venues (Ballroom & Meeting Room Lantai 2)
const venuesData = [
  {
    name: 'Pakubuwono Grand Ballroom (2nd Floor)',
    venue_type: 'ballroom',
    capacity_theater: 800,
    capacity_banquet: 450,
    capacity_classroom: 500,
    halfday_price: 25000000,
    fullday_price: 45000000,
    facilities: [
      'Stage / Panggung Utama',
      'Sound System Profesional',
      'Lighting Equipment',
      'LED Screen & Proyektor',
      'Banquet & Catering Facilities',
      'High-Speed Internet Access',
    ],
    image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Senayan Executive Meeting Room (2nd Floor)',
    venue_type: 'meeting_room',
    capacity_theater: 100,
    capacity_banquet: 60,
    capacity_classroom: 80,
    halfday_price: 5000000,
    fullday_price: 8500000,
    facilities: [
      'Meja & Kursi Konferensi',
      'Proyektor & Layar LED',
      'Sound System & Mikrofon',
      'High-Speed Internet Access',
      'Whiteboard & Flipchart',
      'Coffee Break & Banquet Support',
    ],
    image_url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
  },
];

// ============================================================
// FUNGSI SEEDER
// ============================================================

const seedDatabase = async () => {
  console.log('='.repeat(60));
  console.log('🌱 PAKUBUWONO EDHOTEL (SMKN 30 JAKARTA) - Database Seeder');
  console.log('='.repeat(60));

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // -------------------------------------------------------
    // STEP 0: Pastikan kolom tambahan pada room_types tersedia
    // -------------------------------------------------------
    await client.query(`
      ALTER TABLE room_types
      ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10, 2) DEFAULT 50.00,
      ADD COLUMN IF NOT EXISTS room_size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS bed_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bathroom_details TEXT,
      ADD COLUMN IF NOT EXISTS tv_details VARCHAR(150),
      ADD COLUMN IF NOT EXISTS interior_design TEXT;
    `);

    // -------------------------------------------------------
    // STEP 1: Hapus data lama (urutan sesuai dependensi FK)
    // -------------------------------------------------------
    console.log('\n🗑️  Clearing existing data...');
    await client.query('DELETE FROM venue_bookings');
    await client.query('DELETE FROM table_reservations');
    await client.query('DELETE FROM venues');
    await client.query('DELETE FROM hotel_facilities');
    await client.query('DELETE FROM restaurant_menus');
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
    // STEP 3: Insert Room Types (6 Tipe Kamar)
    // -------------------------------------------------------
    console.log('\n🏷️  Seeding 6 room types...');
    const insertedRoomTypes = [];
    for (const type of roomTypesData) {
      const result = await client.query(
        `INSERT INTO room_types (
          name, description, base_price, price_usd, room_size, bed_type,
          bathroom_details, tv_details, interior_design, capacity, amenities, image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name, base_price, price_usd`,
        [
          type.name,
          type.description,
          type.base_price,
          type.price_usd,
          type.room_size,
          type.bed_type,
          type.bathroom_details,
          type.tv_details,
          type.interior_design,
          type.capacity,
          type.amenities,
          type.image_url,
        ]
      );
      insertedRoomTypes.push(result.rows[0]);
      console.log(
        `   ✅ ${result.rows[0].name} — Rp ${Number(result.rows[0].base_price).toLocaleString('id-ID')} ($${Number(result.rows[0].price_usd)}) / malam`
      );
    }

    // -------------------------------------------------------
    // STEP 4: Insert Rooms (Kamar Fisik)
    // -------------------------------------------------------
    console.log('\n🚪 Seeding physical rooms...');
    const insertedRooms = [];
    for (const room of roomsTemplate) {
      const roomTypeId = insertedRoomTypes[room.type_index].id;
      const result = await client.query(
        `INSERT INTO rooms (room_type_id, room_number, floor, status) 
         VALUES ($1, $2, $3, 'available') RETURNING id, room_number, floor`,
        [roomTypeId, room.room_number, room.floor]
      );
      insertedRooms.push({ ...result.rows[0], type_index: room.type_index });
      console.log(
        `   ✅ Room #${result.rows[0].room_number} (Lantai ${result.rows[0].floor}) — ${insertedRoomTypes[room.type_index].name}`
      );
    }

    // -------------------------------------------------------
    // STEP 5: Insert Sample Bookings
    // -------------------------------------------------------
    console.log('\n📅 Seeding sample bookings...');
    const guestBudi = insertedUsers.find((u) => u.email === 'budi@gmail.com');
    const guestSiti = insertedUsers.find((u) => u.email === 'siti.rahayu@gmail.com');
    const guestAhmad = insertedUsers.find((u) => u.email === 'ahmad.wijaya@gmail.com');

    // Booking 1: Budi memesan Superior Room 101 (Rp 785.000)
    const booking1 = await client.query(
      `INSERT INTO bookings (booking_code, user_id, room_id, check_in_date, check_out_date, total_nights, total_price, status, special_requests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, booking_code, status`,
      [
        'PKB-20260810-001',
        guestBudi.id,
        insertedRooms[0].id, // Room 101 (Superior Room)
        '2026-08-10',
        '2026-08-13',
        3,
        Math.round(3 * 785000 * 1.12), // 3 malam × 785k + 12% pajak
        'confirmed',
        'Extra pillow & non-smoking room',
      ]
    );
    console.log(`   ✅ ${booking1.rows[0].booking_code} — Budi → Room #101 Superior (${booking1.rows[0].status})`);

    // Booking 2: Siti memesan Deluxe Room 201 (Rp 1.020.000)
    const booking2 = await client.query(
      `INSERT INTO bookings (booking_code, user_id, room_id, check_in_date, check_out_date, total_nights, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, booking_code, status`,
      [
        'PKB-20260815-002',
        guestSiti.id,
        insertedRooms[3].id, // Room 201 (Deluxe Room)
        '2026-08-15',
        '2026-08-17',
        2,
        Math.round(2 * 1020000 * 1.12), // 2 malam × 1.020k + 12% pajak
        'pending',
      ]
    );
    console.log(`   ✅ ${booking2.rows[0].booking_code} — Siti → Room #201 Deluxe (${booking2.rows[0].status})`);

    // Booking 3: Ahmad memesan Suite Room 501 (Rp 1.725.000)
    const booking3 = await client.query(
      `INSERT INTO bookings (booking_code, user_id, room_id, check_in_date, check_out_date, total_nights, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, booking_code, status`,
      [
        'PKB-20260820-003',
        guestAhmad.id,
        insertedRooms[12].id, // Room 501 (Suite Room)
        '2026-08-20',
        '2026-08-23',
        3,
        Math.round(3 * 1725000 * 1.12), // 3 malam × 1.725k + 12% pajak
        'confirmed',
      ]
    );
    console.log(`   ✅ ${booking3.rows[0].booking_code} — Ahmad → Room #501 Suite (${booking3.rows[0].status})`);

    // -------------------------------------------------------
    // STEP 6: Insert Sample Payments
    // -------------------------------------------------------
    console.log('\n💳 Seeding sample payments...');

    await client.query(
      `INSERT INTO payments (booking_id, payment_method, amount, status, paid_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [booking1.rows[0].id, 'bank_transfer', Math.round(3 * 785000 * 1.12), 'paid', '2026-08-08 14:30:00+07']
    );

    await client.query(
      `INSERT INTO payments (booking_id, payment_method, amount, status)
       VALUES ($1, $2, $3, $4)`,
      [booking2.rows[0].id, 'ewallet', Math.round(2 * 1020000 * 1.12), 'unpaid']
    );

    await client.query(
      `INSERT INTO payments (booking_id, payment_method, amount, status, paid_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [booking3.rows[0].id, 'credit_card', Math.round(3 * 1725000 * 1.12), 'paid', '2026-08-18 10:00:00+07']
    );

    // -------------------------------------------------------
    // STEP 7: Insert Sample Reviews
    // -------------------------------------------------------
    console.log('\n⭐ Seeding sample reviews...');
    await client.query(
      `INSERT INTO reviews (user_id, booking_id, rating, comment)
       VALUES ($1, $2, $3, $4)`,
      [
        guestBudi.id,
        booking1.rows[0].id,
        5,
        'Lokasi Pakubuwono Edhotel sangat strategis di Senayan dekat GBK dan Senayan City! Kamar Superior sangat bersih, fasilitas lengkap, dan sarapan di Andrawina Restaurant lezat.',
      ]
    );

    // -------------------------------------------------------
    // STEP 8: Insert Restaurant Menus, 10 Facilities, & Venues
    // -------------------------------------------------------
    console.log('\n🍽️  Seeding Andrawina Restaurant Menus...');
    for (const menu of restaurantMenusData) {
      await client.query(
        `INSERT INTO restaurant_menus (category, item_name, description, price, image_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [menu.category, menu.item_name, menu.description, menu.price, menu.image_url]
      );
    }
    console.log(`   ✅ ${restaurantMenusData.length} menu items inserted.`);

    console.log('\n🏊 Seeding 10 Hotel Facilities...');
    for (const fac of facilitiesData) {
      await client.query(
        `INSERT INTO hotel_facilities (title, category, description, opening_hours, image_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [fac.title, fac.category, fac.description, fac.opening_hours, fac.image_url]
      );
    }
    console.log(`   ✅ ${facilitiesData.length} facilities inserted.`);

    console.log('\n🏛️  Seeding Venues & Ballrooms (2nd Floor)...');
    for (const venue of venuesData) {
      await client.query(
        `INSERT INTO venues (name, venue_type, capacity_theater, capacity_banquet, capacity_classroom, halfday_price, fullday_price, facilities, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          venue.name,
          venue.venue_type,
          venue.capacity_theater,
          venue.capacity_banquet,
          venue.capacity_classroom,
          venue.halfday_price,
          venue.fullday_price,
          venue.facilities,
          venue.image_url,
        ]
      );
    }
    console.log(`   ✅ ${venuesData.length} venues inserted.`);

    await client.query('COMMIT');

    // -------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PAKUBUWONO EDHOTEL SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`   👥 Users      : ${usersData.length} records`);
    console.log(`   🏷️  Room Types : ${roomTypesData.length} types (Superior s/d Presidential Suite)`);
    console.log(`   🚪 Rooms      : ${roomsTemplate.length} physical rooms`);
    console.log(`   🏊 Facilities : ${facilitiesData.length} hotel facilities`);
    console.log(`   🍽️  Menus      : ${restaurantMenusData.length} Andrawina Restaurant menus`);
    console.log(`   🏛️  Venues     : ${venuesData.length} MICE venues`);
    console.log('='.repeat(60));
    console.log('\n📌 Demo Accounts:');
    console.log('   Admin : admin@pakubuwonoedhotel.com / admin123');
    console.log('   Guest : budi@gmail.com / tamu123');
    console.log('='.repeat(60));
  } catch (error) {
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
