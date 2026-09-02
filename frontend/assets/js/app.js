// ============================================================
// 🏨 LUXURY HOTEL & RESORT - MASTER APPLICATION JAVASCRIPT
// Frontend Controller, API Client, Live Search & Booking Engine
// ============================================================

// Deteksi otomatis URL Backend API
const getApiBase = () => {
  // Jika dibuka lewat Live Server (port 5500 dsb) atau file protocol, arahkan ke backend di http://localhost:5000/api/v1
  if (
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000'))
  ) {
    return 'http://localhost:5000/api/v1';
  }
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
  updateAuthUI();
  fetchRooms();
});

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
 * Memperbarui Tampilan Navbar berdasarkan status login user
 */
function updateAuthUI() {
  const navAuthArea = document.getElementById('navAuthArea');
  if (!navAuthArea) return;

  if (state.token && state.user) {
    const initials = state.user.full_name
      ? state.user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'G';

    const isAdmin = state.user.role === 'admin';
    const adminBtn = isAdmin
      ? `<a href="admin.html" class="btn btn-gold btn-sm" style="box-shadow: 0 0 10px rgba(197, 160, 89, 0.4);" title="Buka Dashboard Admin"><i class="fa-solid fa-crown"></i> Admin Portal</a>`
      : '';

    navAuthArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        ${adminBtn}
        <button class="btn btn-glass btn-sm" onclick="openMyBookingsModal()">
          <i class="fa-solid fa-receipt text-gold"></i> Reservasi Saya
        </button>
        <div class="user-badge" onclick="toggleUserMenu()" id="userBadgeBtn">
          <div class="user-avatar">${initials}</div>
          <span style="font-weight: 600; font-size: 0.9rem;">${state.user.full_name.split(' ')[0]}</span>
          <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem; color: var(--gold-primary);"></i>
        </div>
        <button class="btn btn-outline-gold btn-sm" onclick="handleLogout()" title="Keluar">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    `;
  } else {
    navAuthArea.innerHTML = `
      <button class="btn btn-outline-gold btn-sm" onclick="openAuthModal('login')">
        <i class="fa-solid fa-user-lock"></i> Masuk / Daftar
      </button>
    `;
  }
}

function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  openModal('authModal');
}

function switchAuthTab(tab) {
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');
  const modalTitle = document.getElementById('authModalTitle');

  if (tab === 'login') {
    tabLoginBtn.classList.add('active');
    tabRegBtn.classList.remove('active');
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
    modalTitle.innerText = 'Masuk ke Akun Anda';
  } else {
    tabRegBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    regForm.style.display = 'block';
    loginForm.style.display = 'none';
    modalTitle.innerText = 'Daftar Akun Tamu Baru';
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
  state.token = null;
  state.user = null;
  localStorage.removeItem('luxury_token');
  localStorage.removeItem('luxury_user');
  showToast('Anda telah keluar.', 'success');
  updateAuthUI();
}

// ============================================================
// 4. ROOMS CATALOG & LIVE AVAILABILITY SEARCH
// ============================================================

/**
 * Mengambil katalog seluruh tipe kamar dari backend
 */
async function fetchRooms() {
  const container = document.getElementById('roomsContainer');

  try {
    const res = await fetch(`${API_BASE}/rooms`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    state.rooms = data.data.room_types;
    renderRoomCards(state.rooms);
  } catch (err) {
    console.error('Fetch rooms error:', err);
    container.innerHTML = `
      <div style="text-align: center; grid-column: 1/-1; padding: 40px;">
        <i class="fa-solid fa-triangle-exclamation text-gold" style="font-size: 2rem;"></i>
        <p style="margin-top: 12px; color: var(--text-secondary);">Gagal memuat katalog kamar: ${err.message}</p>
        <button class="btn btn-outline-gold btn-sm" onclick="fetchRooms()" style="margin-top: 16px;">Coba Lagi</button>
      </div>
    `;
  }
}

/**
 * Merender daftar kartu kamar ke dalam DOM
 */
function renderRoomCards(rooms, isSearch = false, searchQuery = null) {
  const container = document.getElementById('roomsContainer');
  const subtitle = document.getElementById('roomsSubtitle');

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

  if (isSearch && searchQuery) {
    subtitle.innerHTML = `Menampilkan <strong>${rooms.length} tipe kamar</strong> yang tersedia untuk periode <strong>${searchQuery.check_in} s/d ${searchQuery.check_out}</strong> (${searchQuery.total_nights} malam). Rincian termasuk <strong>Pajak Hotel 12%</strong>.`;
  } else {
    subtitle.innerText = 'Pilihan akomodasi mewah dengan fasilitas modern berstandar internasional dan pemandangan luar biasa.';
  }

  container.innerHTML = rooms.map(room => {
    const amenities = Array.isArray(room.amenities) ? room.amenities : [];
    const rating = room.average_rating || 5.0;
    const availableCount = room.available_count !== undefined ? room.available_count : room.available_rooms;

    let priceDisplayHtml = '';
    if (room.pricing_breakdown) {
      priceDisplayHtml = `
        <div class="room-price">
          <span class="price-amount">Rp ${Number(room.pricing_breakdown.total_price).toLocaleString('id-ID')}</span>
          <span class="price-unit">Total (${room.pricing_breakdown.total_nights} malam + Pajak 12%)</span>
        </div>
      `;
    } else {
      priceDisplayHtml = `
        <div class="room-price">
          <span class="price-amount">Rp ${Number(room.base_price).toLocaleString('id-ID')}</span>
          <span class="price-unit">/ malam (belum termasuk PPN 12%)</span>
        </div>
      `;
    }

    return `
      <div class="room-card">
        <div class="room-media">
          <img src="${room.image_url}" alt="${room.name}" class="room-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'">
          <span class="room-badge"><i class="fa-solid fa-users"></i> Kapasitas ${room.capacity} Tamu</span>
          <span class="room-rating"><i class="fa-solid fa-star"></i> ${rating}</span>
        </div>

        <div class="room-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h3 class="room-title">${room.name}</h3>
            <span style="font-size: 0.75rem; color: ${availableCount > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight: 600; background: rgba(0,0,0,0.4); padding: 2px 8px; border-radius: 4px;">
              ${availableCount > 0 ? `${availableCount} Unit Tersedia` : 'Penuh'}
            </span>
          </div>

          <p class="room-desc">${room.description || 'Nikmati kemewahan dan kenyamanan maksimal.'}</p>

          <div class="room-amenities">
            ${amenities.slice(0, 4).map(a => `<span class="amenity-chip"><i class="fa-solid fa-check text-gold"></i> ${a}</span>`).join('')}
          </div>

          <div class="room-footer">
            ${priceDisplayHtml}
            <button class="btn btn-gold btn-sm" onclick="openBookingModal('${room.id}')" ${availableCount === 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-calendar-check"></i> Pesan
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

  const imageUrl = room.image_url && (room.image_url.startsWith('http') || room.image_url.startsWith('/'))
    ? room.image_url
    : 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

  // Isi summary room di modal
  const summaryBox = document.getElementById('bookingRoomSummary');
  summaryBox.innerHTML = `
    <img src="${imageUrl}" alt="${room.name}" style="width: 90px; height: 68px; object-fit: cover; border-radius: 8px; border: 1px solid var(--gold-border);" onerror="this.src='https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'">
    <div>
      <h4 style="font-size: 1.15rem; color: var(--gold-light); font-weight: 700; margin-bottom: 4px;">${room.name}</h4>
      <p style="font-size: 0.85rem; color: var(--text-secondary);"><i class="fa-solid fa-user-group text-gold"></i> Maks. ${room.capacity} Tamu • <span style="color: var(--gold-primary); font-weight: 600;">Rp ${Number(room.base_price).toLocaleString('id-ID')}</span> / malam</p>
    </div>
  `;

  document.getElementById('bookRoomTypeId').value = room.id;
  document.getElementById('bookCheckIn').value = state.searchParams.check_in || document.getElementById('searchCheckIn').value;
  document.getElementById('bookCheckOut').value = state.searchParams.check_out || document.getElementById('searchCheckOut').value;
  document.getElementById('bookGuestCount').value = state.searchParams.guests || 2;

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

  const basePrice = Number(state.selectedRoom.base_price);
  const subtotal = basePrice * nights;
  const taxAmount = Math.round(subtotal * TAX_RATE); // 12% Pajak
  const totalPrice = subtotal + taxAmount;

  document.getElementById('calcBasePrice').innerText = `Rp ${basePrice.toLocaleString('id-ID')}`;
  document.getElementById('calcNights').innerText = `${nights} Malam`;
  document.getElementById('calcSubtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
  document.getElementById('calcTax').innerText = `Rp ${taxAmount.toLocaleString('id-ID')} (12%)`;
  document.getElementById('calcTotal').innerText = `Rp ${totalPrice.toLocaleString('id-ID')}`;
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
  const special_requests = document.getElementById('bookSpecialRequests').value.trim();
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
 * Membuka Modal Pembayaran
 */
function openPaymentModal(bookingData) {
  const { booking, pricing_breakdown, payment } = bookingData;
  state.activeBooking = bookingData;

  const detailsArea = document.getElementById('paymentDetailsArea');
  detailsArea.innerHTML = `
    <span class="section-tag">Tagihan Reservasi</span>
    <h3 class="font-serif" style="font-size: 1.5rem; margin-bottom: 4px;">Kode: ${booking.booking_code}</h3>
    <p style="color: var(--text-secondary); font-size: 0.9rem;">${booking.room_type_name} • Kamar #${booking.room_number} (Lt. ${booking.floor})</p>
    <div style="font-size: 1.8rem; font-weight: 700; color: var(--gold-light); margin: 12px 0;">
      Rp ${Number(pricing_breakdown.total_price).toLocaleString('id-ID')}
    </div>
    <p style="font-size: 0.8rem; color: var(--text-muted);">Termasuk PPN 12%: Rp ${Number(pricing_breakdown.tax_amount).toLocaleString('id-ID')}</p>
  `;

  renderPaymentInstructions();
  openModal('paymentModal');
}

/**
 * Render Instruksi Pembayaran (VA / QRIS / Kartu)
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
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=LUXURY-HOTEL-PAYMENT" style="margin: 0 auto; border-radius: 8px; border: 2px solid var(--gold-border);">
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
      <p style="font-size: 0.85rem; color: var(--text-secondary);">Silakan lakukan pelunasan tunai di Meja Resepsionis saat tiba di hotel.</p>
    `;
  }
}

/**
 * Handle Eksekusi Pembayaran
 */
async function handleProcessPayment() {
  if (!state.activeBooking) return;

  const bookingId = state.activeBooking.booking.id;
  const payment_method = document.getElementById('paymentMethodSelect').value;
  const payBtn = document.getElementById('confirmPayBtn');

  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mengonfirmasi Pembayaran...`;

  try {
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
    showToast('🎉 Pembayaran Berhasil! E-Voucher telah diterbitkan.', 'success');

    // Buka E-Voucher
    openVoucherModal(bookingId);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    payBtn.disabled = false;
    payBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Konfirmasi Pembayaran Sekarang`;
  }
}

/**
 * Menampilkan E-Voucher Hotel Digital & Printable
 */
async function openVoucherModal(bookingIdOrCode) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingIdOrCode}`, {
      headers: { 'Authorization': `Bearer ${state.token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const b = data.data.booking;
    const p = data.data.pricing_breakdown;
    state.activeVoucherBookingId = b.id;

    const voucherCancelBtn = document.getElementById('voucherCancelBtn');
    if (voucherCancelBtn) {
      // Sembunyikan tombol batalkan jika sudah cancelled atau completed
      if (b.booking_status === 'cancelled' || b.booking_status === 'completed' || b.booking_status === 'checked_out') {
        voucherCancelBtn.style.display = 'none';
      } else {
        voucherCancelBtn.style.display = 'inline-block';
      }
    }

    let statusBadgeColor = '#10b981';
    if (b.booking_status === 'pending') statusBadgeColor = '#f59e0b';
    if (b.booking_status === 'cancelled') statusBadgeColor = '#ef4444';

    const voucherArea = document.getElementById('voucherPrintArea');
    voucherArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h2 style="font-family: 'Playfair Display', serif; font-size: 1.8rem; margin: 0; color: #070a12; letter-spacing: 2px;">LUXURY</h2>
          <span style="font-size: 0.75rem; letter-spacing: 3px; color: #c5a059; font-weight: 700;">HOTEL & RESORT</span>
        </div>
        <div style="text-align: right;">
          <span style="background: ${statusBadgeColor}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">
            ${b.booking_status}
          </span>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">Kode: <strong>${b.booking_code}</strong></p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <p style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Nama Tamu</p>
          <h4 style="font-size: 1.1rem; color: #0f172a;">${b.guest_name}</h4>
          <p style="font-size: 0.85rem; color: #475569;">${b.guest_email} • ${b.guest_phone || '-'}</p>
        </div>
        <div>
          <p style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Akomodasi</p>
          <h4 style="font-size: 1.1rem; color: #0f172a;">${b.room_type_name}</h4>
          <p style="font-size: 0.85rem; color: #475569;">Nomor Kamar: <strong>#${b.room_number}</strong> (Lantai ${b.floor})</p>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; text-align: center;">
        <div>
          <span style="font-size: 0.75rem; color: #64748b;">CHECK-IN</span>
          <p style="font-weight: 700; color: #0f172a; margin-top: 2px;">${b.check_in_date}</p>
        </div>
        <div>
          <span style="font-size: 0.75rem; color: #64748b;">CHECK-OUT</span>
          <p style="font-weight: 700; color: #0f172a; margin-top: 2px;">${b.check_out_date}</p>
        </div>
        <div>
          <span style="font-size: 0.75rem; color: #64748b;">DURASI</span>
          <p style="font-weight: 700; color: #0f172a; margin-top: 2px;">${b.total_nights} Malam</p>
        </div>
      </div>

      <div style="border-top: 1px dashed #cbd5e1; padding-top: 14px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; color: #475569;">
          <span>Subtotal (${b.total_nights} Malam)</span>
          <span>Rp ${Number(p.subtotal).toLocaleString('id-ID')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; color: #475569;">
          <span>Pajak & Layanan Hotel (12%)</span>
          <span>Rp ${Number(p.tax_amount).toLocaleString('id-ID')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          <span>TOTAL DIBAYAR</span>
          <span style="color: #c5a059;">Rp ${Number(p.total_price).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #94a3b8;">
        <span>Metode: ${b.payment_method || 'Virtual Account'} • Status: ${b.payment_status || 'PAID'}</span>
        <span>Dicetak pada: ${new Date().toLocaleDateString('id-ID')}</span>
      </div>
    `;

    openModal('voucherModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Handle Cancel Booking from Payment Modal
 */
function handleCancelCurrentBooking() {
  if (!state.activeBooking || !state.activeBooking.booking) return;
  handleCancelBooking(state.activeBooking.booking.id);
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
 * Membuka Modal Riwayat Pemesanan Tamu
 */
async function openMyBookingsModal() {
  if (!state.token || !state.user) {
    openAuthModal('login');
    return;
  }

  const listContainer = document.getElementById('myBookingsList');
  listContainer.innerHTML = `<div style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin text-gold"></i> Memuat riwayat...</div>`;
  openModal('myBookingsModal');

  try {
    const res = await fetch(`${API_BASE}/bookings/my-bookings`, {
      headers: { 'Authorization': `Bearer ${state.token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const bookings = data.data.bookings;

    if (bookings.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <i class="fa-solid fa-calendar-xmark text-gold" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
          <p style="color: var(--text-secondary);">Anda belum memiliki riwayat reservasi.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = bookings.map(b => {
      let badgeClass = 'var(--accent-amber)';
      if (b.booking_status === 'confirmed' || b.booking_status === 'checked_in') badgeClass = 'var(--accent-emerald)';
      if (b.booking_status === 'cancelled') badgeClass = 'var(--accent-rose)';

      const isCancellable = b.booking_status === 'pending' || b.booking_status === 'confirmed';

      return `
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--gold-border); border-radius: var(--radius-sm); padding: 18px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: var(--gold-light); font-size: 1.05rem;">${b.booking_code}</span>
            <span style="font-size: 0.75rem; font-weight: 700; color: #fff; background: ${badgeClass}; padding: 2px 10px; border-radius: 12px; text-transform: uppercase;">
              ${b.booking_status}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; color: var(--text-secondary);">
            <div><strong>Kamar:</strong> ${b.room_type_name} (#${b.room_number})</div>
            <div><strong>Durasi:</strong> ${b.total_nights} Malam</div>
            <div><strong>Check-In:</strong> ${b.check_in_date}</div>
            <div><strong>Check-Out:</strong> ${b.check_out_date}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 8px;">
            <span style="font-weight: 700; color: var(--gold-primary);">Rp ${Number(b.total_price).toLocaleString('id-ID')} (Inc. Tax 12%)</span>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline-gold btn-sm" onclick="openVoucherModal('${b.id}')">
                <i class="fa-solid fa-file-invoice"></i> E-Voucher
              </button>
              ${b.booking_status === 'pending' ? `
                <button class="btn btn-gold btn-sm" onclick="openPaymentModal({ booking: { id: '${b.id}', booking_code: '${b.booking_code}', room_type_name: '${b.room_type_name}', room_number: '${b.room_number}', floor: 1 }, pricing_breakdown: { total_price: ${b.total_price}, tax_amount: Math.round(${b.total_price} * 0.12 / 1.12) }, payment: { status: 'unpaid' } })">
                  Bayar
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
  } catch (err) {
    listContainer.innerHTML = `<p style="color: var(--accent-rose); text-align: center;">${err.message}</p>`;
  }
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
