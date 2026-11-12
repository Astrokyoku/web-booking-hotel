// ============================================================
// 🏨 LUXURY HOTEL & RESORT - MASTER APPLICATION JAVASCRIPT
// Frontend Controller, API Client, Live Search & Booking Engine
// ============================================================

// Deteksi otomatis URL Backend API
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Hanya jika testing di lokal lewat Live Server (port 5500 dsb) atau file protocol
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.location.protocol === 'file:' || (isLocalhost && window.location.port && window.location.port !== '5000')) {
      return 'http://localhost:5000/api/v1';
    }
  }
  // Di VPS/Server Production (Domain/IP/Reverse Proxy), gunakan relative path
  return '/api/v1';
};

const API_BASE = getApiBase();
const TAX_RATE = 0.12; // Pajak Hotel 12%

console.log('🏨 LUXURY Hotel App running. Connected API:', API_BASE);

// --- 1. GLOBAL APPLICATION STATE ---
const state = {
  token: localStorage.getItem('luxury_token') || null,
  user: JSON.parse(localStorage.getItem('luxury_user') || 'null'),
  rooms: [],
  selectedRoom: null,
  activeBooking: null,
  searchParams: {
    check_in: '',
    check_out: '',
    guests: 2,
    max_price: '',
  },
};

// --- 2. INITIALIZATION ON DOM READY ---
document.addEventListener('DOMContentLoaded', () => {
  initDateInputs();
  initNavbarScroll();
  ensureMobileNavExists();
  updateAuthUI();
  fetchRooms();
  fetchHotelReviews();
  initResizeListener();
});

function initResizeListener() {
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      closeMobileNav();
      removeUserDropdown();
    }
  });
}

/**
 * Inisialisasi tanggal default di search bar (Check-in: Hari Ini, Check-out: Besok)
 */
function initDateInputs() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const inInput = document.getElementById('searchCheckIn');
  const outInput = document.getElementById('searchCheckOut');

  if (inInput && outInput) {
    inInput.min = formatDate(today);
    inInput.value = formatDate(today);
    outInput.min = formatDate(tomorrow);
    outInput.value = formatDate(tomorrow);

    state.searchParams.check_in = inInput.value;
    state.searchParams.check_out = outInput.value;
  }
}

/**
 * Efek Glassmorphism transparan ke solid pada Navbar saat di-scroll
 */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ============================================================
// 3. AUTHENTICATION & USER MANAGEMENT
// ============================================================

/**
 * Memperbarui Tampilan Navbar dan Drawer Mobile berdasarkan status login user
 */
function updateAuthUI() {
  ensureMobileNavExists();
  const navAuthArea = document.getElementById('navAuthArea');
  const drawerUserSection = document.getElementById('drawerUserSection');

  const initials = (state.token && state.user && state.user.full_name)
    ? state.user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'G';
  const firstName = (state.token && state.user && state.user.full_name)
    ? state.user.full_name.split(' ')[0]
    : 'Tamu';
  const fullName = (state.token && state.user && state.user.full_name) || 'Tamu';
  const email = (state.token && state.user && state.user.email) || '';
  const isAdmin = Boolean(state.token && state.user && state.user.role === 'admin');

  // 1. Render Topbar Nav Auth Area
  if (navAuthArea) {
    if (state.token && state.user) {
      const adminBtn = isAdmin
        ? `<a href="admin.html" class="btn btn-gold btn-sm nav-admin-btn" title="Buka Dashboard Admin"><i class="fa-solid fa-crown"></i> <span class="nav-btn-text">Admin</span></a>`
        : '';

      navAuthArea.innerHTML = `
        <div class="nav-auth-cluster">
          ${adminBtn}
          <button class="btn btn-glass btn-sm nav-bookings-btn" onclick="openMyBookingsModal()" title="Reservasi Saya">
            <i class="fa-solid fa-receipt text-gold"></i> <span class="nav-btn-text">Reservasi Saya</span>
          </button>
          <div class="user-badge" onclick="toggleUserMenu()" id="userBadgeBtn" title="Menu Akun: ${fullName}">
            <div class="user-avatar">${initials}</div>
            <span class="user-badge-name">${firstName}</span>
            <i class="fa-solid fa-chevron-down user-badge-caret"></i>
          </div>
          <button class="btn btn-outline-danger btn-sm nav-logout-btn" onclick="handleLogout()" title="Keluar dari Akun" aria-label="Keluar">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span class="nav-logout-text">Keluar</span>
          </button>
        </div>
      `;
    } else {
      navAuthArea.innerHTML = `
        <button class="btn btn-outline-gold btn-sm nav-login-btn" onclick="openAuthModal('login')">
          <i class="fa-solid fa-user-lock"></i> <span class="nav-btn-text">Masuk / Daftar</span>
        </button>
      `;
    }
  }

  // 2. Render Mobile Drawer User Section
  if (drawerUserSection) {
    if (state.token && state.user) {
      drawerUserSection.innerHTML = `
        <div class="drawer-profile-card">
          <div class="drawer-avatar">${initials}</div>
          <div class="drawer-user-info">
            <div class="drawer-user-name">${fullName}</div>
            <div class="drawer-user-email">${email}</div>
            <span class="drawer-role-badge ${isAdmin ? 'admin' : ''}">
              ${isAdmin ? '<i class="fa-solid fa-crown"></i> Administrator' : '<i class="fa-solid fa-gem"></i> Tamu Terhormat'}
            </span>
          </div>
        </div>
        <div class="drawer-user-actions">
          ${isAdmin ? `<a href="admin.html" class="btn btn-gold btn-block" onclick="closeMobileNav()"><i class="fa-solid fa-crown"></i> Portal Admin Hotel</a>` : ''}
          <button class="btn btn-glass btn-block" onclick="closeMobileNav(); openMyBookingsModal();">
            <i class="fa-solid fa-receipt text-gold"></i> Riwayat Reservasi Saya
          </button>
          <button class="btn btn-danger btn-block drawer-logout-action-btn" onclick="closeMobileNav(); handleLogout();" id="drawerLogoutBtn">
            <i class="fa-solid fa-right-from-bracket"></i> Keluar dari Akun
          </button>
        </div>
      `;
    } else {
      drawerUserSection.innerHTML = `
        <div class="drawer-guest-card">
          <p class="drawer-guest-text">Masuk ke akun Anda untuk melihat reservasi, diskon member eksklusif, dan penawaran spesial.</p>
          <button class="btn btn-gold btn-block" onclick="closeMobileNav(); openAuthModal('login');">
            <i class="fa-solid fa-user-lock"></i> Masuk / Daftar Akun
          </button>
        </div>
      `;
    }
  }
}

/**
 * Toggle menu dropdown user
 */
function toggleUserMenu() {
  const existingDropdown = document.getElementById('userNavDropdown');
  if (existingDropdown) {
    existingDropdown.remove();
    return;
  }

  const badgeBtn = document.getElementById('userBadgeBtn');
  if (!badgeBtn || !state.user) return;

  const isAdmin = state.user.role === 'admin';
  const dropdown = document.createElement('div');
  dropdown.id = 'userNavDropdown';
  dropdown.className = 'user-nav-dropdown';
  dropdown.innerHTML = `
    <div class="user-dropdown-header">
      <div class="user-dropdown-name">${state.user.full_name}</div>
      <div class="user-dropdown-email">${state.user.email}</div>
      <span class="user-dropdown-badge">${isAdmin ? 'ADMINISTRATOR' : 'GUEST MEMBER'}</span>
    </div>
    <div class="user-dropdown-body">
      ${isAdmin ? `<a href="admin.html" class="user-dropdown-item"><i class="fa-solid fa-crown text-gold"></i> Dashboard Admin</a>` : ''}
      <button class="user-dropdown-item" onclick="removeUserDropdown(); openMyBookingsModal();">
        <i class="fa-solid fa-receipt text-gold"></i> Reservasi Saya
      </button>
      <button class="user-dropdown-item logout-item" onclick="removeUserDropdown(); handleLogout();">
        <i class="fa-solid fa-right-from-bracket"></i> Keluar (Logout)
      </button>
    </div>
  `;

  badgeBtn.parentElement.style.position = 'relative';
  badgeBtn.parentElement.appendChild(dropdown);

  const handleOutsideClick = (e) => {
    if (!dropdown.contains(e.target) && !badgeBtn.contains(e.target)) {
      dropdown.remove();
      document.removeEventListener('click', handleOutsideClick);
    }
  };
  setTimeout(() => document.addEventListener('click', handleOutsideClick), 10);
}

function removeUserDropdown() {
  const dd = document.getElementById('userNavDropdown');
  if (dd) dd.remove();
}

/**
 * Memastikan Drawer Navigasi Mobile ada di DOM
 */
function ensureMobileNavExists() {
  if (document.getElementById('mobileNavDrawer')) return;

  const drawerHtml = `
    <div class="mobile-nav-backdrop" id="mobileNavBackdrop" onclick="closeMobileNav()"></div>
    <aside class="mobile-nav-drawer" id="mobileNavDrawer" aria-label="Menu Navigasi Mobile">
      <div class="drawer-header">
        <a href="index.html" class="brand-logo" onclick="closeMobileNav()">
          <img src="assets/images/logo-emblem.png" alt="Logo Pakubuwono Edhotel" class="brand-logo-img">
          <div class="brand-logo-text">
            <span class="brand-title">PAKUBUWONO</span>
            <span class="brand-subtitle">EDHOTEL • SMKN 30 JAKARTA</span>
          </div>
        </a>
        <button class="drawer-close-btn" onclick="closeMobileNav()" aria-label="Tutup Menu">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="drawer-user-section" id="drawerUserSection">
        <!-- Populated by updateAuthUI() -->
      </div>

      <ul class="drawer-menu">
        <li><a href="index.html#rooms" class="drawer-link" onclick="closeMobileNav()"><i class="fa-solid fa-bed text-gold"></i> <span>Kamar & Suite</span></a></li>
        <li><a href="restaurant.html" class="drawer-link" onclick="closeMobileNav()"><i class="fa-solid fa-utensils text-gold"></i> <span>Andrawina Restaurant</span></a></li>
        <li><a href="facilities.html" class="drawer-link" onclick="closeMobileNav()"><i class="fa-solid fa-spa text-gold"></i> <span>Fasilitas Hotel</span></a></li>
        <li><a href="mice.html" class="drawer-link" onclick="closeMobileNav()"><i class="fa-solid fa-handshake text-gold"></i> <span>MICE & Ballroom</span></a></li>
      </ul>

      <div class="drawer-footer">
        <div class="drawer-contact-item">
          <i class="fa-solid fa-phone text-gold"></i>
          <span>+62 21 722-3030 (Resepsionis 24/7)</span>
        </div>
        <div class="drawer-contact-item">
          <i class="fa-solid fa-location-dot text-gold"></i>
          <span>Jl. Pakubuwono VI, Senayan - Kebayoran Baru, Jakarta</span>
        </div>
      </div>
    </aside>
  `;

  document.body.insertAdjacentHTML('beforeend', drawerHtml);
}

function toggleMobileNav() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (!drawer) {
    ensureMobileNavExists();
  }
  const isCurrentlyOpen = document.getElementById('mobileNavDrawer')?.classList.contains('open');
  if (isCurrentlyOpen) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
}

function openMobileNav() {
  ensureMobileNavExists();
  const drawer = document.getElementById('mobileNavDrawer');
  const backdrop = document.getElementById('mobileNavBackdrop');
  const hamburger = document.getElementById('mobileNavToggle');

  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
  if (hamburger) hamburger.classList.add('active');
  document.body.style.overflow = 'hidden';
  updateAuthUI();
}

