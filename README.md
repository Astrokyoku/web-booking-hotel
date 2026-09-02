# 🏨 LUXURY Hotel & Resort - API & Web App
<div align="center">
  <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80" alt="Luxury Hotel Cover" width="100%" style="border-radius: 12px; margin-bottom: 20px;">
  
  **Sistem Reservasi Hotel Berbasis Web App & RESTful API Terintegrasi.**  
  *Dirancang dengan arsitektur modern, Glassmorphism UI, dan kapabilitas Admin penuh.*
</div>

---

## ✨ Fitur Utama (Features)

### 🧑‍💻 **User & Guest App (Frontend)**
- **Auth System**: Login, Register, dan Session berbasis JWT.
- **Room Booking Flow**: Live-check ketersediaan kamar, filter tipe kamar (Deluxe, Suite, Signature), & kalkulasi harga.
- **Ekosistem Layanan**: Penambahan layanan MICE (Ballroom), Reservasi Meja Restoran Angie, & Katalog Fasilitas.
- **Responsive UI/UX**: Desain premium bertema *Dark Obsidian & Champagne Gold* menggunakan teknik *Glassmorphism*.

### 🛡️ **Admin Dashboard (Management Portal)**
- **KPI & Analytics**: Ringkasan data (Total reservasi, okupansi kamar, dan total pendapatan).
- **Room Inventory**: Manajemen ketersediaan kamar, status pembersihan, & *maintenance*.
- **Guest Management**: Fitur **Blacklist** (memblokir tamu nakal tanpa menghapus data) & **Reset Password**.
- **Booking Management**: Menyetujui reservasi, merubah status check-in/check-out.

### ⚙️ **Backend & Database**
- **RESTful API**: Struktur endpoint yang rapi menggunakan `Express.js`.
- **Database Relasional**: Didesain dengan `PostgreSQL` (Skema Relasional untuk Users, Rooms, Bookings, Services).
- **Security**: Password Hashing menggunakan `Bcrypt` & Autentikasi dengan `JSON Web Token (JWT)`.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

| Kategori | Teknologi / Tools |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3 (Glassmorphism), Vanilla JavaScript, FontAwesome |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL, `pg` (Node-Postgres) |
| **Security** | JWT (JSON Web Token), Bcrypt, Helmet |

---

## 🚀 Cara Instalasi & Menjalankan (Getting Started)

### 1. Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/en/) (v16 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/) (Server berjalan di komputer Anda)

### 2. Konfigurasi Database
Buat database baru di PostgreSQL Anda (misalnya: `hotel_booking_db`).
Buat file `.env` di folder utama aplikasi ini, lalu isi kredensial berikut:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=hotel_booking_db
JWT_SECRET=super_secret_jwt_key_luxury_hotel
JWT_EXPIRES_IN=24h
```

### 3. Instalasi Dependencies
Buka terminal di dalam folder proyek, lalu jalankan:
```bash
npm install
```

### 4. Migrasi & Seed Database
Aplikasi ini dilengkapi dengan skrip otomatis untuk membuat tabel dan mengisi data awal (kamar, admin, fasilitas).
```bash
npm run db:init
npm run db:seed
```
*Note: Akses Admin default adalah email: `admin@luminaresort.com` / pass: `admin123`*

### 5. Menjalankan Server
```bash
npm start
```
Server akan berjalan di `http://localhost:5000`. 
Anda bisa langsung membuka URL tersebut di browser untuk mengakses web aplikasi.

---

## 📂 Struktur Folder (Project Structure)
```
/Web Booking Hotel
├── backend/
│   ├── config/        # Koneksi database & script migrasi/seeder
│   ├── controllers/   # Logika bisnis (Auth, Admin, Rooms, Bookings, Services)
│   ├── middleware/    # Proteksi rute (JWT Auth & Admin Role)
│   ├── routes/        # Definisi Endpoint REST API
│   ├── utils/         # Helper functions (Code generator, hashing)
│   └── server.js      # Entry point Express
├── frontend/
│   ├── assets/        # CSS, JavaScript (app.js, admin.js), Images
│   ├── admin.html     # Portal Admin
│   ├── index.html     # Halaman Utama (Tamu)
│   └── (file HTML lainnya: login, booking, mice, restaurant)
└── README.md
```

---

## 💻 Author
**Dikembangkan oleh Dias Adi Setiawan** sebagai *Portfolio Full-Stack Web Development*.
- [GitHub](https://github.com/Astrokyoku)
- [LinkedIn](https://www.linkedin.com/in/dias-adi-setiawan-860762385/)

*Project ini adalah simulasi sistem reservasi perhotelan profesional yang dibangun untuk keperluan demonstrasi arsitektur perangkat lunak dan keahlian web development.*
