# 🏨 Hotel Booking Web Service - Project Mindmap & Architecture
### LUXURY Hotel & Resort - Master System Roadmap

Dokumen ini berisi peta konsep (*mindmap*), arsitektur sistem, skema database, dan rencana roadmap fitur untuk pengembangan aplikasi **LUXURY Hotel & Resort Web Service**.

---

## 📌 1. Mermaid Visual Mindmap

```mermaid
mindmap
  root((🏨 LUXURY Hotel & Resort))
    🏗️ Arsitektur & Tech Stack
      Backend
        Node.js + Express.js REST API
        PostgreSQL Relational DB (ACID)
        JWT Authentication & Bcrypt
        Row-Level Locking (Anti-Double Booking)
      Frontend
        HTML5 Semantic + Vanilla CSS3
        Modern Luxury UI (Obsidian & Champagne Gold)
        Dynamic Client JS (Fetch API)
        E-Voucher Printable Engine
      Security & Policy
        Pajak Hotel & Layanan 12%
        Role-Based Access Control (Admin vs Guest)

    👥 Modul & Hak Akses
      Guest / Tamu
        Registrasi & Login Akun
        Jelajah & Live Filter Kamar
        Proses Booking & Alokasi Kamar Otomatis
        Simulasi Multi-Metode Pembayaran
        Pembatalan Reservasi (Cancel Booking)
        Riwayat Reservasi & E-Voucher Digital
        Reservasi Meja Restoran "Angie"
        Booking Ruang Meeting & Ballroom
      Admin / Pengelola
        Dashboard Statistik & Okupansi
        Manajemen Kamar & Tipe Kamar (CRUD)
        Manajemen Reservasi & Status
        Verifikasi Pembayaran
        Manajemen Menu Restoran & Fasilitas

    ⚙️ Fitur Utama Kamar
      Katalog & Pencarian Live
        Filter Tanggal Check-in & Check-out
        Filter Rentang Harga & Kapasitas Tamu
        Galeri Foto HD Kamar & Amenities
      Booking Engine
        Anti-Double Booking (SKIP LOCKED)
        Kalkulasi Otomatis Malam + Pajak 12%
        Input Data Tamu & Permintaan Khusus
        Fitur Cancel Booking (Auto Release Room)

    🍽️ Restoran "Angie" & Kuliner (Upcoming)
      Profil & Deskripsi Restoran Angie
        Konsep Fine Dining & Atmosfer Mewah
        Jam Operasional (Breakfast, Lunch, Dinner)
      Katalog Menu Makanan & Minuman
        Appetizer, Main Course, Dessert, Mocktails/Wine
        Informasi Harga, Foto & Deskripsi Bahan
      Booking Engine Meja Restoran
        Pilih Tanggal, Sesi Makan & Jumlah Kursi
        Konfirmasi Reservasi & Special Seating

    🏊 Fasilitas Hotel (Upcoming)
      Showcase Fasilitas Bintang 5
        Infinity Pool with Sunset Ocean View
        Luxury Spa & Wellness Sanctuary
        24/7 Fitness & Gym Center
        Helipad & VIP Executive Lounge
        Private Beachfront Club

    🏛️ Ballroom & Ruang Meeting / MICE (Upcoming)
      Showcase Venue
        Grand Luxury Ballroom (Kapasitas s/d 1000 Tamu)
        Executive Meeting Rooms (Boardroom, VIP)
      Booking Engine Venue
        Pilihan Layout (Classroom, Theater, Round Table, U-Shape)
        Pilihan Paket (Half-day, Full-day, Coffee Break, Catering Buffet)
        Form Permintaan Penawaran & Reservasi Jadwal

    🚀 Standar Portfolio GitHub
      Dokumentasi README.md Lengkap
      Database Seeder Otomatis (npm run seed)
      Clean Commit History & API Docs
```

---

## 🌳 2. Plain Text Hierarchy Mindmap

