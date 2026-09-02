# 📝 Plaintext Mindmap & Specification - Web Booking Hotel
### LUXURY Hotel & Resort - System Architecture & Extended Features

Dokumen ini menyajikan peta konsep (*mindmap*), struktur hirarki teks murni, dan garis besar arsitektur dalam format **Plaintext Markdown**. Format ini sangat mudah dibaca langsung di text editor/terminal dan kompatibel untuk diimpor ke aplikasi mindmapping (seperti XMind, MindNode, FreeMind, atau PlantUML).

---

## 🌲 1. Struktur Pohon Unicode (ASCII / Unicode Tree)

```text
LUXURY HOTEL & RESORT WEB SERVICE
│
├── [01] ARSITEKTUR & TECH STACK
│   ├── Backend
│   │   ├── Runtime: Node.js (v18+)
│   │   ├── Framework: Express.js (REST API Architecture)
│   │   ├── Keamanan: JWT (JSON Web Token), Bcrypt Hashing, CORS, Helmet
│   │   └── Routing: /api/v1/auth, /api/v1/rooms, /api/v1/bookings
│   │
│   ├── Frontend
│   │   ├── Struktur: HTML5 Semantic
│   │   ├── Tampilan: Modern Luxury CSS3 (Obsidian & Champagne Gold)
│   │   └── Interaksi: Vanilla JavaScript (ES6+ Fetch API, DOM Manipulation)
│   │
│   ├── Database
│   │   ├── Engine: PostgreSQL (Relational DB, ACID Transactions)
│   │   ├── Integritas: Foreign Keys, Unique Constraints, Row-Level Locking
│   │   └── Inisialisasi: schema.sql & seed.js
│   │
│   └── Dokumentasi & Tools
│       ├── REST Documentation: Swagger / OpenAPI Spec
│       ├── API Testing: Postman Collection
│       └── Version Control: Git & GitHub
│
├── [02] USER ROLES & FITUR SISTEM
│   ├── Guest (Pengunjung / Tamu)
│   │   ├── 1. Autentikasi: Register, Login, Logout, Profil Saya
│   │   ├── 2. Eksplorasi: Pencarian kamar live, filter tanggal & harga, galeri foto HD
│   │   ├── 3. Booking Engine: Pilih kamar, isi data tamu, request khusus
│   │   ├── 4. Checkout: Kalkulasi otomatis malam & pajak 12%, simulasi pembayaran
│   │   ├── 5. Pembatalan: Cancel booking mandiri & pelepasan kamar instan
│   │   ├── 6. E-Voucher: Tinjau kode booking unik, status bayar, cetak PDF
│   │   ├── 7. Restoran "Angie": Profil restoran, katalog menu & reservasi meja
│   │   ├── 8. Fasilitas Hotel: Jelajah Infinity Pool, Spa, Gym & Beach Club
│   │   └── 9. MICE & Venue: Booking Grand Ballroom & Ruang Meeting
│   │
│   └── Admin (Staff / Pengelola Hotel)
│       ├── 1. Dashboard: Grafik okupansi, statistik revenue bulanan, booking aktif
│       ├── 2. Manajemen Kamar (CRUD): Tambah, ubah data kamar & tipe kamar, kelola tarif
│       ├── 3. Manajemen Reservasi: Filter reservasi, ubah status (Checked-In/Out/Cancel)
│       ├── 4. Transaksi: Verifikasi mutasi pembayaran masuk
│       ├── 5. Manajemen Restoran: Kelola menu makanan/minuman & reservasi meja
│       └── 6. Manajemen Venue: Kelola jadwal event ballroom & meeting rooms
│
├── [03] LOGIKA BISNIS UTAMA (CORE ENGINEERING LOGIC)
│   ├── 1. Pengecekan Ketersediaan Kamar (Anti-Double Booking)
│   │   └── Row-level Locking: SELECT ... FOR UPDATE SKIP LOCKED
│   ├── 2. Price Calculation Engine
│   │   └── Total = (Harga_Dasar * Jumlah_Malam) + Pajak_Layanan (12%)
│   ├── 3. Unique Booking Code Generator
│   │   ├── Kamar: HTL-YYYYMMDD-RANDOM (Contoh: HTL-20260805-5D3)
│   │   ├── Restoran: RST-YYYYMMDD-RANDOM (Contoh: RST-20260805-1A2)
│   │   └── Venue/MICE: VEN-YYYYMMDD-RANDOM (Contoh: VEN-20260805-9C4)
│   └── 4. State Machine Status Booking
│       └── Pending ──> Confirmed ──> Checked-In ──> Completed
│             │
│             └───> Cancelled (Kamar kembali Available)
│
├── [04] SKEMA DATABASE RELASIONAL
│   ├── USERS: id, full_name, email, password_hash, role, phone, created_at
│   ├── ROOM_TYPES: id, name, description, base_price, capacity, amenities, image_url
│   ├── ROOMS: id, room_type_id, room_number, floor, status
│   ├── BOOKINGS: id, booking_code, user_id, room_id, check_in_date, check_out_date, total_nights, total_price, status, special_request, created_at
│   ├── PAYMENTS: id, booking_id, payment_method, amount, status, paid_at
│   ├── REVIEWS: id, user_id, booking_id, rating, comment, created_at
│   ├── RESTAURANT_MENUS: id, category, item_name, description, price, image_url, is_available
│   ├── TABLE_RESERVATIONS: id, reservation_code, user_id, reservation_date, session_time, guest_count, table_number, status
│   ├── HOTEL_FACILITIES: id, title, category, description, opening_hours, image_url
│   ├── VENUES: id, name, venue_type, capacity_theater, capacity_banquet, halfday_price, fullday_price, facilities, image_url
│   └── VENUE_BOOKINGS: id, venue_booking_code, user_id, venue_id, event_date, duration_type, layout_type, attendee_count, total_price, status
│
└── [05] STANDAR KESIAPAN GITHUB (PORTFOLIO READINESS)
    ├── 1. README.md informatif dengan badges, screenshot visual, dan panduan run
    ├── 2. Seeder database dummy (npm run seed) untuk pengujian instan
    ├── 3. Commit history terstruktur mengikuti Conventional Commits
    └── 4. Dokumentasi API Lengkap & Ekosistem Hotel Holistik
```

