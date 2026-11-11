# 🏨 PAKUBUWONO EDHOTEL — SMKN 30 Jakarta (Web Booking & Front Office System)

<div align="center">
  <img src="frontend/assets/images/logo-pakubuwono.png" alt="Logo Pakubuwono Edhotel SMKN 30 Jakarta" width="220" style="margin-bottom: 16px;">

  **Sistem Informasi Reservasi Hotel, Restoran, MICE & Front Office Berbasis Web App dan RESTful API.**  
  *Berlokasi strategis di kawasan Senayan, Jakarta Selatan — dekat Gelora Bung Karno (GBK), Senayan Driving Range, Senayan National Golf Club, Senayan City, Plaza Senayan, dan fX Sudirman.*
</div>

---

## ✨ Fitur Utama (Key Features)

### 🧑‍💻 **1. Guest & Public Web Application (Frontend)**
- **Autentikasi & Sesi Tamu**: Login, Registrasi akun baru, dan manajemen sesi berbasis **JWT (JSON Web Token)**.
- **Mesin Pencarian & Ketersediaan Kamar Real-Time**: Pengecekan otomatis kamar kosong berdasarkan tanggal *Check-In*, *Check-Out*, jumlah tamu, dan batas anggaran (*Max Price*).
- **6 Tipe Kamar Standar Perhotelan (IDR & USD)**:
  - Menampilkan spesifikasi lengkap setiap tipe kamar: **Luas Kamar (`sqm`)**, **Tipe Tempat Tidur (`Twin / King Bed`)**, **Kamar Mandi (`Bathroom`)**, **Ukuran TV (`Television`)**, **Fasilitas Dalam Kamar (`In-Room Facilities`)**, dan **Desain Interior (`Interior Design`)** beserta tabel ringkasan tarif (*Bedroom Rates*).
- **Input Formulir Reservasi Lengkap**:
  - Mendukung pemilihan **Bed Type (`TW / KS`)**, **Alamat Tamu**, serta detail opsional **Arrival/Departure Flight No.**, **ETA/ETD**, **Company Name / Instansi**, dan **Billing Instruction**.
- **Cetak E-Voucher Digital & Official Reservation Form (1:1 PDF)**:
  - Menyediakan 2 mode bukti reservasi siap cetak (*1 halaman A4 utuh*): **E-Voucher Digital Modern** dan **Official Reservation Form** standar operasional *Front Office* Edhotel SMKN 30 Jakarta.
- **Ekosistem Layanan Hotel Terpadu**:
  - **Andrawina Restaurant (1st Floor)**: Katalog menu kuliner Nusantara & internasional beserta sistem reservasi meja dan pembayaran deposit.
  - **MICE & Ballroom (2nd Floor)**: Reservasi **Pakubuwono Grand Ballroom** dan **Senayan Executive Meeting Room** dengan kalkulasi durasi *Half-Day* / *Full-Day* dan pilihan tata letak kursi (*Theater, Classroom, Banquet, U-Shape*).
  - **10 Fasilitas Hotel per Lantai**: Katalog lengkap fasilitas hotel dari *Basement* hingga *Lantai 7*.
  - **Ulasan & Rating Tamu Terverifikasi**: Tamu dapat memberikan rating bintang (1–5) dan ulasan pengalaman menginap.