function closeMobileNav() {
  const drawer = document.getElementById('mobileNavDrawer');
  const backdrop = document.getElementById('mobileNavBackdrop');
  const hamburger = document.getElementById('mobileNavToggle');

  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  if (hamburger) hamburger.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Memastikan elemen Auth Modal (Login / Register) ada di DOM sebelum dibuka
 */
function ensureAuthModalExists() {
  if (document.getElementById('authModal')) return;

  const modalHtml = `
  <div class="modal-overlay" id="authModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title font-serif" id="authModalTitle">Masuk ke Akun Anda</h3>
        <button class="modal-close" onclick="closeModal('authModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="auth-tabs">
          <button class="auth-tab-btn active" id="tabLoginBtn" onclick="switchAuthTab('login')">Masuk</button>
          <button class="auth-tab-btn" id="tabRegisterBtn" onclick="switchAuthTab('register')">Daftar Baru</button>
        </div>

        <!-- Form Login -->
        <form id="loginForm" onsubmit="handleLoginSubmit(event)">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label"><i class="fa-solid fa-envelope"></i> Alamat Email</label>
            <input type="email" id="loginEmail" class="form-control" placeholder="contoh: budi@gmail.com" required>
          </div>
          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label"><i class="fa-solid fa-key"></i> Kata Sandi</label>
            <input type="password" id="loginPassword" class="form-control" placeholder="Masukkan kata sandi" required>
          </div>
          <button type="submit" class="btn btn-gold btn-block" id="loginSubmitBtn">
            <i class="fa-solid fa-right-to-bracket"></i> Masuk Sekarang
          </button>
        </form>

        <!-- Form Register -->
        <form id="registerForm" style="display: none;" onsubmit="handleRegisterSubmit(event)">
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label"><i class="fa-solid fa-user"></i> Nama Lengkap</label>
            <input type="text" id="regFullName" class="form-control" placeholder="Nama lengkap Anda" required>
          </div>
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label"><i class="fa-solid fa-envelope"></i> Alamat Email</label>
            <input type="email" id="regEmail" class="form-control" placeholder="contoh: budi@gmail.com" required>
          </div>
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label"><i class="fa-solid fa-phone"></i> Nomor Telepon / WhatsApp</label>
            <input type="tel" id="regPhone" class="form-control" placeholder="contoh: 08123456789">
          </div>
          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label"><i class="fa-solid fa-key"></i> Kata Sandi (Min. 6 Karakter)</label>
            <input type="password" id="regPassword" class="form-control" placeholder="Buat kata sandi aman" minlength="6" required>
          </div>
          <button type="submit" class="btn btn-gold btn-block" id="registerSubmitBtn">
            <i class="fa-solid fa-user-plus"></i> Buat Akun Baru
          </button>
        </form>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const newOverlay = document.getElementById('authModal');
  if (newOverlay) {
    newOverlay.addEventListener('click', (e) => {
      if (e.target === newOverlay) newOverlay.classList.remove('active');
    });
  }
}

function openAuthModal(tab = 'login') {
  ensureAuthModalExists();
  switchAuthTab(tab);
  openModal('authModal');
}

function switchAuthTab(tab) {
  ensureAuthModalExists();
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');
  const modalTitle = document.getElementById('authModalTitle');

  if (!tabLoginBtn || !tabRegBtn || !loginForm || !regForm) return;

  if (tab === 'login') {
    tabLoginBtn.classList.add('active');
    tabRegBtn.classList.remove('active');
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
    if (modalTitle) modalTitle.innerText = 'Masuk ke Akun Anda';
  } else {
    tabRegBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    regForm.style.display = 'block';
    loginForm.style.display = 'none';
    if (modalTitle) modalTitle.innerText = 'Daftar Akun Tamu Baru';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.getElementById('loginSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login gagal.');

    state.token = data.data.token;
    state.user = data.data.user;

    localStorage.setItem('luxury_token', state.token);
    localStorage.setItem('luxury_user', JSON.stringify(state.user));

    showToast(`Selamat datang kembali, ${state.user.full_name}! 👋`, 'success');
    closeModal('authModal');
    updateAuthUI();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Masuk Sekarang`;
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const full_name = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const submitBtn = document.getElementById('registerSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mendaftarkan...`;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, phone, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registrasi gagal.');

    state.token = data.data.token;
    state.user = data.data.user;

    localStorage.setItem('luxury_token', state.token);
    localStorage.setItem('luxury_user', JSON.stringify(state.user));

    showToast('Akun berhasil dibuat! Anda telah masuk secara otomatis.', 'success');
    closeModal('authModal');
    updateAuthUI();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> Buat Akun Baru`;
  }
}

function handleLogout() {
  removeUserDropdown();
  closeMobileNav();
  state.token = null;
  state.user = null;
  localStorage.removeItem('luxury_token');
  localStorage.removeItem('luxury_user');
  showToast('Anda telah berhasil keluar dari akun.', 'success');
  updateAuthUI();
}

// ============================================================
// 4. ROOMS CATALOG & LIVE AVAILABILITY SEARCH
// ============================================================

// Spesifikasi Resmi 6 Tipe Kamar PAKUBUWONO EDHOTEL (Sesuai PDF)
const ROOM_SPECS_MAP = {
  'Superior Room': {
    price_usd: 50,
    room_size: '20–24 sqm',
    occupancy_label: '1–2 Tamu',
    bed_type: 'Twin Bed',
    tv_short: '32–40" LED/Smart TV',
    tv_details: '32–40-inch LED atau Smart TV.',
    bathroom_details: 'Kamar mandi pribadi dilengkapi dengan shower, toilet, wastafel (washbasin), dan cermin.',
    in_room_facilities: 'AC, lemari pakaian (wardrobe), meja kerja kecil, kursi, telepon, Wi-Fi, safety deposit box, kulkas mini (mini refrigerator), ketel listrik, fasilitas pembuat kopi & teh, air mineral botol gratis, sandal kamar, dan perlengkapan mandi dasar.',
    interior_design: 'Desain interior simpel, modern, dan fungsional yang memberikan kenyamanan esensial serta fasilitas praktis untuk masa menginap yang menyenangkan.',
    default_image: 'assets/images/room-superior.jpg',
  },
  'Deluxe Room': {
    price_usd: 65,
    room_size: '25–30 sqm',
    occupancy_label: '1–2 Tamu',
    bed_type: 'Twin Bed',
    tv_short: '40–43" LED/Smart TV',
    tv_details: '40–43-inch LED atau Smart TV.',
    bathroom_details: 'Kamar mandi pribadi dilengkapi dengan shower, toilet, wastafel, cermin besar, serta bathtub pada unit pilihan.',
    in_room_facilities: 'AC, lemari pakaian, meja kerja, kursi santai (lounge chair), telepon, Wi-Fi, safety deposit box, kulkas mini, ketel listrik, fasilitas pembuat kopi & teh, air mineral botol gratis, pengering rambut (hair dryer), sandal kamar, jubah mandi opsional (bathrobe), dan perlengkapan mandi lengkap.',
    interior_design: 'Lebih luas dan elegan dibandingkan Superior Room, menampilkan furnitur yang ditingkatkan, sentuhan akhir interior yang berkelas, dan kenyamanan tambahan.',
    default_image: 'assets/images/room-deluxe.jpg',
  },
  'Executive Room': {
    price_usd: 80,
    room_size: '30–36 sqm',
    occupancy_label: '1–2 Tamu',
    bed_type: 'King Bed',
    tv_short: '43–50" Smart TV',
    tv_details: '43–50-inch Smart TV.',
    bathroom_details: 'Kamar mandi pribadi menampilkan shower terpisah atau kombinasi bathtub dengan shower, toilet, wastafel, dan cermin besar.',
    in_room_facilities: 'AC, lemari pakaian, meja kerja eksekutif, kursi ergonomis, sofa kecil, telepon, Wi-Fi kecepatan tinggi (high-speed Wi-Fi), safety deposit box, kulkas mini, fasilitas pembuat kopi & teh, air mineral botol gratis, hair dryer, bathrobe, sandal kamar, dan perlengkapan mandi premium.',
    interior_design: 'Desain interior eksklusif dan berkelas yang menawarkan kenyamanan serta privasi lebih tinggi bagi pelaku perjalanan bisnis maupun wisata. Unit pilihan juga menyediakan akses Executive Lounge.',
    default_image: 'assets/images/room-executive.jpg',
  },
  'Junior Suite Room': {
    price_usd: 95,
    room_size: '36–45 sqm',
    occupancy_label: '1–2 Tamu',
    bed_type: 'King Bed',
    tv_short: '50–55" Smart TV',
    tv_details: '50–55-inch Smart TV.',
    bathroom_details: 'Kamar mandi pribadi dilengkapi dengan shower dan bathtub, toilet, wastafel, serta area rias (vanity area).',
    in_room_facilities: 'AC, lemari pakaian besar, meja kerja, sofa dan meja kopi (coffee table), telepon, Wi-Fi, safety deposit box, kulkas mini, mesin kopi (coffee machine) atau pembuat kopi & teh, air mineral botol gratis, hair dryer, bathrobe, sandal kamar, dan perlengkapan mandi premium.',
    interior_design: 'Tata letak open-plan yang luas memadukan area tidur dan area duduk (living area) dalam satu ruangan, menampilkan perabotan elegan dan sentuhan akhir interior yang ditingkatkan.',
    default_image: 'assets/images/room-junior-suite.jpg',
  },
  'Suite Room': {
    price_usd: 110,
    room_size: '50–80 sqm',
    occupancy_label: '1–2 Tamu / Konfigurasi',
    bed_type: 'King Bed',
    tv_short: '55–65" Dual Smart TV',
    tv_details: '55–65-inch Smart TV, umumnya dengan televisi terpisah di kamar tidur dan ruang tamu.',
    bathroom_details: 'Kamar mandi pribadi yang luas menampilkan bathtub, area shower terpisah, toilet, wastafel ganda (double washbasin), cermin besar, dan vanity area.',
    in_room_facilities: 'AC, ruang tamu terpisah (separate living room), sofa, meja kopi, meja makan opsional, meja kerja, lemari pakaian besar, telepon, Wi-Fi premium, safety deposit box, kulkas mini, mesin kopi, air mineral botol gratis, hair dryer, bathrobe, sandal kamar, dan perlengkapan mandi premium.',
    interior_design: 'Tata letak kamar tidur dan ruang tamu terpisah yang memberikan privasi lebih tinggi, keleluasaan ruang, serta tingkat kenyamanan maksimal dengan perabotan premium dan fasilitas eksklusif.',
    default_image: 'assets/images/room-suite.jpg',
  },
  'Presidential Suite': {
    price_usd: 250,
    room_size: '100–200 sqm+',
    occupancy_label: '2–4 Tamu / Konfigurasi',
    bed_type: 'Premium King Bed',
    tv_short: '65–85" Smart TV+',
    tv_details: '65–85-inch Smart TV atau lebih besar, tersedia di kamar tidur utama (master bedroom) dan ruang tamu.',
    bathroom_details: 'Kamar mandi ultra-mewah menampilkan freestanding bathtub, ruang shower terpisah, toilet terpisah, double washbasin, vanity area, serta opsi jacuzzi eksklusif.',
    in_room_facilities: 'Ruang tamu eksklusif, ruang makan (dining area), master bedroom, walk-in closet, area kerja privat, pantry atau kitchenette, mini bar, mesin kopi premium, beberapa unit televisi, sistem kontrol kamar pintar (smart room control), Wi-Fi premium, safety deposit box besar, hair dryer, bathrobe premium, perlengkapan mandi bermerek (branded amenities), dan layanan Personal Butler.',
    interior_design: 'Tingkat kemewahan dan eksklusivitas tertinggi yang menampilkan ruang hunian sangat luas, area fungsional khusus, perabotan mahakarya, desain interior berkelas, dan layanan keramahtamahan personal.',
    default_image: 'assets/images/room-presidential-suite.jpg',
  },
};

function getRoomSpecs(room) {
  const mapped = ROOM_SPECS_MAP[room.name] || {};
  const usdFromPrice = Math.round(Number(room.base_price || 785000) / 15700);
  return {
    price_usd: room.price_usd ? Number(room.price_usd) : (mapped.price_usd || usdFromPrice),
    room_size: room.room_size || mapped.room_size || '24 sqm',
    occupancy_label: mapped.occupancy_label || `1–${room.capacity || 2} Tamu`,
    bed_type: room.bed_type || mapped.bed_type || 'King / Twin Bed',
    tv_short: mapped.tv_short || room.tv_details || 'Smart TV',
    tv_details: room.tv_details || mapped.tv_details || 'Smart LED TV dengan saluran internasional.',
    bathroom_details: room.bathroom_details || mapped.bathroom_details || 'Kamar mandi pribadi lengkap dengan shower dan perlengkapan mandi.',
    in_room_facilities: mapped.in_room_facilities || (Array.isArray(room.amenities) ? room.amenities.join(', ') : '-'),
    interior_design: room.interior_design || mapped.interior_design || room.description || '-',
    image_url: room.image_url || mapped.default_image || 'assets/images/room-superior.jpg',
  };
}

/**
 * Mengambil katalog seluruh tipe kamar dari backend
 */
async function fetchRooms() {
  const container = document.getElementById('roomsContainer');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/rooms`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    state.rooms = data.data.room_types;
    renderRoomCards(state.rooms);
  } catch (err) {
    console.error('Fetch rooms error:', err);
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 40px;">
          <i class="fa-solid fa-triangle-exclamation text-gold" style="font-size: 2rem;"></i>
          <p style="margin-top: 12px; color: var(--text-secondary);">Gagal memuat katalog kamar: ${err.message}</p>
          <button class="btn btn-outline-gold btn-sm" onclick="fetchRooms()" style="margin-top: 16px;">Coba Lagi</button>
        </div>
      `;
    }
  }
}

/**
 * Merender daftar kartu kamar ke dalam DOM
 */
function renderRoomCards(rooms, isSearch = false, searchQuery = null) {
  const container = document.getElementById('roomsContainer');
  const subtitle = document.getElementById('roomsSubtitle');

  if (!container) return;

  if (!rooms || rooms.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; grid-column: 1/-1; padding: 60px 0;">
        <i class="fa-solid fa-bed" style="font-size: 3rem; color: var(--gold-primary); margin-bottom: 16px;"></i>
        <h3 class="font-serif" style="font-size: 1.6rem; margin-bottom: 8px;">Kamar Tidak Tersedia</h3>
        <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 20px;">
          Seluruh kamar pada tanggal atau kriteria pencarian ini sedang penuh. Silakan coba tanggal atau kapasitas lain.
        </p>
        <button class="btn btn-gold btn-sm" onclick="fetchRooms()">Tampilkan Semua Kamar</button>
      </div>
    `;
    return;
  }

  if (subtitle) {
    if (isSearch && searchQuery) {
      subtitle.innerHTML = `Menampilkan <strong>${rooms.length} tipe kamar</strong> yang tersedia untuk periode <strong>${searchQuery.check_in} s/d ${searchQuery.check_out}</strong> (${searchQuery.total_nights} malam). Rincian termasuk <strong>Pajak Hotel 12%</strong>.`;
    } else {
      subtitle.innerText = '6 pilihan akomodasi elegan Pakubuwono Edhotel mulai dari Superior Room hingga Presidential Suite dengan standar kenyamanan terbaik di Senayan.';
    }
  }

  container.innerHTML = rooms.map(room => {
    const amenities = Array.isArray(room.amenities) ? room.amenities : [];
    const rating = room.average_rating || 5.0;
    const availableCount = room.available_count !== undefined ? room.available_count : room.available_rooms;
    const spec = getRoomSpecs(room);

    let priceDisplayHtml = '';
    if (room.pricing_breakdown) {
      priceDisplayHtml = `
        <div class="room-price">
          <div>
            <span class="price-amount">Rp ${Number(room.pricing_breakdown.total_price).toLocaleString('id-ID')}</span>
          </div>
          <span class="price-unit">Total ${room.pricing_breakdown.total_nights} malam (Inc. PPN 12%) • Tarif dasar $${spec.price_usd}/malam</span>
        </div>
      `;
    } else {
      priceDisplayHtml = `
        <div class="room-price">
          <div>
            <span class="price-amount">Rp ${Number(room.base_price).toLocaleString('id-ID')}</span>
            <span class="price-usd-tag">$${spec.price_usd}</span>
          </div>
          <span class="price-unit">/ malam (belum termasuk PPN 12%)</span>
        </div>
      `;
    }

    return `
      <div class="room-card">
        <div class="room-media">
          <img src="${spec.image_url}" alt="${room.name}" class="room-image" loading="lazy" onerror="this.src='assets/images/room-superior.jpg'">
          <span class="room-badge"><i class="fa-solid fa-users"></i> ${spec.occupancy_label}</span>
          <span class="room-rating"><i class="fa-solid fa-star"></i> ${rating}</span>
        </div>

        <div class="room-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <h3 class="room-title" style="margin-bottom: 0;">${room.name}</h3>
            <span style="font-size: 0.75rem; color: ${availableCount > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight: 600; background: rgba(0,0,0,0.4); padding: 2px 8px; border-radius: 4px; flex-shrink: 0;">
              ${availableCount > 0 ? `${availableCount} Unit Tersedia` : 'Penuh'}
            </span>
          </div>

          <div class="room-specs-row">
            <span class="room-spec-pill" title="Ukuran Kamar"><i class="fa-solid fa-ruler-combined"></i> ${spec.room_size}</span>
            <span class="room-spec-pill" title="Tipe Tempat Tidur"><i class="fa-solid fa-bed"></i> ${spec.bed_type}</span>
            <span class="room-spec-pill" title="Televisi"><i class="fa-solid fa-tv"></i> ${spec.tv_short}</span>
          </div>

          <p class="room-desc">${room.description || spec.interior_design}</p>

          <div class="room-amenities">
            ${amenities.slice(0, 5).map(a => `<span class="amenity-chip"><i class="fa-solid fa-check text-gold"></i> ${a}</span>`).join('')}
            ${amenities.length > 5 ? `<span class="amenity-chip" style="color: var(--gold-light); cursor: pointer;" onclick="openRoomDetailModal('${room.id}')">+${amenities.length - 5} lainnya</span>` : ''}
          </div>

          <div class="room-footer">
            ${priceDisplayHtml}
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-outline-gold btn-sm" onclick="openRoomDetailModal('${room.id}')" title="Lihat Spesifikasi Lengkap">
                <i class="fa-solid fa-circle-info"></i> Detail
              </button>
              <button class="btn btn-gold btn-sm" onclick="openBookingModal('${room.id}')" ${availableCount === 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-calendar-check"></i> Pesan
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Membuka Modal Detail Spesifikasi Lengkap Kamar (Sesuai Dokumen PDF)
 */
function openRoomDetailModal(roomTypeId) {
  const room = state.rooms.find(r => r.id === roomTypeId);
  if (!room) return;

  const spec = getRoomSpecs(room);
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const availableCount = room.available_count !== undefined ? room.available_count : room.available_rooms;

  let modal = document.getElementById('roomDetailModal');
  if (!modal) {
    const modalHtml = `
      <div class="modal-overlay" id="roomDetailModal">
        <div class="modal-content" style="max-width: 720px;">
          <div class="modal-header">
            <h3 class="modal-title font-serif" id="roomDetailModalTitle">Detail Spesifikasi Kamar</h3>
            <button class="modal-close" onclick="closeModal('roomDetailModal')">&times;</button>
          </div>
          <div class="modal-body" id="roomDetailModalBody"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modal = document.getElementById('roomDetailModal');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  const titleEl = document.getElementById('roomDetailModalTitle');
  const bodyEl = document.getElementById('roomDetailModalBody');
  if (titleEl) titleEl.innerText = room.name;

  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="position: relative; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px; height: 260px; border: 1px solid var(--gold-border);">
        <img src="${spec.image_url}" alt="${room.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/images/room-superior.jpg'">
        <div style="position: absolute; bottom: 0; inset-inline: 0; background: linear-gradient(transparent, rgba(7,10,18,0.92)); padding: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 10px;">
          <div>
            <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--gold-primary); font-weight: 700;">PAKUBUWONO EDHOTEL</span>
            <h3 class="font-serif" style="font-size: 1.6rem; color: #fff; margin: 2px 0 0;">${room.name}</h3>
          </div>
          <div style="text-align: right;">
            <span style="font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--gold-light);">Rp ${Number(room.base_price).toLocaleString('id-ID')}</span>
            <span class="price-usd-tag">$${spec.price_usd} / Night</span>
          </div>
        </div>
      </div>

      <div class="room-detail-spec-grid">
        <div class="room-detail-spec-box">
          <div class="room-detail-spec-label"><i class="fa-solid fa-ruler-combined text-gold"></i> Room Size</div>
          <div class="room-detail-spec-value">${spec.room_size}</div>
        </div>
        <div class="room-detail-spec-box">
          <div class="room-detail-spec-label"><i class="fa-solid fa-user-group text-gold"></i> Occupancy</div>
          <div class="room-detail-spec-value">${spec.occupancy_label}</div>
        </div>
        <div class="room-detail-spec-box">
          <div class="room-detail-spec-label"><i class="fa-solid fa-bed text-gold"></i> Bed Type</div>
          <div class="room-detail-spec-value">${spec.bed_type}</div>
        </div>
      </div>

      <div class="room-detail-section">
        <h4><i class="fa-solid fa-bath"></i> Bathroom (Kamar Mandi)</h4>
        <p>${spec.bathroom_details}</p>
      </div>

      <div class="room-detail-section">
        <h4><i class="fa-solid fa-tv"></i> Television (Televisi)</h4>
        <p>${spec.tv_details}</p>
      </div>

      <div class="room-detail-section">
        <h4><i class="fa-solid fa-Concierge-bell fa-bell-concierge"></i> In-Room Facilities (Fasilitas Dalam Kamar)</h4>
        <p style="margin-bottom: 10px;">${spec.in_room_facilities}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${amenities.map(a => `<span class="amenity-chip"><i class="fa-solid fa-check text-gold"></i> ${a}</span>`).join('')}
        </div>
      </div>

      <div class="room-detail-section">
        <h4><i class="fa-solid fa-Couch fa-couch"></i> Interior Design (Desain Interior)</h4>
        <p>${spec.interior_design}</p>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 20px;">
        <button class="btn btn-gold" style="flex: 2;" onclick="closeModal('roomDetailModal'); openBookingModal('${room.id}');" ${availableCount === 0 ? 'disabled' : ''}>
          <i class="fa-solid fa-calendar-check"></i> Pesan ${room.name} Sekarang
        </button>
        <button class="btn btn-glass" style="flex: 1;" onclick="closeModal('roomDetailModal')">
          Tutup
        </button>
      </div>
    `;
  }

  openModal('roomDetailModal');
}

/**
 * Handle form live availability search
 */
async function handleSearchRooms(e) {
  e.preventDefault();

  const check_in = document.getElementById('searchCheckIn').value;
  const check_out = document.getElementById('searchCheckOut').value;
  const guests = document.getElementById('searchGuests').value;
  const max_price = document.getElementById('searchMaxPrice').value;
  const submitBtn = document.getElementById('searchSubmitBtn');

  if (!check_in || !check_out) {
    showToast('Harap pilih tanggal check-in dan check-out.', 'error');
    return;
  }

  if (new Date(check_out) <= new Date(check_in)) {
    showToast('Tanggal check-out harus setelah tanggal check-in.', 'error');
    return;
  }

  state.searchParams = { check_in, check_out, guests, max_price };

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mencari...`;

  try {
    let url = `${API_BASE}/rooms/search/availability?check_in=${check_in}&check_out=${check_out}&guests=${guests}`;
    if (max_price) url += `&max_price=${max_price}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    renderRoomCards(data.data.available_room_types, true, data.search_query);

    // Scroll ke section rooms
    document.getElementById('rooms').scrollIntoView({ behavior: 'smooth' });
    showToast(`Ditemukan ${data.count} tipe kamar kosong dengan kalkulasi pajak 12%!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Cek Kamar`;
  }
}

// ============================================================
// 5. BOOKING ENGINE & 12% TAX CALCULATION
// ============================================================

/**
 * Membuka Modal Reservasi Kamar
 */
function openBookingModal(roomTypeId) {
  // Cek apakah user sudah login
  if (!state.token || !state.user) {
    showToast('Silakan masuk (login) terlebih dahulu untuk melanjutkan reservasi.', 'error');
    openAuthModal('login');
    return;
  }

  const room = state.rooms.find(r => r.id === roomTypeId);
  if (!room) return;

  state.selectedRoom = room;
  const spec = getRoomSpecs(room);

  const imageUrl = spec.image_url
    || (room.image_url && (room.image_url.startsWith('http') || room.image_url.startsWith('/') || room.image_url.startsWith('assets/'))
      ? room.image_url
      : 'assets/images/room-superior.jpg');

  // Isi summary room di modal
  const summaryBox = document.getElementById('bookingRoomSummary');
  summaryBox.innerHTML = `
    <img src="${imageUrl}" alt="${room.name}" style="width: 96px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid var(--gold-border);" onerror="this.src='https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'">
    <div>
      <h4 style="font-size: 1.15rem; color: var(--gold-light); font-weight: 700; margin-bottom: 4px;">${room.name}</h4>
      <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 2px;"><i class="fa-solid fa-ruler-combined text-gold"></i> ${spec.room_size} • <i class="fa-solid fa-bed text-gold"></i> ${spec.bed_type} • <i class="fa-solid fa-user-group text-gold"></i> Maks. ${room.capacity} Tamu</p>
      <p style="font-size: 0.85rem; color: var(--text-secondary);"><span style="color: var(--gold-primary); font-weight: 700;">Rp ${Number(room.base_price).toLocaleString('id-ID')}</span> <span style="color: var(--gold-light); font-size: 0.78rem;">($${spec.price_usd})</span> / malam</p>
    </div>
  `;

  document.getElementById('bookRoomTypeId').value = room.id;
  document.getElementById('bookCheckIn').value = state.searchParams.check_in || document.getElementById('searchCheckIn').value;
  document.getElementById('bookCheckOut').value = state.searchParams.check_out || document.getElementById('searchCheckOut').value;
  document.getElementById('bookGuestCount').value = state.searchParams.guests || 2;

  const bedTypeSelect = document.getElementById('bookBedType');
  if (bedTypeSelect) {
    bedTypeSelect.value = /twin/i.test(spec.bed_type || '') ? 'TW' : 'KS';
  }

  recalculateModalPrice();
  openModal('bookingModal');
}

/**
 * Menghitung rincian harga menginap + Pajak 12% secara Live di Modal
 */
function recalculateModalPrice() {
  if (!state.selectedRoom) return;

  const checkInVal = document.getElementById('bookCheckIn').value;
  const checkOutVal = document.getElementById('bookCheckOut').value;

  if (!checkInVal || !checkOutVal) return;

  const inDate = new Date(checkInVal);
  const outDate = new Date(checkOutVal);

  let nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (nights <= 0) nights = 1;

  const spec = getRoomSpecs(state.selectedRoom);
  const basePrice = Number(state.selectedRoom.base_price);
  const subtotal = basePrice * nights;
  const taxAmount = Math.round(subtotal * TAX_RATE); // 12% Pajak
  const totalPrice = subtotal + taxAmount;

  document.getElementById('calcBasePrice').innerText = `Rp ${basePrice.toLocaleString('id-ID')} ($${spec.price_usd})`;
  document.getElementById('calcNights').innerText = `${nights} Malam`;
  document.getElementById('calcSubtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
  document.getElementById('calcTax').innerText = `Rp ${taxAmount.toLocaleString('id-ID')} (12%)`;
  document.getElementById('calcTotal').innerText = `Rp ${totalPrice.toLocaleString('id-ID')}`;
}

/**
 * Helper Serialisasi & Parsing Metadata Official Reservation Form
 */
function serializeReservationMeta(remarksText, metaObj) {
  const cleanRemarks = (remarksText || '').trim();
  const metaJson = JSON.stringify(metaObj || {});
  return cleanRemarks ? `${cleanRemarks}\n[RESFORM_META:${metaJson}]` : `[RESFORM_META:${metaJson}]`;
}

function parseReservationMeta(booking) {
  const raw = String(booking?.special_requests || '');
  const match = raw.match(/\[RESFORM_META:(\{.*\})\]/s);
  let parsed = {};
  if (match && match[1]) {
    try {
      parsed = JSON.parse(match[1]);
    } catch (e) {
      parsed = {};
    }
  }
  const cleanRemarks = raw.replace(/\n?\[RESFORM_META:\{.*\}\]/s, '').trim();
  const roomName = booking?.room_type_name || '';
  const defaultBed = /superior|deluxe/i.test(roomName) ? 'TW' : 'KS';

  const payMethodMap = {
    bank_transfer: 'Bank Transfer / Virtual Account BCA & Mandiri',
    ewallet: 'QRIS / E-Wallet (GoPay, OVO, Dana)',
    credit_card: 'Credit Card / Debit Visa & Mastercard',
    cash: 'Cash / Pelunasan di Front Desk Resepsionis',
  };
  const defaultBilling = payMethodMap[booking?.payment_method] || 'Personal Account (Tamu Pribadi)';

  const isCancelled = (booking?.booking_status || booking?.status) === 'cancelled';
  const isConfirmed = ['confirmed', 'checked_in', 'completed'].includes(booking?.booking_status || booking?.status) || booking?.payment_status === 'paid';

  const createdDateStr = booking?.created_at
    ? new Date(booking.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  const confirmedDateStr = isConfirmed
    ? (booking?.paid_at
        ? new Date(booking.paid_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : createdDateStr)
    : '';

  return {
    remarks: cleanRemarks || 'Tidak ada catatan khusus',
    bed_type: parsed.bed_type || defaultBed,
    address: parsed.address || 'Jakarta, Indonesia',
    company: parsed.company || '-',
    arr_flight: parsed.arr_flight || '-',
    eta: parsed.eta ? `${parsed.eta} WIB` : '14:00 WIB',
    dep_flight: parsed.dep_flight || '-',
    etd: parsed.etd ? `${parsed.etd} WIB` : '12:00 WIB',
    billing: parsed.billing || defaultBilling,
    res_by: parsed.res_by || 'OTA',
    form_status: parsed.form_status || (isCancelled ? 'Cancellation' : 'New Booking'),
    accepted_by: parsed.accepted_by || 'FO Reservation System',
    accepted_date: parsed.accepted_date || createdDateStr,
    confirmed_by: parsed.confirmed_by || (isConfirmed ? 'Admin Pakubuwono Edhotel' : ''),
    confirmed_date: parsed.confirmed_date || confirmedDateStr,
  };
}

/**
 * Submit Pembuatan Reservasi Baru
 */
async function handleCreateBookingSubmit(e) {
  e.preventDefault();

  const room_type_id = document.getElementById('bookRoomTypeId').value;
  const check_in_date = document.getElementById('bookCheckIn').value;
  const check_out_date = document.getElementById('bookCheckOut').value;
  const guest_count = parseInt(document.getElementById('bookGuestCount').value);
  const rawRemarks = document.getElementById('bookSpecialRequests')?.value?.trim() || '';

  const resFormMeta = {
    bed_type: document.getElementById('bookBedType')?.value || 'KS',
    address: document.getElementById('bookGuestAddress')?.value?.trim() || '',
    company: document.getElementById('bookCompanyName')?.value?.trim() || '',
    arr_flight: document.getElementById('bookArrivalFlight')?.value?.trim() || '',
    eta: document.getElementById('bookArrivalEta')?.value || '14:00',
    dep_flight: document.getElementById('bookDepartureFlight')?.value?.trim() || '',
    etd: document.getElementById('bookDepartureEtd')?.value || '12:00',
    billing: document.getElementById('bookBillingInstruction')?.value || 'Personal Account (Tamu Pribadi)',
    res_by: 'OTA',
  };

  const special_requests = serializeReservationMeta(rawRemarks, resFormMeta);
  const submitBtn = document.getElementById('submitBookingBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mengalokasikan Kamar...`;

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
      },
      body: JSON.stringify({
        room_type_id,
        check_in_date,
        check_out_date,
        guest_count,
        special_requests,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    state.activeBooking = data.data;

    closeModal('bookingModal');
    showToast('Reservasi berhasil dibuat! Silakan lanjutkan pembayaran.', 'success');

    // Buka Modal Pembayaran
    openPaymentModal(state.activeBooking);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Konfirmasi & Lanjut ke Pembayaran`;
  }
}

// ============================================================
// 6. PAYMENT SIMULATOR & E-VOUCHER
// ============================================================

/**
 * Membuka Modal Pembayaran (Mendukung Kamar, Restoran, dan Ballroom/MICE)
 */
function openPaymentModal(paymentData) {
  state.activePayment = paymentData;
  state.activeBooking = paymentData;

  const detailsArea = document.getElementById('paymentDetailsArea');
  if (!detailsArea) return;

  // Deteksi tipe pembayaran
  let type = paymentData.type;
  if (!type) {
    if (paymentData.reservation || paymentData.reservation_code) {
      type = 'restaurant';
    } else if (paymentData.venue_booking_code || (paymentData.booking && paymentData.booking.venue_booking_code)) {
      type = 'venue';
    } else {
      type = 'room';
    }
  }

  if (type === 'restaurant') {
    const r = paymentData.reservation || paymentData;
    const amount = Number(r.total_price || 100000);
    const dateStr = new Date(r.reservation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const sessionLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
    const sessionStr = sessionLabels[r.session_time] || r.session_time;

    detailsArea.innerHTML = `
      <span class="section-tag">Tagihan Deposit Restoran</span>
      <h3 class="font-serif" style="font-size: 1.5rem; margin-bottom: 4px;">Kode: ${r.reservation_code}</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">Andrawina Restaurant (1st Floor) • ${r.guest_count} Orang • Sesi ${sessionStr}</p>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">Tanggal: ${dateStr}</p>
      <div style="font-size: 1.8rem; font-weight: 700; color: var(--gold-light); margin: 12px 0;">
        Rp ${amount.toLocaleString('id-ID')}
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted);">Deposit komitmen meja (dapat dipotongkan langsung dari total tagihan bersantap).</p>
    `;
  } else if (type === 'venue') {
    const v = paymentData.booking || paymentData;
    const amount = Number(v.total_price || 0);
    const dateStr = new Date(v.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const durLabel = v.duration_type === 'full_day' ? 'Full Day (12 Jam)' : 'Half Day (6 Jam)';

    detailsArea.innerHTML = `
      <span class="section-tag">Tagihan Sewa Ballroom & MICE</span>
      <h3 class="font-serif" style="font-size: 1.5rem; margin-bottom: 4px;">Kode: ${v.venue_booking_code}</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">${v.venue_name || 'Pakubuwono Grand Ballroom (2nd Floor)'} • ${durLabel}</p>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">Tanggal: ${dateStr} • Layout: ${v.layout_type} (${v.attendee_count} Orang)</p>
      <div style="font-size: 1.8rem; font-weight: 700; color: var(--gold-light); margin: 12px 0;">
        Rp ${amount.toLocaleString('id-ID')}
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted);">Termasuk fasilitas audio-visual, tata letak standar, dan lighting.</p>
    `;
  } else {
    // Kamar Hotel
    const booking = paymentData.booking || paymentData;
    const pricing = paymentData.pricing_breakdown || {
      total_price: booking.total_price,
      tax_amount: Math.round(Number(booking.total_price) * 0.12 / 1.12),
    };

    detailsArea.innerHTML = `
      <span class="section-tag">Tagihan Reservasi Kamar</span>
      <h3 class="font-serif" style="font-size: 1.5rem; margin-bottom: 4px;">Kode: ${booking.booking_code}</h3>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">${booking.room_type_name || 'Kamar Hotel'} • Kamar #${booking.room_number || '-'} (Lt. ${booking.floor || 1})</p>
      <div style="font-size: 1.8rem; font-weight: 700; color: var(--gold-light); margin: 12px 0;">
        Rp ${Number(pricing.total_price).toLocaleString('id-ID')}
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted);">Termasuk PPN 12%: Rp ${Number(pricing.tax_amount).toLocaleString('id-ID')}</p>
    `;
  }

  renderPaymentInstructions();
  openModal('paymentModal');
}

/**
 * Render Instruksi Pembayaran (VA / QRIS / Kartu / Kasir)
 */
function renderPaymentInstructions() {
  const method = document.getElementById('paymentMethodSelect').value;
  const box = document.getElementById('paymentInstructionsBox');

  if (method === 'bank_transfer') {
    box.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Nomor Virtual Account BCA / Mandiri:</p>
      <div style="font-family: monospace; font-size: 1.25rem; font-weight: 700; color: var(--gold-light); letter-spacing: 2px;">
        8809 1082 4591 0023
      </div>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">Transfer otomatis diverifikasi dalam beberapa detik.</p>
    `;
  } else if (method === 'ewallet') {
    box.innerHTML = `
      <div style="text-align: center;">
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">Pindai QRIS (GoPay, OVO, ShopeePay, Dana):</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=PAKUBUWONO-EDHOTEL-PAYMENT" style="margin: 0 auto; border-radius: 8px; border: 2px solid var(--gold-border);">
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">Buka aplikasi e-wallet Anda dan scan QR di atas.</p>
      </div>
    `;
  } else if (method === 'credit_card') {
    box.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Kartu Kredit / Debit:</p>
      <input type="text" class="form-control" placeholder="4000 1234 5678 9010" value="4000 •••• •••• 9010" disabled style="margin-bottom: 8px;">
      <p style="font-size: 0.75rem; color: var(--text-muted);">Transaksi dilindungi oleh enkripsi SSL 256-bit.</p>
    `;
  } else {
    box.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-secondary);">Silakan lakukan pelunasan langsung di Meja Resepsionis / Kasir saat kedatangan.</p>
    `;
  }
}