```text
LUXURY HOTEL & RESORT WEB SERVICE
├── 1. ARSITEKTUR & TECH STACK
│   ├── Backend: Node.js (Express.js) - REST API
│   ├── Frontend: HTML5, CSS3 Modern (Obsidian & Champagne Gold), Vanilla JS
│   ├── Database: PostgreSQL (Relational Integrity, ACID, Row-Level Locking)
│   ├── Security: JWT Authentication & Bcrypt Password Hashing
│   └── Kebijakan Keuangan: Tarif Pajak & Layanan Flat 12%
│
├── 2. MODUL USER & FITUR
│   ├── Guest (Pengunjung / Tamu)
│   │   ├── Register & Login Akun Tamu
│   │   ├── Pencarian & Live Filter Kamar (Tanggal, Tamu, Harga)
│   │   ├── Booking Kamar Otomatis (Anti-Double Booking)
│   │   ├── Simulasi Pembayaran (VA BCA/Mandiri, QRIS, Kartu Kredit)
│   │   ├── Pembatalan Reservasi (Cancel Booking)
│   │   ├── Riwayat Reservasi Saya & Cetak E-Voucher PDF
│   │   ├── [NEW] Jelajah Restoran "Angie", Menu & Reservasi Meja
│   │   ├── [NEW] Jelajah Fasilitas Hotel & Leisure
│   │   └── [NEW] Reservasi Grand Ballroom & Ruang Meeting (MICE)
│   │
│   └── Admin (Staff / Pengelola Hotel)
│       ├── Dashboard Analytics (Revenue, Okupansi Kamar, Statistik Booking)
│       ├── Manajemen Kamar & Tipe Kamar (CRUD)
│       ├── Manajemen Status Reservasi (Confirm, Check-in, Check-out, Cancel)
│       ├── [NEW] Manajemen Menu Restoran "Angie" & Reservasi Meja
│       └── [NEW] Manajemen Jadwal & Booking Ballroom / Meeting Room
│
├── 3. CORE BUSINESS LOGIC
│   ├── Algoritma Anti-Double Booking (SELECT ... FOR UPDATE SKIP LOCKED)
│   ├── Pricing Engine (Nights × Base Price + Tax 12%)
│   ├── Cancellation Engine (Pelepasan Alokasi Kamar Otomatis)
│   └── Unique Code Generators:
│       ├── Kamar: HTL-YYYYMMDD-XXX
│       ├── Restoran: RST-YYYYMMDD-XXX
│       └── MICE / Venue: VEN-YYYYMMDD-XXX
│
├── 4. SKEMA DATABASE UTAMA
│   ├── users (Akun Tamu & Admin)
│   ├── room_types (Standard, Deluxe, Suite, Executive Family)
│   ├── rooms (Unit Fisik Kamar, Lantai, Status)
│   ├── bookings (Data Reservasi Kamar, Durasi, Total Harga)
│   ├── payments (Status Bayar, Metode, Waktu Transaksi)
│   ├── [NEW] restaurant_menus (Daftar Menu Restoran Angie)
│   ├── [NEW] table_reservations (Reservasi Meja Restoran Angie)
│   ├── [NEW] hotel_facilities (Daftar Fasilitas & Fasilitas Kamar)
│   ├── [NEW] venues (Grand Ballroom & Meeting Rooms)
│   └── [NEW] venue_bookings (Reservasi Event & Ruang Meeting)
│
└── 5. STANDAR KESIAPAN GITHUB (PORTFOLIO)
    ├── README.md Interaktif (Screenshot, GIF, Arsitektur, ERD, Step-by-Step Run)
    ├── Data Seeder Otomatis (npm run seed)
    ├── Dokumentasi REST API Lengkap
    └── Clean Git History
```

---