### 🛡️ **2. Admin & Front Office Portal (`admin.html`)**
- **KPI & Analitik Real-Time**: Ringkasan total pendapatan, persentase okupansi kamar, jumlah reservasi menunggu konfirmasi, jadwal *check-in*/*check-out* hari ini, dan rata-rata rating hotel.
- **Manajemen Reservasi Kamar & Cetak Reservation Form**:
  - Verifikasi pembayaran tamu, perubahan status (*Confirmed*, *Checked-In*, *Completed/Checked-Out*, *Cancelled*).
  - Fitur **Cetak Official Reservation Form Interaktif**: Petugas/siswa dapat mengklik langsung kotak status (*New Booking / Amandement / Cancellation*), sumber reservasi (*Phone / Letter / Email / Personal / OTA / Others*), maupun *Bed Type (TW/KS)* sebelum mencetak ke PDF.
- **Manajemen Reservasi Andrawina Restaurant & MICE Venue**: Verifikasi pembayaran deposit meja restoran dan sewa ballroom/meeting room.
- **Manajemen Inventori Kamar per Lantai**: Pemantauan visual 17 kamar fisik di Lantai 1–6 (*Available, Occupied, Cleaning, Maintenance*) dan penambahan kamar fisik baru.
- **Direktori Tamu & Moderasi Ulasan**: Fitur **Blacklist / Unblacklist** tamu, **Reset Password**, dan moderasi ulasan.

### ⚙️ **3. Backend & Database Architecture**
- **RESTful API dengan Express.js**: Arsitektur modular dengan pemisahan *Routes*, *Controllers*, *Middleware*, dan *Utilities*.
- **Transaksi Database ACID (`FOR UPDATE SKIP LOCKED`)**: Mencegah *double-booking* saat beberapa tamu memesan tipe kamar yang sama secara bersamaan.
- **Keamanan Berlapis**: *Password Hashing* dengan `bcryptjs`, proteksi *HTTP Headers* dengan `Helmet`, `CORS`, dan otorisasi berbasis peran (*Role-Based Access Control*: `guest` & `admin`).

---

## 🛏️ Daftar Tipe Kamar & Harga (Bedroom Rates)

| No | Tipe Kamar | Luas Kamar | Tempat Tidur | Kapasitas | Tarif / Malam (IDR) | Tarif (USD) |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: |
| **1** | **Superior Room** | `20–24 sqm` | Twin Bed | 1–2 Tamu | `Rp 785.000` | `$50` |
| **2** | **Deluxe Room** | `25–30 sqm` | Twin Bed | 1–2 Tamu | `Rp 1.020.000` | `$65` |
| **3** | **Executive Room** | `30–36 sqm` | King Bed | 1–2 Tamu | `Rp 1.255.000` | `$80` |
| **4** | **Junior Suite Room** | `36–45 sqm` | King Bed | 1–2 Tamu | `Rp 1.490.000` | `$95` |
| **5** | **Suite Room** | `50–80 sqm` | King Bed | 1–2 Tamu / Konfigurasi | `Rp 1.725.000` | `$110` |
| **6** | **Presidential Suite** | `100–200 sqm+` | Premium King Bed | 2–4 Tamu / Konfigurasi | `Rp 3.925.000` | `$250` |

> *Catatan: Sistem menghitung otomatis Pajak & Layanan Hotel sebesar **12%** pada rincian pembayaran dan E-Voucher.*

---

## 🏊 10 Fasilitas Utama Hotel (Hotel Facilities)

1. **Swimming Pool** *(1st Floor)* — Area kolam renang dewasa & anak dengan kursi santai tepi kolam.
2. **Fitness Center / Gym** *(5th Floor)* — Pusat kebugaran dengan *treadmill*, sepeda statis, *dumbbell*, dan *weight machines*.
3. **Andrawina Restaurant** *(1st Floor)* — Restoran utama untuk *breakfast*, *lunch*, dan *dinner* hidangan lokal & internasional.
4. **Meeting Room** *(2nd Floor)* — Ruang rapat bisnis, seminar, dan pelatihan lengkap dengan proyektor/LED & *sound system*.
5. **Ballroom** *(2nd Floor)* — *Pakubuwono Grand Ballroom* berkapasitas besar untuk pernikahan, *gala dinner*, dan konferensi.
6. **Spa & Wellness Center** *(7th Floor)* — Layanan pijat relaksasi, perawatan tubuh, dan aromaterapi.
7. **Lobby & Lounge** *(1st Floor)* — Area resepsionis utama 24 jam, *check-in/check-out*, dan ruang tunggu eksklusif.
8. **Café / Coffee Shop** *(2nd Floor)* — Kafe kasual penyedia kopi pilihan, teh, *pastry*, dan makanan ringan.
9. **Kids Club / Children's Playground** *(2nd Floor)* — Area bermain indoor aman dan edukatif khusus anak-anak.
10. **Parking Area** *(Basement)* — Area parkir *Basement & Outdoor* dengan keamanan 24 jam.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

| Kategori | Teknologi / Tools |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3 (*Obsidian & Champagne Gold Glassmorphism*), Vanilla JavaScript (ES6+), FontAwesome 6 |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (`pg` / Node-Postgres Pool & Transactions) |
| **Security** | JSON Web Token (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors` |
| **Containerization** | Docker & Docker Compose (`Dockerfile`, `docker-compose.yml`) |

---

## 🚀 Cara Instalasi & Menjalankan (Getting Started)

### Opsi A: Menjalankan Secara Lokal (Node.js & PostgreSQL)

#### 1. Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/)

#### 2. Konfigurasi Environment (`.env`)
Buat database baru di PostgreSQL (misalnya `hotel_booking_db`), lalu buat file `.env` di direktori utama proyek:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password_postgres_anda
DB_NAME=hotel_booking_db
JWT_SECRET=super_secret_jwt_key_pakubuwono_edhotel
JWT_EXPIRES_IN=24h
```

#### 3. Instalasi Dependencies
```bash
npm install
```

#### 4. Inisialisasi Skema & Seed Data Awal
Jalankan skrip berikut untuk membuat seluruh tabel beserta data awal (6 tipe kamar, 17 kamar fisik, 10 fasilitas hotel, menu Andrawina Restaurant, venue MICE, dan akun demo):
```bash
npm run db:init
npm run db:seed
```

#### 5. Menjalankan Server
```bash
npm start
# atau mode development dengan nodemon:
npm run dev
```
Buka **`http://localhost:5000`** di browser Anda.

---

### Opsi B: Menjalankan dengan Docker Compose
```bash
docker-compose up -d --build
```

---

## 🔐 Akun Demo (Demo Credentials)

| Peran (Role) | Email | Password | Akses Halaman |
| :--- | :--- | :--- | :--- |
| **Administrator / FO** | `admin@pakubuwonoedhotel.com` | `admin123` | Portal Admin (`/admin.html`) & Web Tamu |
| **Staff Resepsionis** | `staff@pakubuwonoedhotel.com` | `admin123` | Portal Admin (`/admin.html`) & Web Tamu |
| **Tamu (Guest)** | `budi@gmail.com` | `tamu123` | Web Tamu (`/index.html`) |

---

## 📂 Struktur Folder (Project Structure)

```text
Web Booking Hotel/
├── backend/
│   ├── config/             # Koneksi database (db.js), schema.sql, initDb.js, seed.js, checkDb.js
│   ├── controllers/        # Logika bisnis (auth, room, booking, service, review, admin)
│   ├── middleware/         # Proteksi rute JWT (authMiddleware.js)
│   ├── routes/             # Definisi endpoint RESTful API (/api/v1/...)
│   ├── utils/              # Generator kode booking & kalkulator harga + pajak 12%
│   └── server.js           # Entry point Express.js server
├── frontend/
│   ├── assets/
│   │   ├── css/            # style.css (Guest UI & Print A4) & admin.css (Admin UI & Print A4)
│   │   ├── images/         # Logo resmi Pakubuwono Edhotel, 6 foto kamar, & foto fasilitas
│   │   └── js/             # app.js (Guest logic & Reservation Form) & admin.js (Admin controller)
│   ├── index.html          # Halaman Utama (Katalog Kamar, Tarif, 10 Fasilitas, Ulasan, Booking)
│   ├── facilities.html     # Halaman Khusus 10 Fasilitas Hotel per Lantai
│   ├── restaurant.html     # Halaman Andrawina Restaurant (Menu & Reservasi Meja)
│   ├── mice.html           # Halaman Ballroom & Meeting Room (Lantai 2)
│   └── admin.html          # Portal Manajemen Admin & Cetak Official Reservation Form
├── Dockerfile              # Konfigurasi container aplikasi Node.js
├── docker-compose.yml      # Orkestrasi layanan App + PostgreSQL
├── package.json            # Konfigurasi proyek & daftar npm scripts
└── README.md               # Dokumentasi utama proyek
```

---

## 💻 Author
**Dikembangkan oleh Dias Adi Setiawan**
- [GitHub (@Astrokyoku)](https://github.com/Astrokyoku)
- [LinkedIn](https://www.linkedin.com/in/dias-adi-setiawan-860762385/)

*Proyek ini dikembangkan untuk sistem reservasi dan simulasi operasional Front Office **Pakubuwono Edhotel — SMKN 30 Jakarta**.*