/**
 * Handle Eksekusi Pembayaran
 */
async function handleProcessPayment() {
  const pData = state.activePayment || state.activeBooking;
  if (!pData) return;

  const payment_method = document.getElementById('paymentMethodSelect').value;
  const payBtn = document.getElementById('confirmPayBtn');

  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mengonfirmasi Pembayaran...`;

  let type = pData.type;
  if (!type) {
    if (pData.reservation || pData.reservation_code) type = 'restaurant';
    else if (pData.venue_booking_code || (pData.booking && pData.booking.venue_booking_code)) type = 'venue';
    else type = 'room';
  }

  try {
    if (type === 'restaurant') {
      const resId = pData.reservation ? pData.reservation.id : (pData.id || pData.booking?.id);
      const res = await fetch(`${API_BASE}/services/restaurant/${resId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ payment_method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      closeModal('paymentModal');
      showToast(data.message || 'Konfirmasi pembayaran restoran berhasil dikirim!', 'success');
      openRestaurantVoucher(data.data.reservation);
      if (typeof openMyBookingsModal === 'function' && document.getElementById('myBookingsModal')?.classList.contains('active')) {
        openMyBookingsModal();
      }

    } else if (type === 'venue') {
      const venueId = pData.booking ? pData.booking.id : (pData.id || pData.reservation?.id);
      const res = await fetch(`${API_BASE}/services/venues/${venueId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ payment_method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      closeModal('paymentModal');
      showToast(data.message || 'Konfirmasi pembayaran venue berhasil dikirim!', 'success');
      openVenueVoucher(data.data.booking);
      if (typeof openMyBookingsModal === 'function' && document.getElementById('myBookingsModal')?.classList.contains('active')) {
        openMyBookingsModal();
      }

    } else {
      // Room
      const bookingId = pData.booking ? pData.booking.id : pData.id;
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ payment_method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      closeModal('paymentModal');
      showToast(data.message || 'Konfirmasi pembayaran kamar berhasil dikirim!', 'success');
      openVoucherModal(bookingId);
      if (typeof openMyBookingsModal === 'function' && document.getElementById('myBookingsModal')?.classList.contains('active')) {
        openMyBookingsModal();
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    payBtn.disabled = false;
    payBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Konfirmasi Pembayaran Sekarang`;
  }
}

/**
 * Memastikan elemen Modal E-Voucher & Reservation Form ada di DOM
 */
function ensureVoucherModalExists() {
  if (document.getElementById('voucherModal')) return;

  const modalHtml = `
  <div class="modal-overlay" id="voucherModal">
    <div class="modal-content" style="max-width: 820px;">
      <div class="modal-header">
        <h3 class="modal-title font-serif" id="voucherModalTitle">E-Voucher & Reservation Form</h3>
        <button class="modal-close" onclick="closeModal('voucherModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="voucher-tab-switcher" style="display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
          <button type="button" class="btn btn-gold btn-sm" id="tabBtnEvoucher" onclick="switchVoucherView('evoucher')" style="flex: 1;">
            <i class="fa-solid fa-receipt"></i> E-Voucher Digital
          </button>
          <button type="button" class="btn btn-outline-gold btn-sm" id="tabBtnResForm" onclick="switchVoucherView('resform')" style="flex: 1;">
            <i class="fa-solid fa-file-contract"></i> Official Reservation Form (Standar Edhotel)
          </button>
        </div>
        <div id="voucherPrintArea" class="printable-voucher">
        </div>
        <div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;" id="voucherActionButtons">
          <button class="btn btn-gold" style="flex: 1;" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Cetak / Simpan PDF
          </button>
          <button class="btn btn-outline-danger" id="voucherCancelBtn" onclick="handleCancelVoucherBooking()">
            <i class="fa-solid fa-ban"></i> Batalkan Reservasi
          </button>
          <button class="btn btn-glass" onclick="closeModal('voucherModal')">Tutup</button>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const newOverlay = document.getElementById('voucherModal');
  if (newOverlay) {
    newOverlay.addEventListener('click', (e) => {
      if (e.target === newOverlay) newOverlay.classList.remove('active');
    });
  }
}

/**
 * Render HTML untuk E-Voucher Digital Modern
 */
function renderEvoucherHTML(b, p) {
  const meta = parseReservationMeta(b);
  let statusBadgeColor = '#10b981';
  if (b.booking_status === 'pending') statusBadgeColor = '#f59e0b';
  if (b.booking_status === 'cancelled') statusBadgeColor = '#ef4444';

  return `
    <div class="evoucher-sheet">
      <div class="evoucher-header">
        <div class="evoucher-brand">
          <img src="assets/images/logo-pakubuwono.png" alt="Pakubuwono Edhotel" class="evoucher-logo">
          <div class="evoucher-brand-text">
            <h2 class="evoucher-hotel-name">PAKUBUWONO</h2>
            <span class="evoucher-hotel-sub">EDHOTEL • SMKN 30 JAKARTA</span>
          </div>
        </div>
        <div class="evoucher-status-badge">
          <span class="evoucher-badge-pill" style="background: ${statusBadgeColor};">
            ${b.booking_status}
          </span>
          <p class="evoucher-code-text">Kode: <strong>${b.booking_code}</strong></p>
        </div>
      </div>

      <div class="evoucher-guest-grid">
        <div class="evoucher-guest-col">
          <p class="evoucher-field-label">Nama Tamu</p>
          <h4 class="evoucher-field-title">${b.guest_name}</h4>
          <p class="evoucher-field-sub">${b.guest_email} • ${b.guest_phone || '-'}</p>
          <p class="evoucher-field-address">Alamat: ${meta.address}</p>
        </div>
        <div class="evoucher-room-col">
          <p class="evoucher-field-label">Akomodasi</p>
          <h4 class="evoucher-field-title">${b.room_type_name} (${meta.bed_type === 'TW' ? 'Twin Bed' : 'King Size'})</h4>
          <p class="evoucher-field-sub">Nomor Kamar: <strong>#${b.room_number}</strong> (Lantai ${b.floor}) • ${b.guest_count || 2} Tamu</p>
        </div>
      </div>

      <div class="evoucher-dates-grid">
        <div class="evoucher-date-box">
          <span class="evoucher-date-label">CHECK-IN (ETA ${meta.eta})</span>
          <p class="evoucher-date-value">${b.check_in_date}</p>
        </div>
        <div class="evoucher-date-box">
          <span class="evoucher-date-label">CHECK-OUT (ETD ${meta.etd})</span>
          <p class="evoucher-date-value">${b.check_out_date}</p>
        </div>
        <div class="evoucher-date-box evoucher-duration-box">
          <span class="evoucher-date-label">DURASI</span>
          <p class="evoucher-date-value">${b.total_nights} Malam</p>
        </div>
      </div>

      <div class="evoucher-pricing">
        <div class="evoucher-price-row">
          <span>Subtotal (${b.total_nights} Malam)</span>
          <span>Rp ${Number(p.subtotal).toLocaleString('id-ID')}</span>
        </div>
        <div class="evoucher-price-row">
          <span>Pajak & Layanan Hotel (12%)</span>
          <span>Rp ${Number(p.tax_amount).toLocaleString('id-ID')}</span>
        </div>
        <div class="evoucher-total-row">
          <span>TOTAL DIBAYAR</span>
          <span class="evoucher-total-amount">Rp ${Number(p.total_price).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div class="evoucher-footer">
        <span>Metode: ${(b.payment_method || 'Virtual Account').toUpperCase()} • Status: ${b.payment_status === 'paid' ? 'LUNAS (PAID)' : (b.payment_status === 'waiting_verification' ? 'MENUNGGU VERIFIKASI ADMIN' : 'BELUM DIBAYAR')}</span>
        <span>Dicetak pada: ${new Date().toLocaleDateString('id-ID')}</span>
      </div>
    </div>
  `;
}

/**
 * Render HTML 1:1 sesuai Dokumen PDF "RESERVATION FORM" Pakubuwono Edotel SMKN 30 Jakarta
 */
function renderOfficialReservationFormHTML(b, p) {
  const meta = parseReservationMeta(b);
  const activeStatus = state.resFormOverrideStatus || meta.form_status;
  const activeResBy = state.resFormOverrideResBy || meta.res_by;
  const activeBed = state.resFormOverrideBed || meta.bed_type;

  const roomRows = [
    { label: 'Superior', matchKey: 'Superior Room', rateIdr: 785000, rateUsd: 50 },
    { label: 'Deluxe', matchKey: 'Deluxe Room', rateIdr: 1020000, rateUsd: 65 },
    { label: 'Executive', matchKey: 'Executive Room', rateIdr: 1255000, rateUsd: 80 },
    { label: 'Junior Suite', matchKey: 'Junior Suite Room', rateIdr: 1490000, rateUsd: 95 },
    { label: 'Suite', matchKey: 'Suite Room', rateIdr: 1725000, rateUsd: 110 },
    { label: 'Presedential', matchKey: 'Presidential Suite', rateIdr: 3925000, rateUsd: 250 },
  ];

  const resByOptions = ['Phone', 'Letter', 'Email', 'Personal', 'OTA', 'Others'];

  return `
    <div class="official-resform-sheet">
      <!-- 1. TOP HEADER: LOGO + TITLE + RESERVATION NO -->
      <div class="resform-header">
        <div class="resform-logo-col">
          <img src="assets/images/logo-emblem.png" alt="Pakubuwono Edotel" class="resform-logo-img">
          <div class="resform-hotel-brand">PAKUBUWONO</div>
          <div class="resform-hotel-sub">EDOTEL</div>
          <div class="resform-hotel-school">SMKN 30 JAKARTA</div>
        </div>
        <div class="resform-title-col">
          <h2 class="resform-title-text">RESERVATION FORM</h2>
        </div>
        <div class="resform-no-col">
          <span>Reservation No. : </span>
          <span class="resform-dotted-line resform-no-val">${b.booking_code}</span>
        </div>
      </div>

      <!-- 2. THREE STATUS BOXES: NEW BOOKING | AMANDEMENT | CANCELLATION -->
      <div class="resform-status-container">
        ${['New Booking', 'Amandement', 'Cancellation'].map(st => {
          const isChecked = activeStatus === st;
          return `
            <div class="resform-status-item" onclick="toggleResFormBox('status', '${st}')" title="Klik untuk memilih status ${st}">
              <div class="resform-status-box ${isChecked ? 'active' : ''}">
                ${isChecked ? '&#10003;' : ''}
              </div>
              <div class="resform-status-label">${st}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- 3. GUEST NAME, PAX, ARRIVAL & DEPARTURE -->
      <div class="resform-details-section">
        <div class="resform-field-row">
          <span class="resform-field-label">Name of Guest</span>
          <span class="resform-field-colon">:</span>
          <span class="resform-dotted-line resform-field-val">${b.guest_name} (Room #${b.room_number} - Floor ${b.floor})</span>
        </div>

        <div class="resform-field-row">
          <span class="resform-field-label">Number of Person</span>
          <span class="resform-field-colon">:</span>
          <div class="resform-pax-wrap">
            <span class="resform-dotted-line resform-pax-val">${b.guest_count || 2} Adult</span>
            <span class="resform-slash">/</span>
            <span class="resform-dotted-line resform-pax-val">0 Child (${b.total_nights} Night${b.total_nights > 1 ? 's' : ''})</span>
          </div>
        </div>

        <div class="resform-flights-row">
          <div class="resform-flight-item">
            <span class="resform-flight-label">Arrival</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${b.check_in_date}</span>
          </div>
          <div class="resform-flight-item">
            <span class="resform-flight-label">Flight No.</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${meta.arr_flight}</span>
          </div>
          <div class="resform-flight-item resform-flight-eta">
            <span class="resform-flight-label">ETA</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${meta.eta}</span>
          </div>
        </div>

        <div class="resform-flights-row">
          <div class="resform-flight-item">
            <span class="resform-flight-label">Departure</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${b.check_out_date}</span>
          </div>
          <div class="resform-flight-item">
            <span class="resform-flight-label">Flight No.</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${meta.dep_flight}</span>
          </div>
          <div class="resform-flight-item resform-flight-eta">
            <span class="resform-flight-label">ETD</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${meta.etd}</span>
          </div>
        </div>
      </div>

      <!-- 4. TWO TABLES: RESERVATION BY & TYPE OF ROOM / BED TYPE / RATE -->
      <div class="resform-tables-wrapper">
        <!-- Left Table: Reservation by -->
        <table class="resform-table-by">
          <thead>
            <tr>
              <th colspan="2">Reservation by</th>
            </tr>
          </thead>
          <tbody>
            ${resByOptions.map(opt => {
              const isChecked = activeResBy.toLowerCase() === opt.toLowerCase();
              return `
                <tr onclick="toggleResFormBox('resBy', '${opt}')" title="Klik untuk memilih ${opt}">
                  <td class="resform-td-opt">${opt}</td>
                  <td class="resform-td-check ${isChecked ? 'active' : ''}">${isChecked ? '&#10003;' : ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Right Table: Type of Room | Check | Bed Type | Rate -->
        <div class="resform-table-room-scroll">
          <table class="resform-table-room">
            <thead>
              <tr>
                <th colspan="2">Type of Room</th>
                <th class="resform-th-bed">Bed Type</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              ${roomRows.map(r => {
                const isSelectedRoom = (b.room_type_name || '').toLowerCase() === r.matchKey.toLowerCase();
                const bedDisplay = isSelectedRoom
                  ? `<span class="resform-bed-toggle" onclick="toggleResFormBox('bed', '${activeBed === 'TW' ? 'KS' : 'TW'}')" title="Klik untuk ganti TW/KS">
                       <strong class="${activeBed === 'TW' ? 'bed-active' : 'bed-inactive'}">TW</strong>/<strong class="${activeBed === 'KS' ? 'bed-active' : 'bed-inactive'}">KS</strong>
                     </span>`
                  : 'TW/KS';

                const rateDisplay = isSelectedRoom
                  ? `<strong>Rp ${r.rateIdr.toLocaleString('id-ID')} ($${r.rateUsd}) / night</strong>`
                  : `<span class="rate-muted">Rp ${r.rateIdr.toLocaleString('id-ID')} ($${r.rateUsd})</span>`;

                return `
                  <tr class="${isSelectedRoom ? 'room-selected' : ''}">
                    <td class="resform-td-room-name">${r.label}</td>
                    <td class="resform-td-room-check">${isSelectedRoom ? '&#10003;' : ''}</td>
                    <td class="resform-td-room-bed">${bedDisplay}</td>
                    <td class="resform-td-room-rate">${rateDisplay}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 5. COMPANY, ADDRESS, EMAIL, PHONE, REMARKS & BILLING INSTRUCTION -->
      <div class="resform-company-section">
        <div class="resform-field-row">
          <span class="resform-field-label">Company Name</span>
          <span class="resform-field-colon">:</span>
          <span class="resform-dotted-line resform-field-val">${meta.company}</span>
        </div>

        <div class="resform-field-row">
          <span class="resform-field-label">Address</span>
          <span class="resform-field-colon">:</span>
          <span class="resform-dotted-line resform-field-val">${meta.address}</span>
        </div>

        <div class="resform-field-row">
          <span class="resform-field-label">Email</span>
          <span class="resform-field-colon">:</span>
          <span class="resform-dotted-line resform-field-val">${b.guest_email}</span>
        </div>

        <div class="resform-field-row">
          <span class="resform-field-label">Phone Number</span>
          <span class="resform-field-colon">:</span>
          <span class="resform-dotted-line resform-field-val">${b.guest_phone || '-'}</span>
        </div>

        <div class="resform-field-row">
          <span class="resform-field-label">Remarks</span>
          <span class="resform-field-colon">:</span>
          <span class="resform-dotted-line resform-field-val">${meta.remarks}</span>
        </div>

        <div class="resform-field-row">
          <span class="resform-field-label">Billing Instruction</span>
          <span class="resform-field-colon">:</span>
          <span class="resform-dotted-line resform-field-val">${meta.billing} — Total (Inc. 12% Tax): Rp ${Number(p.total_price).toLocaleString('id-ID')} (${b.payment_status === 'paid' ? 'PAID' : 'UNPAID'})</span>
        </div>
      </div>

      <!-- 6. FOOTER SIGN-OFF: ACCEPTED BY & CONFIRMATION BY -->
      <div class="resform-sign-wrapper">
        <div class="resform-sign-row">
          <div class="resform-sign-item">
            <span class="resform-sign-label">Accepted by</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${meta.accepted_by}</span>
          </div>
          <div class="resform-sign-item resform-sign-date">
            <span class="resform-sign-label">Date</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${meta.accepted_date}</span>
          </div>
        </div>

        <div class="resform-sign-row">
          <div class="resform-sign-item">
            <span class="resform-sign-label">Confirmation by</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${meta.confirmed_by || '&nbsp;'}</span>
          </div>
          <div class="resform-sign-item resform-sign-date">
            <span class="resform-sign-label">Date</span>
            <span class="resform-field-colon">:</span>
            <span class="resform-dotted-line resform-field-val resform-center">${meta.confirmed_date || '&nbsp;'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Interaktif toggle kotak pada Official Reservation Form sebelum cetak
 */
function toggleResFormBox(type, value) {
  if (type === 'status') state.resFormOverrideStatus = value;
  if (type === 'resBy') state.resFormOverrideResBy = value;
  if (type === 'bed') state.resFormOverrideBed = value;
  if (state.activeVoucherData) {
    switchVoucherView('resform');
  }
}

/**
 * Beralih antara tampilan E-Voucher Digital dan Official Reservation Form
 */
function switchVoucherView(mode = 'evoucher') {
  if (!state.activeVoucherData) return;
  const { booking, pricing } = state.activeVoucherData;
  const voucherArea = document.getElementById('voucherPrintArea');
  const btnEvoucher = document.getElementById('tabBtnEvoucher');
  const btnResForm = document.getElementById('tabBtnResForm');

  if (!voucherArea) return;

  if (mode === 'resform') {
    voucherArea.innerHTML = renderOfficialReservationFormHTML(booking, pricing);
    if (btnEvoucher) btnEvoucher.className = 'btn btn-outline-gold btn-sm';
    if (btnResForm) btnResForm.className = 'btn btn-gold btn-sm';
  } else {
    voucherArea.innerHTML = renderEvoucherHTML(booking, pricing);
    if (btnEvoucher) btnEvoucher.className = 'btn btn-gold btn-sm';
    if (btnResForm) btnResForm.className = 'btn btn-outline-gold btn-sm';
  }
}

/**
 * Menampilkan E-Voucher Hotel Digital & Official Reservation Form Printable
 */
async function openVoucherModal(bookingIdOrCode, initialMode = 'evoucher') {
  try {
    ensureVoucherModalExists();
    const res = await fetch(`${API_BASE}/bookings/${bookingIdOrCode}`, {
      headers: { 'Authorization': `Bearer ${state.token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const b = data.data.booking;
    const p = data.data.pricing_breakdown;
    state.activeVoucherBookingId = b.id;
    state.activeVoucherData = { booking: b, pricing: p };
    state.resFormOverrideStatus = null;
    state.resFormOverrideResBy = null;
    state.resFormOverrideBed = null;

    const voucherCancelBtn = document.getElementById('voucherCancelBtn');
    if (voucherCancelBtn) {
      if (b.booking_status === 'cancelled' || b.booking_status === 'completed' || b.booking_status === 'checked_out') {
        voucherCancelBtn.style.display = 'none';
      } else {
        voucherCancelBtn.style.display = 'inline-block';
      }
    }

    switchVoucherView(initialMode);
    openModal('voucherModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Handle Cancel Booking from Payment Modal
 */
function handleCancelCurrentBooking() {
  if (!state.activeBooking) return;
  if (state.activeBooking.type === 'restaurant' && state.activeBooking.reservation) {
    handleCancelRestaurantBooking(state.activeBooking.reservation.id);
  } else if (state.activeBooking.type === 'venue' && state.activeBooking.booking) {
    handleCancelVenueBooking(state.activeBooking.booking.id);
  } else if (state.activeBooking.booking) {
    handleCancelBooking(state.activeBooking.booking.id);
  }
}

/**
 * Handle Cancel Booking from Voucher Modal
 */
function handleCancelVoucherBooking() {
  if (!state.activeVoucherBookingId) return;
  handleCancelBooking(state.activeVoucherBookingId);
}

/**
 * Eksekusi Pembatalan Reservasi (Cancel Booking)
 */
async function handleCancelBooking(bookingId) {
  if (!confirm('Apakah Anda yakin ingin membatalkan reservasi ini? Kamar yang dialokasikan akan dilepaskan kembali.')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast('Reservasi berhasil dibatalkan. Kamar telah dilepaskan kembali.', 'success');

    // Tutup modal payment/voucher jika aktif
    closeModal('paymentModal');
    closeModal('voucherModal');

    // Refresh modal riwayat pemesanan jika sedang terbuka
    const myBookingsModal = document.getElementById('myBookingsModal');
    if (myBookingsModal && myBookingsModal.classList.contains('active')) {
      openMyBookingsModal();
    }

    // Refresh katalog kamar agar jumlah kamar tersedia langsung bertambah
    fetchRooms();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 7. GUEST BOOKINGS HISTORY & REVIEWS
// ============================================================

/**
 * Memastikan elemen Modal Riwayat Pemesanan Tamu ada di DOM
 */
function ensureMyBookingsModalExists() {
  if (document.getElementById('myBookingsModal')) return;

  const modalHtml = `
  <div class="modal-overlay" id="myBookingsModal">
    <div class="modal-content" style="max-width: 760px;">
      <div class="modal-header">
        <h3 class="modal-title font-serif">Riwayat Reservasi Saya</h3>
        <button class="modal-close" onclick="closeModal('myBookingsModal')">&times;</button>
      </div>
      <div class="modal-body">
        <div id="myBookingsList" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const newOverlay = document.getElementById('myBookingsModal');
  if (newOverlay) {
    newOverlay.addEventListener('click', (e) => {
      if (e.target === newOverlay) newOverlay.classList.remove('active');
    });
  }
}

/**
 * Membuka Modal Riwayat Pemesanan Tamu
 */
async function openMyBookingsModal() {
  if (!state.token || !state.user) {
    openAuthModal('login');
    return;
  }

  ensureMyBookingsModalExists();

  const listContainer = document.getElementById('myBookingsList');
  if (!listContainer) return;

  listContainer.innerHTML = `<div style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin text-gold"></i> Memuat riwayat...</div>`;
  openModal('myBookingsModal');

  try {
    const [resRooms, resRest, resVenues] = await Promise.all([
      fetch(`${API_BASE}/bookings/my-bookings`, {
        headers: { 'Authorization': `Bearer ${state.token}` },
      }),
      fetch(`${API_BASE}/services/restaurant/my-bookings`, {
        headers: { 'Authorization': `Bearer ${state.token}` },
      }),
      fetch(`${API_BASE}/services/venues/my-bookings`, {
        headers: { 'Authorization': `Bearer ${state.token}` },
      }).catch(() => ({ ok: false }))
    ]);

    let roomBookings = [];
    let restBookings = [];
    let venueBookings = [];

    if (resRooms.ok) {
      const dataRooms = await resRooms.json();
      roomBookings = dataRooms.data.bookings || [];
    }
    if (resRest.ok) {
      const dataRest = await resRest.json();
      restBookings = dataRest.data.bookings || [];
    }
    if (resVenues.ok) {
      const dataVenues = await resVenues.json();
      venueBookings = dataVenues.data?.bookings || [];
    }

    if (roomBookings.length === 0 && restBookings.length === 0 && venueBookings.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <i class="fa-solid fa-calendar-xmark text-gold" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
          <p style="color: var(--text-secondary);">Anda belum memiliki riwayat reservasi.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Render Kamar
    if (roomBookings.length > 0) {
      html += `<h4 style="color: var(--gold-light); margin-bottom: 10px; border-bottom: 1px solid var(--gold-border); padding-bottom: 5px;"><i class="fa-solid fa-bed"></i> Reservasi Kamar & Suite</h4>`;
      html += roomBookings.map(b => {
      let badgeClass = 'var(--accent-amber)';
      if (b.booking_status === 'confirmed' || b.booking_status === 'checked_in') badgeClass = 'var(--accent-emerald)';
      if (b.booking_status === 'cancelled') badgeClass = 'var(--accent-rose)';

      const isCancellable = b.booking_status === 'pending' || b.booking_status === 'confirmed';
      const isReviewed = Boolean(b.review_id);
      const isPaid = b.payment_status === 'paid';
      const isWaiting = b.payment_status === 'waiting_verification';
      const payColor = isPaid ? '#10b981' : (isWaiting ? '#38bdf8' : '#f59e0b');
      const payBg = isPaid ? 'rgba(16,185,129,0.15)' : (isWaiting ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)');
      const payLabel = isPaid
        ? `<i class="fa-solid fa-check"></i> LUNAS (${(b.payment_method || 'transfer').toUpperCase()})`
        : (isWaiting ? `<i class="fa-solid fa-hourglass-half"></i> MENUNGGU VERIFIKASI` : `<i class="fa-solid fa-clock"></i> BELUM BAYAR`);

      return `
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--gold-border); border-radius: var(--radius-sm); padding: 18px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: var(--gold-light); font-size: 1.05rem;">${b.booking_code}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="font-size: 0.75rem; font-weight: 700; color: ${payColor}; background: ${payBg}; border: 1px solid ${payColor}; padding: 2px 8px; border-radius: 12px;">
                ${payLabel}
              </span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #fff; background: ${badgeClass}; padding: 2px 10px; border-radius: 12px; text-transform: uppercase;">
                ${b.booking_status}
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
            <div><strong>Kamar:</strong> ${b.room_type_name} (#${b.room_number})</div>
            <div><strong>Durasi:</strong> ${b.total_nights} Malam</div>
            <div><strong>Check-In:</strong> ${b.check_in_date}</div>
            <div><strong>Check-Out:</strong> ${b.check_out_date}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 8px;">
            <span style="font-weight: 700; color: var(--gold-primary);">Rp ${Number(b.total_price).toLocaleString('id-ID')} (Inc. Tax 12%)</span>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-outline-gold btn-sm" onclick="openVoucherModal('${b.id}', 'evoucher')">
                <i class="fa-solid fa-file-invoice"></i> E-Voucher
              </button>
              <button class="btn btn-outline-gold btn-sm" onclick="openVoucherModal('${b.id}', 'resform')" title="Lihat & Cetak Official Reservation Form (Standar Edhotel)">
                <i class="fa-solid fa-file-contract"></i> Reservation Form
              </button>
              ${isReviewed ? `
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--gold-light); background: rgba(212,175,55,0.12); border: 1px solid var(--gold-border); padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px;">
                  <i class="fa-solid fa-star text-gold"></i> Diulas (${b.review_rating}★)
                </span>
              ` : (b.booking_status !== 'cancelled' ? `
                <button class="btn btn-outline-gold btn-sm" onclick="openReviewModal('${b.id}', '${b.booking_code}', '${b.room_type_name}')" title="Beri Rating & Komen">
                  <i class="fa-solid fa-star"></i> Beri Rating
                </button>
              ` : '')}
              ${(!isPaid && !isWaiting && b.booking_status !== 'cancelled') ? `
                <button class="btn btn-gold btn-sm" onclick="openPaymentModal({ booking: { id: '${b.id}', booking_code: '${b.booking_code}', room_type_name: '${b.room_type_name}', room_number: '${b.room_number}', floor: 1 }, pricing_breakdown: { total_price: ${b.total_price}, tax_amount: Math.round(${b.total_price} * 0.12 / 1.12) }, payment: { status: 'unpaid' } })">
                  <i class="fa-solid fa-wallet"></i> Bayar
                </button>
              ` : ''}
              ${isCancellable ? `
                <button class="btn btn-outline-danger btn-sm" onclick="handleCancelBooking('${b.id}')" title="Batalkan Reservasi">
                  <i class="fa-solid fa-ban"></i> Batalkan
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      }).join('');
    }

    // Render Restoran
    if (restBookings.length > 0) {
      html += `<h4 style="color: var(--gold-light); margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid var(--gold-border); padding-bottom: 5px;"><i class="fa-solid fa-utensils"></i> Reservasi Andrawina Restaurant (1st Floor)</h4>`;
      html += restBookings.map(b => {
        let badgeClass = 'var(--accent-amber)';
        if (b.status === 'confirmed') badgeClass = 'var(--accent-emerald)';
        if (b.status === 'completed') badgeClass = 'var(--text-secondary)';
        if (b.status === 'cancelled') badgeClass = 'var(--accent-rose)';

        const isPaid = b.payment_status === 'paid';
        const isWaiting = b.payment_status === 'waiting_verification';
        const isCancellable = b.status === 'pending' || b.status === 'confirmed';
        const payColor = isPaid ? '#10b981' : (isWaiting ? '#38bdf8' : '#f59e0b');
        const payBg = isPaid ? 'rgba(16,185,129,0.15)' : (isWaiting ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)');
        const payLabel = isPaid
          ? `<i class="fa-solid fa-check"></i> LUNAS (${(b.payment_method || 'transfer').toUpperCase()})`
          : (isWaiting ? `<i class="fa-solid fa-hourglass-half"></i> MENUNGGU VERIFIKASI` : `<i class="fa-solid fa-clock"></i> BELUM BAYAR`);
        const dateStr = new Date(b.reservation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        
        return `
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--gold-border); border-radius: var(--radius-sm); padding: 18px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: var(--gold-light); font-size: 1.05rem;">${b.reservation_code}</span>
              <div style="display: flex; gap: 6px; align-items: center;">
                <span style="font-size: 0.75rem; font-weight: 700; color: ${payColor}; background: ${payBg}; border: 1px solid ${payColor}; padding: 2px 8px; border-radius: 12px;">
                  ${payLabel}
                </span>
                <span style="font-size: 0.75rem; font-weight: 700; color: #fff; background: ${badgeClass}; padding: 2px 10px; border-radius: 12px; text-transform: uppercase;">
                  ${b.status}
                </span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
              <div><strong>Tanggal:</strong> ${dateStr}</div>
              <div><strong>Sesi:</strong> <span style="text-transform: capitalize;">${b.session_time}</span></div>
              <div><strong>Tamu:</strong> ${b.guest_count} Orang</div>
              <div><strong>Meja:</strong> ${b.table_number || 'Belum Ditentukan'}</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 10px;">
              <span style="font-weight: 700; color: var(--gold-primary);">Deposit: Rp ${Number(b.total_price || 100000).toLocaleString('id-ID')}</span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${(!isPaid && !isWaiting && b.status !== 'cancelled') ? `
                  <button class="btn btn-gold btn-sm" onclick='openPaymentModal({ type: "restaurant", reservation: ${JSON.stringify(b)} })'>
                    <i class="fa-solid fa-wallet"></i> Bayar Deposit
                  </button>
                ` : ''}
                <button class="btn btn-outline-gold btn-sm" onclick='openRestaurantVoucher(${JSON.stringify(b)})'>
                  <i class="fa-solid fa-file-invoice"></i> Bukti Reservasi
                </button>
                ${isCancellable ? `
                  <button class="btn btn-outline-danger btn-sm" onclick="handleCancelRestaurantBooking('${b.id}')" title="Batalkan Reservasi Restoran">
                    <i class="fa-solid fa-ban"></i> Batalkan
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Venue / MICE
    if (venueBookings.length > 0) {
      html += `<h4 style="color: var(--gold-light); margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid var(--gold-border); padding-bottom: 5px;"><i class="fa-solid fa-handshake"></i> Reservasi MICE & Ballroom</h4>`;
      html += venueBookings.map(b => {
        let badgeClass = 'var(--accent-amber)';
        if (b.status === 'confirmed') badgeClass = 'var(--accent-emerald)';
        if (b.status === 'completed') badgeClass = 'var(--text-secondary)';
        if (b.status === 'cancelled') badgeClass = 'var(--accent-rose)';

        const isPaid = b.payment_status === 'paid';
        const isWaiting = b.payment_status === 'waiting_verification';
        const isCancellable = b.status === 'pending' || b.status === 'confirmed';
        const payColor = isPaid ? '#10b981' : (isWaiting ? '#38bdf8' : '#f59e0b');
        const payBg = isPaid ? 'rgba(16,185,129,0.15)' : (isWaiting ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)');
        const payLabel = isPaid
          ? `<i class="fa-solid fa-check"></i> LUNAS (${(b.payment_method || 'transfer').toUpperCase()})`
          : (isWaiting ? `<i class="fa-solid fa-hourglass-half"></i> MENUNGGU VERIFIKASI` : `<i class="fa-solid fa-clock"></i> BELUM BAYAR`);
        const dateStr = new Date(b.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const durLabel = b.duration_type === 'full_day' ? 'Full Day (12 Jam)' : 'Half Day (6 Jam)';
        
        return `
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--gold-border); border-radius: var(--radius-sm); padding: 18px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: var(--gold-light); font-size: 1.05rem;">${b.venue_booking_code}</span>
              <div style="display: flex; gap: 6px; align-items: center;">
                <span style="font-size: 0.75rem; font-weight: 700; color: ${payColor}; background: ${payBg}; border: 1px solid ${payColor}; padding: 2px 8px; border-radius: 12px;">
                  ${payLabel}
                </span>
                <span style="font-size: 0.75rem; font-weight: 700; color: #fff; background: ${badgeClass}; padding: 2px 10px; border-radius: 12px; text-transform: uppercase;">
                  ${b.status}
                </span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
              <div><strong>Venue:</strong> ${b.venue_name || 'Grand Ballroom'}</div>
              <div><strong>Tanggal Acara:</strong> ${dateStr}</div>
              <div><strong>Durasi:</strong> ${durLabel}</div>
              <div><strong>Layout:</strong> <span style="text-transform: capitalize;">${b.layout_type}</span> (${b.attendee_count} Orang)</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 10px;">
              <span style="font-weight: 700; color: var(--gold-primary);">Rp ${Number(b.total_price).toLocaleString('id-ID')}</span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${(!isPaid && !isWaiting && b.status !== 'cancelled') ? `
                  <button class="btn btn-gold btn-sm" onclick='openPaymentModal({ type: "venue", booking: ${JSON.stringify(b)} })'>
                    <i class="fa-solid fa-wallet"></i> Bayar Sekarang
                  </button>
                ` : ''}
                <button class="btn btn-outline-gold btn-sm" onclick='openVenueVoucher(${JSON.stringify(b)})'>
                  <i class="fa-solid fa-file-invoice"></i> E-Voucher
                </button>
                ${isCancellable ? `
                  <button class="btn btn-outline-danger btn-sm" onclick="handleCancelVenueBooking('${b.id}')" title="Batalkan Reservasi Ballroom">
                    <i class="fa-solid fa-ban"></i> Batalkan
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    listContainer.innerHTML = html;

  } catch (err) {
    listContainer.innerHTML = `<div style="text-align: center; color: var(--accent-rose); padding: 20px;">${err.message}</div>`;
  }
}

/**
 * Eksekusi Pembatalan Reservasi Restoran (Guest)
 */
async function handleCancelRestaurantBooking(id) {
  if (!confirm('Apakah Anda yakin ingin membatalkan reservasi meja restoran ini?')) {
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/services/restaurant/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(data.message || 'Reservasi restoran berhasil dibatalkan.', 'success');
    closeModal('paymentModal');
    closeModal('restaurantVoucherModal');

    const myBookingsModal = document.getElementById('myBookingsModal');
    if (myBookingsModal && myBookingsModal.classList.contains('active')) {
      openMyBookingsModal();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Eksekusi Pembatalan Reservasi Ballroom / Venue (Guest)
 */
async function handleCancelVenueBooking(id) {
  if (!confirm('Apakah Anda yakin ingin membatalkan reservasi venue/ballroom ini?')) {
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/services/venues/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(data.message || 'Reservasi venue berhasil dibatalkan.', 'success');
    closeModal('paymentModal');
    closeModal('venueVoucherModal');

    const myBookingsModal = document.getElementById('myBookingsModal');
    if (myBookingsModal && myBookingsModal.classList.contains('active')) {
      openMyBookingsModal();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Membuka Modal Bukti Reservasi Restoran
 */
function openRestaurantVoucher(b) {
  const printArea = document.getElementById('restVoucherPrintArea');
  if (!printArea) return;
  const dateStr = new Date(b.reservation_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  
  let statusBadge = '';
  if (b.status === 'confirmed') statusBadge = '<span style="color: #10b981; font-weight: bold;">CONFIRMED</span>';
  else if (b.status === 'pending') statusBadge = '<span style="color: #f59e0b; font-weight: bold;">PENDING</span>';
  else if (b.status === 'completed') statusBadge = '<span style="color: #6b7280; font-weight: bold;">COMPLETED</span>';
  else statusBadge = `<span style="color: #ef4444; font-weight: bold;">${(b.status || '').toUpperCase()}</span>`;

  let payBadge = '';
  if (b.payment_status === 'paid') {
    payBadge = `<span style="color: #10b981; font-weight: bold;"><i class="fa-solid fa-check-circle"></i> LUNAS (${(b.payment_method || 'BANK_TRANSFER').toUpperCase()})</span>`;
  } else if (b.payment_status === 'waiting_verification') {
    payBadge = `<span style="color: #0284c7; font-weight: bold;"><i class="fa-solid fa-hourglass-half"></i> MENUNGGU VERIFIKASI ADMIN (${(b.payment_method || 'BANK_TRANSFER').toUpperCase()})</span>`;
  } else {
    payBadge = '<span style="color: #f59e0b; font-weight: bold;"><i class="fa-solid fa-clock"></i> BELUM DIBAYAR</span>';
  }

  printArea.innerHTML = `
    <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px;">
      <img src="assets/images/logo-pakubuwono.png" alt="Pakubuwono Edhotel" style="height: 48px; width: auto; background: #0f172a; padding: 6px 12px; border-radius: 8px; margin: 0 auto 8px;">
      <h2 style="margin: 0; font-family: serif; color: #c5a059;">PAKUBUWONO EDHOTEL — SMKN 30 JAKARTA</h2>
      <p style="margin: 5px 0 0; color: #666; font-size: 0.9rem;">Andrawina Restaurant (1st Floor) - Bukti Reservasi & Deposit Meja</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div>
        <p style="margin: 0; font-size: 0.85rem; color: #666;">Kode Booking Meja</p>
        <h3 style="margin: 0; font-family: monospace; font-size: 1.25rem; color: #111;">${b.reservation_code}</h3>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 0.85rem; color: #666;">Status Reservasi</p>
        <h3 style="margin: 0;">${statusBadge}</h3>
      </div>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Nama Tamu</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${b.guest_name || state.user?.full_name || '-'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Tanggal Kunjungan</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Sesi Waktu</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; text-transform: capitalize;">${b.session_time}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Jumlah Tamu</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${b.guest_count} Orang</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Nomor Meja</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${b.table_number || 'Belum Ditentukan (Walk-in)'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Status Pembayaran</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${payBadge}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 2px solid #c5a059; font-size: 1.05rem;"><strong>Deposit Komitmen Meja</strong></td>
        <td style="padding: 12px 0; border-bottom: 2px solid #c5a059; text-align: right; font-size: 1.2rem; font-weight: bold; color: #b45309;">
          Rp ${Number(b.total_price || 100000).toLocaleString('id-ID')}
        </td>
      </tr>
    </table>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 0.85rem; font-weight: bold;">Permintaan Khusus:</p>
      <p style="margin: 5px 0 0; font-size: 0.85rem; color: #555;">${b.special_requests || 'Tidak ada permintaan khusus.'}</p>
    </div>
    
    <div style="text-align: center; font-size: 0.8rem; color: #888;">
      Tunjukkan Bukti Reservasi ini kepada resepsionis Andrawina Restaurant (Lantai 1) saat kedatangan. Deposit akan otomatis memotong tagihan bersantap Anda.
    </div>
  `;
  openModal('restaurantVoucherModal');
}

/**
 * Membuka Modal Bukti Reservasi Ballroom & MICE
 */
function openVenueVoucher(b) {
  const printArea = document.getElementById('venueVoucherPrintArea');
  if (!printArea) return;
  
  const dateStr = new Date(b.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const durLabel = b.duration_type === 'full_day' ? 'Full Day (12 Jam)' : 'Half Day (6 Jam)';
  
  let statusBadge = '';
  if (b.status === 'confirmed') statusBadge = '<span style="color: #10b981; font-weight: bold;">CONFIRMED</span>';
  else if (b.status === 'pending') statusBadge = '<span style="color: #f59e0b; font-weight: bold;">PENDING</span>';
  else if (b.status === 'completed') statusBadge = '<span style="color: #6b7280; font-weight: bold;">COMPLETED</span>';
  else statusBadge = `<span style="color: #ef4444; font-weight: bold;">${(b.status || '').toUpperCase()}</span>`;

  let payBadge = '';
  if (b.payment_status === 'paid') {
    payBadge = `<span style="color: #10b981; font-weight: bold;"><i class="fa-solid fa-check-circle"></i> LUNAS (${(b.payment_method || 'BANK_TRANSFER').toUpperCase()})</span>`;
  } else if (b.payment_status === 'waiting_verification') {
    payBadge = `<span style="color: #0284c7; font-weight: bold;"><i class="fa-solid fa-hourglass-half"></i> MENUNGGU VERIFIKASI ADMIN (${(b.payment_method || 'BANK_TRANSFER').toUpperCase()})</span>`;
  } else {
    payBadge = '<span style="color: #f59e0b; font-weight: bold;"><i class="fa-solid fa-clock"></i> BELUM DIBAYAR</span>';
  }

  printArea.innerHTML = `
    <div style="text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px;">
      <img src="assets/images/logo-pakubuwono.png" alt="Pakubuwono Edhotel" style="height: 48px; width: auto; background: #0f172a; padding: 6px 12px; border-radius: 8px; margin: 0 auto 8px;">
      <h2 style="margin: 0; font-family: serif; color: #c5a059;">PAKUBUWONO EDHOTEL — SMKN 30 JAKARTA</h2>
      <p style="margin: 5px 0 0; color: #666; font-size: 0.9rem;">Ballroom & Meeting Room (2nd Floor) - Bukti Reservasi & Invoice</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div>
        <p style="margin: 0; font-size: 0.85rem; color: #666;">Kode Booking Event</p>
        <h3 style="margin: 0; font-family: monospace; font-size: 1.25rem; color: #111;">${b.venue_booking_code}</h3>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 0.85rem; color: #666;">Status Reservasi</p>
        <h3 style="margin: 0;">${statusBadge}</h3>
      </div>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Nama Penyelenggara</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${b.guest_name || state.user?.full_name || '-'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Venue Terpilih</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: #c5a059; font-weight: bold;">${b.venue_name || 'Pakubuwono Grand Ballroom (2nd Floor)'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Tanggal Acara</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Durasi Pemakaian</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${durLabel}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Tata Letak (Layout)</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; text-transform: capitalize;">${b.layout_type} (${b.attendee_count} Orang)</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Status Pembayaran</strong></td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${payBadge}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 2px solid #c5a059; font-size: 1.05rem;"><strong>Total Biaya Sewa</strong></td>
        <td style="padding: 12px 0; border-bottom: 2px solid #c5a059; text-align: right; font-size: 1.25rem; font-weight: bold; color: #b45309;">
          Rp ${Number(b.total_price).toLocaleString('id-ID')}
        </td>
      </tr>
    </table>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 0.85rem; font-weight: bold;">Permintaan Khusus & Detail Acara:</p>
      <p style="margin: 5px 0 0; font-size: 0.85rem; color: #555;">${b.special_requests || 'Tidak ada permintaan khusus.'}</p>
    </div>
    
    <div style="text-align: center; font-size: 0.8rem; color: #888;">
      Tunjukkan E-Voucher ini kepada Banquet Coordinator saat koordinasi teknis / gladi resik.
    </div>
  `;
  openModal('venueVoucherModal');
}

// ============================================================
// 8. UTILITY FUNCTIONS (MODAL & TOAST)
// ============================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// Close modal when clicking on overlay background
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

/**
 * Toast Notification Manager
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="font-size: 1.25rem; color: ${type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'};"></i>
    <span style="font-size: 0.9rem;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================================
// 9. GUEST REVIEWS & HOTEL RATING SYSTEM
// ============================================================

const RATING_LABELS = {
  1: '⭐ 1 / 5 - Perlu Peningkatan',
  2: '⭐⭐ 2 / 5 - Kurang Memuaskan',
  3: '⭐⭐⭐ 3 / 5 - Cukup Baik',
  4: '⭐⭐⭐⭐ 4 / 5 - Sangat Bagus & Memuaskan',
  5: '⭐⭐⭐⭐⭐ 5 / 5 - Luar Biasa & Mewah!',
};

/**
 * Memuat dan merender daftar ulasan & rating hotel dari backend
 */
async function fetchHotelReviews() {
  const grid = document.getElementById('reviewsGrid');
  const avgNum = document.getElementById('reviewAvgRating');
  const avgStars = document.getElementById('reviewAvgStars');
  const totalCount = document.getElementById('reviewTotalCount');

  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/reviews`);
    if (!res.ok) throw new Error('Gagal memuat ulasan');

    const result = await res.json();
    const { stats, reviews } = result.data;

    // Update Average Rating Score & Stars
    if (avgNum && stats) {
      const avg = Number(stats.average_rating || 5.0).toFixed(1);
      avgNum.textContent = avg;
      
      const fullStars = Math.floor(avg);
      const hasHalf = avg - fullStars >= 0.5;
      let starHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
          starHtml += '<i class="fa-solid fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalf) {
          starHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
          starHtml += '<i class="fa-regular fa-star"></i>';
        }
      }
      if (avgStars) avgStars.innerHTML = starHtml;
      if (totalCount) {
        totalCount.textContent = `Berdasarkan ${stats.total_reviews} ulasan tamu terverifikasi`;
      }
    }

    if (!reviews || reviews.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-surface-elevated); border: 1px dashed var(--gold-border); border-radius: var(--radius-md);">
          <i class="fa-solid fa-star-half-stroke text-gold" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
          <h4 style="color: var(--gold-light); margin-bottom: 6px;">Belum Ada Ulasan Tamu</h4>
          <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 16px; font-size: 0.9rem;">
            Jadilah yang pertama membagikan pengalaman dan penilaian Anda menginap di Pakubuwono Edhotel (SMKN 30 Jakarta).
          </p>
          <button class="btn btn-gold btn-sm" onclick="openReviewModal()">
            <i class="fa-solid fa-pen"></i> Tulis Ulasan Pertama
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = reviews.map(r => {
      // Initials for avatar
      const initials = (r.reviewer_name || 'Tamu')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0].toUpperCase())
        .join('');

      // Stars
      const starIcons = Array.from({ length: 5 }, (_, idx) => 
        `<i class="fa-${idx < r.rating ? 'solid' : 'regular'} fa-star"></i>`
      ).join('');

      // Date format
      const dateFormatted = new Date(r.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // Is author
      const isMyReview = state.user && state.user.id === r.user_id;

      return `
        <div class="review-card">
          <div class="review-header-row">
            <div class="review-stars">${starIcons}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${r.room_type_name ? `<span class="review-badge-room"><i class="fa-solid fa-bed"></i> ${r.room_type_name}</span>` : ''}
              ${isMyReview ? `
                <button class="review-delete-btn" onclick="handleDeleteReview('${r.id}')" title="Hapus Ulasan Anda">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              ` : ''}
            </div>
          </div>
          <p class="review-quote">"${escapeHtml(r.comment || '')}"</p>
          <div class="reviewer-info">
            <div class="reviewer-avatar">${initials}</div>
            <div style="flex: 1;">
              <div class="reviewer-name">${escapeHtml(r.reviewer_name || 'Tamu')}</div>
              <div class="reviewer-role">
                <span>Verified Guest</span> • <span class="review-date">${dateFormatted}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error fetching reviews:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--accent-rose); padding: 30px;">
        Gagal memuat ulasan. Silakan muat ulang halaman.
      </div>
    `;
  }
}

/**
 * Membuka Modal Review & Rating
 */
async function openReviewModal(bookingId = '', bookingCode = '', roomTypeName = '') {
  if (!state.token || !state.user) {
    showToast('Silakan masuk ke akun Anda terlebih dahulu untuk memberikan ulasan & rating hotel.', 'error');
    openAuthModal('login');
    return;
  }

  if (state.user.status === 'blacklisted') {
    showToast('Akses ditolak: Akun Anda sedang dalam daftar hitam (blacklist).', 'error');
    return;
  }

  // Reset form
  selectStarRating(5);
  const commentInput = document.getElementById('reviewCommentText');
  if (commentInput) commentInput.value = '';

  const hiddenBookingId = document.getElementById('reviewBookingId');
  const noticeBox = document.getElementById('reviewBookingNotice');
  const noticeText = document.getElementById('reviewBookingNoticeText');
  const selectGroup = document.getElementById('reviewBookingSelectGroup');
  const selectDropdown = document.getElementById('reviewBookingSelect');

  if (bookingId) {
    // Mode booking tertentu dari riwayat
    if (hiddenBookingId) hiddenBookingId.value = bookingId;
    if (noticeBox) {
      noticeBox.style.display = 'block';
      noticeText.innerHTML = `Mengulas reservasi <strong>#${bookingCode}</strong> — Kamar: <strong>${roomTypeName}</strong>`;
    }
    if (selectGroup) selectGroup.style.display = 'none';
  } else {
    // Mode umum / dari tombol ulasan utama
    if (hiddenBookingId) hiddenBookingId.value = '';
    if (noticeBox) noticeBox.style.display = 'none';
    if (selectGroup) selectGroup.style.display = 'block';

    // Populate dropdown with user bookings
    if (selectDropdown) {
      selectDropdown.innerHTML = '<option value="">Ulasan Umum Hotel & Keramahan Staf</option>';
      try {
        const res = await fetch(`${API_BASE}/bookings/my-bookings`, {
          headers: { 'Authorization': `Bearer ${state.token}` },
        });
        if (res.ok) {
          const d = await res.json();
          const bookings = d.data.bookings || [];
          bookings.forEach(b => {
            if (!b.review_id && b.booking_status !== 'cancelled') {
              const opt = document.createElement('option');
              opt.value = b.id;
              opt.textContent = `Reservasi #${b.booking_code} (${b.room_type_name} - #${b.room_number})`;
              selectDropdown.appendChild(opt);
            }
          });
        }
      } catch (e) {
        console.warn('Could not fetch user bookings for review dropdown', e);
      }
    }
  }

  openModal('reviewModal');
}

/**
 * Handle perubahan pilihan reservasi pada dropdown modal
 */
function onReviewBookingSelectChange() {
  const selectDropdown = document.getElementById('reviewBookingSelect');
  const hiddenBookingId = document.getElementById('reviewBookingId');
  if (selectDropdown && hiddenBookingId) {
    hiddenBookingId.value = selectDropdown.value;
  }
}

/**
 * Memilih nilai bintang (1 - 5)
 */
function selectStarRating(rating) {
  const hiddenVal = document.getElementById('reviewRatingValue');
  const label = document.getElementById('starRatingLabel');
  if (hiddenVal) hiddenVal.value = rating;
  if (label) label.textContent = RATING_LABELS[rating] || `${rating} Bintang`;

  updateStarElements(rating);
}

/**
 * Preview hover bintang
 */
function hoverStarRating(rating) {
  updateStarElements(rating);
}

/**
 * Reset preview bintang kembali ke nilai yang dipilih
 */
function resetStarRatingHover() {
  const hiddenVal = document.getElementById('reviewRatingValue');
  const current = hiddenVal ? parseInt(hiddenVal.value, 10) : 5;
  updateStarElements(current);
}

function updateStarElements(rating) {
  const stars = document.querySelectorAll('#starRatingContainer .star-btn');
  stars.forEach(star => {
    const starRating = parseInt(star.getAttribute('data-rating'), 10);
    if (starRating <= rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

/**
 * Submit Ulasan & Rating ke API
 */
async function handleReviewSubmit(event) {
  event.preventDefault();

  if (!state.token) {
    showToast('Sesi Anda telah berakhir, silakan login kembali.', 'error');
    openAuthModal('login');
    return;
  }

  const ratingVal = parseInt(document.getElementById('reviewRatingValue')?.value, 10) || 5;
  const commentVal = document.getElementById('reviewCommentText')?.value?.trim();
  const bookingIdVal = document.getElementById('reviewBookingId')?.value?.trim() || null;
  const submitBtn = document.getElementById('btnSubmitReview');

  if (!commentVal || commentVal.length < 3) {
    showToast('Harap tulis komentar Anda minimal 3 karakter.', 'error');
    return;
  }

  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
      },
      body: JSON.stringify({
        rating: ratingVal,
        comment: commentVal,
        booking_id: bookingIdVal,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Gagal mengirim ulasan');
    }

    showToast(data.message || '⭐ Terima kasih! Ulasan dan rating Anda berhasil disimpan.', 'success');
    closeModal('reviewModal');

    // Refresh review section on homepage
    fetchHotelReviews();

    // If my bookings modal is open, refresh it so the reviewed badge is displayed
    const myBookingsModal = document.getElementById('myBookingsModal');
    if (myBookingsModal && myBookingsModal.classList.contains('active')) {
      openMyBookingsModal();
    }

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

/**
 * Menghapus Ulasan Milik Sendiri
 */
async function handleDeleteReview(reviewId) {
  if (!confirm('Apakah Anda yakin ingin menghapus ulasan ini?')) return;

  try {
    const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menghapus ulasan.');

    showToast(data.message || 'Ulasan berhasil dihapus.', 'success');
    fetchHotelReviews();

  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Utility escape HTML
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