## 📊 3. Entity Relationship Diagram (Database Schema Lengkap)

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : makes
    USERS ||--o{ TABLE_RESERVATIONS : books
    USERS ||--o{ VENUE_BOOKINGS : reserves
    USERS ||--o{ REVIEWS : writes
    ROOM_TYPES ||--|{ ROOMS : contains
    ROOMS ||--o{ BOOKINGS : allocated_to
    BOOKINGS ||--|| PAYMENTS : has
    BOOKINGS ||--o{ REVIEWS : generates
    VENUES ||--o{ VENUE_BOOKINGS : scheduled_for

    USERS {
        uuid id PK
        string full_name
        string email UK
        string password_hash
        string role "guest | admin"
        string phone
        timestamp created_at
    }

    ROOM_TYPES {
        uuid id PK
        string name
        text description
        decimal base_price
        int capacity
        json amenities
        string image_url
    }

    ROOMS {
        uuid id PK
        uuid room_type_id FK
        string room_number
        int floor
        string status "available | maintenance"
    }

    BOOKINGS {
        uuid id PK
        string booking_code UK
        uuid user_id FK
        uuid room_id FK
        date check_in_date
        date check_out_date
        int total_nights
        decimal total_price
        string status "pending | confirmed | checked_in | completed | cancelled"
        text special_request
        timestamp created_at
    }

    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        string payment_method
        decimal amount
        string status "unpaid | paid | refunded"
        datetime paid_at
    }

    RESTAURANT_MENUS {
        uuid id PK
        string category "appetizer | main_course | dessert | beverage"
        string item_name
        text description
        decimal price
        string image_url
        boolean is_available
    }

    TABLE_RESERVATIONS {
        uuid id PK
        string reservation_code UK
        uuid user_id FK
        date reservation_date
        string session_time "breakfast | lunch | dinner"
        int guest_count
        string table_number
        string status "confirmed | cancelled | completed"
        text special_request
    }

    HOTEL_FACILITIES {
        uuid id PK
        string title
        string category "wellness | leisure | business | dining"
        text description
        string opening_hours
        string image_url
    }

    VENUES {
        uuid id PK
        string name "Grand Ballroom | Executive Boardroom"
        string venue_type "ballroom | meeting_room"
        int capacity_theater
        int capacity_banquet
        decimal halfday_price
        decimal fullday_price
        json facilities
        string image_url
    }

    VENUE_BOOKINGS {
        uuid id PK
        string venue_booking_code UK
        uuid user_id FK
        uuid venue_id FK
        date event_date
        string duration_type "half_day | full_day"
        string layout_type "theater | classroom | banquet | u_shape"
        int attendee_count
        decimal total_price
        string status "pending | confirmed | cancelled"
    }
```

---

## 🎯 4. Roadmap Tahapan Pengembangan

- [x] **Fase 1: Setup & Database Initialization**
  - Setup Node.js Express & PostgreSQL.
  - Skema database relasional (`schema.sql`) & seeder data otomatis (`seed.js`).
- [x] **Fase 2: Autentikasi & Authorization**
  - Register & Login dengan Bcrypt Password Hashing.
  - JWT Authentication Middleware & Role-Based Access Control (Admin vs Guest).
- [x] **Fase 3: REST API Kamar & Booking Engine**
  - Endpoint CRUD Kamar & Room Types.
  - Endpoint cek ketersediaan kamar dengan filter tanggal & kapasitas.
  - Endpoint pembuatan reservasi dengan alokasi otomatis (ACID Transaction & Lock).
  - Integrasi perhitungan Pajak Hotel & Layanan 12%.
  - Endpoint pembatalan reservasi (*Cancel Booking* & pelepasan kamar).
- [x] **Fase 4: Antarmuka Web (Frontend) - "LUXURY Hotel & Resort"**
  - Desain mewah (*Deep Obsidian & Champagne Gold*).
  - Floating Live Search Bar, Dynamic API Auto-Detection.
  - Suite Modal Interaktif (Login/Register, Booking Form, Simulasi Pembayaran, Riwayat Pemesanan, E-Voucher Cetak PDF).
  - Fitur Cancel Booking langsung dari UI tamu.
- [x] **Fase 5: Dashboard Admin & Dokumentasi Portfolio GitHub**
  - Dashboard statistik analitik (Total Pendapatan, Okupansi Kamar, Status Reservasi).
  - Panel kontrol manajemen reservasi & kamar bagi Admin.
  - Pembuatan dokumentasi `README.md` komprehensif (Screenshot, API Docs, Panduan Setup).
- [x] **Fase 6: Ekosistem Layanan Hotel Lengkap (Restoran "Angie", Fasilitas & MICE/Ballroom)**
  - **Task 6.1: Modul Restoran "Angie"**
    * Profil & deskripsi atmosfer fine dining Restoran Angie.
    * Katalog menu makanan & minuman (Appetizer, Main Course, Dessert, Drinks) dengan foto HD & harga.
    * Form & Engine Reservasi Meja Restoran (pilih tanggal, sesi makan, jumlah tamu, catatan alergi/preferensi).
  - **Task 6.2: Showcase Fasilitas Hotel Bintang 5**
    * Halaman/Section interaktif fasilitas hotel (Infinity Pool, Luxury Spa & Wellness, 24/7 Gym, Helipad, Beach Lounge).
    * Informasi jam buka, lokasi lantai, dan detail layanan fasilitas.
  - **Task 6.3: Booking Engine Grand Ballroom & Ruang Meeting (MICE)**
    * Katalog venue (Grand Ballroom, Executive Boardroom, Meeting Suites).
    * Konfigurasi layout (Theater, Classroom, Banquet, U-Shape) & kapasitas peserta.
    * Pemilihan paket durasi (Half-day / Full-day) & layanan catering/coffee break.
    * Form pengajuan reservasi venue & kalkulasi estimasi biaya event.
  - **Task 6.4: Backend REST API & Skema Database Fasilitas, Restoran & Venue**
    * Endpoint CRUD Menu & Reservasi Meja Restoran Angie (`/api/v1/restaurant/...`).
    * Endpoint Fasilitas Hotel (`/api/v1/facilities/...`).
    * Endpoint Katalog & Booking Venue/Ballroom (`/api/v1/venues/...`).