---

## 📑 2. Format Tab-Indented Outline (Kompatibel Import XMind / MindNode)

```text
LUXURY Hotel & Resort Web System
	Arsitektur & Tech Stack
		Backend
			Node.js & Express.js REST API
			JWT Authentication & Bcrypt Hashing
			PostgreSQL Relational DB (ACID Transactions)
		Frontend
			HTML5 Semantic
			Modern Luxury CSS3 (Obsidian & Gold)
			Vanilla JavaScript Fetch API
		Keuangan & Regulasi
			Pajak Hotel & Layanan 12%
	Modul Kamar & Reservasi
		Katalog & Live Filter Ketersediaan
		Anti-Double Booking Engine
		Simulasi Pembayaran (VA, QRIS, Kartu)
		Pembatalan Reservasi (Cancel Booking)
		E-Voucher Digital & Cetak PDF
	Modul Restoran "Angie"
		Profil & Atmosfer Fine Dining Angie
		Katalog Menu Makanan & Minuman (Appetizer, Main, Dessert, Wine)
		Booking / Reservasi Meja Restoran (Tanggal, Jam, Jumlah Orang)
	Modul Fasilitas Hotel
		Infinity Pool with Ocean Sunset
		Luxury Spa & Wellness Sanctuary
		24/7 Gym & Fitness Studio
		Helipad & VIP Executive Lounge
	Modul Ballroom & Meeting Rooms / MICE
		Grand Luxury Ballroom Booking
		Executive Meeting Suites
		Konfigurasi Layout (Theater, Classroom, Banquet, U-Shape)
		Paket Half-Day / Full-Day & Catering
	Dashboard Admin & Analitik
		Statistik Okupansi & Pendapatan
		Manajemen Kamar & Reservasi
		Manajemen Menu Restoran & Fasilitas
```
