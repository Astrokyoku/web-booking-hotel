// ============================================================
// 🏨 LUXURY HOTEL & RESORT - ADMIN CONTROLLER JAVASCRIPT
// Dashboard Management, Live Booking Operations & Inventory
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

// Admin State
const adminState = {
  token: localStorage.getItem('luxury_token') || null,
  user: JSON.parse(localStorage.getItem('luxury_user') || 'null'),
  currentTab: 'dashboard',
  roomTypes: [],
  allRooms: [],
  allBookings: [],
};

// ============================================================
// 1. INITIALIZATION & AUTH GUARD
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  checkAdminAuth();
});

function initClock() {
  const clockEl = document.getElementById('currentClockDisplay');
  const update = () => {
    const now = new Date();
    if (clockEl) {
      clockEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} • ${now.toLocaleTimeString('id-ID')}`;
    }
  };
  update();
  setInterval(update, 1000);
}

/**
 * Memeriksa apakah user yang sedang aktif memiliki role 'admin'
 */
function checkAdminAuth() {
  if (!adminState.token || !adminState.user || adminState.user.role !== 'admin') {
    openAdminModal('adminLoginGateModal');
  } else {
    closeAdminModal('adminLoginGateModal');
    updateAdminProfileUI();
    loadDashboardStats();
  }
}

function updateAdminProfileUI() {
  const nameEl = document.getElementById('adminDisplayName');
  const avatarEl = document.getElementById('adminAvatarInitials');
  const roleEl = document.getElementById('adminRoleName');

  if (adminState.user) {
    if (nameEl) nameEl.innerText = adminState.user.full_name || 'Admin';
    if (avatarEl) {
      avatarEl.innerText = adminState.user.full_name
        ? adminState.user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'AD';
    }
    if (roleEl) roleEl.innerText = (adminState.user.role || 'ADMIN').toUpperCase();
  }
}

/**
 * Handle Login khusus Admin
 */
async function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const submitBtn = document.getElementById('adminLoginSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memverifikasi...`;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login gagal.');

    if (data.data.user.role !== 'admin') {
      throw new Error('Akses ditolak: Akun ini bukan akun Administrator.');
    }

    adminState.token = data.data.token;
    adminState.user = data.data.user;

    localStorage.setItem('luxury_token', adminState.token);
    localStorage.setItem('luxury_user', JSON.stringify(adminState.user));

    showToast(`Selamat datang di Admin Portal, ${adminState.user.full_name}! 👋`, 'success');
    closeAdminModal('adminLoginGateModal');
    updateAdminProfileUI();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Masuk Admin`;
  }
}

function handleAdminLogout() {
  if (confirm('Apakah Anda yakin ingin keluar dari Admin Portal?')) {
    localStorage.removeItem('luxury_token');
    localStorage.removeItem('luxury_user');
    adminState.token = null;
    adminState.user = null;
    showToast('Anda telah keluar.', 'success');
    openAdminModal('adminLoginGateModal');
  }
}

// ============================================================
// 2. TAB SWITCHER
// ============================================================
function switchAdminTab(tabId) {
  adminState.currentTab = tabId;

  // Sidebar item active state
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  const activeMenu = document.getElementById(`menu-${tabId}`);
  if (activeMenu) activeMenu.classList.add('active');

  // Tab Panes
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  const activePane = document.getElementById(`pane-${tabId}`);
  if (activePane) activePane.classList.add('active');

  // Title update
  const titles = {
    dashboard: { title: 'Dashboard & Analitik', sub: 'Pantau performa reservasi, okupansi kamar, dan revenue hotel secara real-time.' },
    bookings: { title: 'Manajemen Reservasi Kamar', sub: 'Kelola status tamu (Check-in, Check-out, Konfirmasi, Pembatalan) secara real-time.' },
    restaurant_bookings: { title: 'Reservasi Andrawina Restaurant', sub: 'Kelola pemesanan meja, kedatangan tamu, dan verifikasi pembayaran deposit restoran.' },
    venue_bookings: { title: 'Reservasi Ballroom & MICE (Lt. 2)', sub: 'Kelola pemesanan ballroom, ruang rapat, jadwal event, dan verifikasi pembayaran MICE.' },
    rooms: { title: 'Inventori Kamar', sub: 'Pantau ketersediaan kamar, kamar terisi, dan atur status pemeliharaan (maintenance).' },
    guests: { title: 'Direktori Tamu', sub: 'Daftar seluruh tamu yang memiliki akun di Pakubuwono Edhotel — SMKN 30 Jakarta.' },
    reviews: { title: 'Ulasan & Rating Tamu', sub: 'Pantau nilai kepuasan tamu dan kelola seluruh ulasan hotel.' },
  };

  if (titles[tabId]) {
    document.getElementById('topbarHeaderTitle').innerText = titles[tabId].title;
    document.getElementById('topbarSubTitle').innerText = titles[tabId].sub;
  }

  // Fetch data sesuai tab
  if (tabId === 'dashboard') loadDashboardStats();
  else if (tabId === 'bookings') loadBookings();
  else if (tabId === 'restaurant_bookings') loadRestaurantBookings();
  else if (tabId === 'venue_bookings') loadVenueBookings();
  else if (tabId === 'rooms') loadRooms();
  else if (tabId === 'guests') loadGuests();
  else if (tabId === 'reviews') loadAdminReviews();
}

function refreshCurrentTab() {
  switchAdminTab(adminState.currentTab);
  showToast('Data berhasil diperbarui.', 'success');
}

// ============================================================
// 3. TAB 1: DASHBOARD STATS
// ============================================================
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const s = data.data;

    // Update KPI
    document.getElementById('kpiTotalRevenue').innerText = `Rp ${Number(s.financials.total_revenue).toLocaleString('id-ID')}`;
    document.getElementById('kpiOccupancyRate').innerText = `${s.rooms.occupancy_rate_percent}%`;
    document.getElementById('kpiOccupancyRatio').innerText = `${s.rooms.occupied} dari ${s.rooms.total} kamar terisi (${s.rooms.available} kosong)`;
    document.getElementById('kpiTotalBookings').innerText = s.bookings.total;
    document.getElementById('kpiPendingBookings').innerText = `${s.bookings.pending} booking pending konfirmasi`;
    document.getElementById('kpiTodayCheckins').innerText = s.bookings.today_checkins;
    document.getElementById('kpiTodayCheckouts').innerText = `${s.bookings.today_checkouts} check-out dijadwalkan`;

    if (s.reviews && document.getElementById('kpiAvgRating')) {
      document.getElementById('kpiAvgRating').innerText = `${s.reviews.average_rating} ★`;
      document.getElementById('kpiTotalReviews').innerText = `${s.reviews.total} ulasan tamu`;
    }

    // Render Recent Bookings Table
    const tbody = document.getElementById('recentBookingsTableBody');
    if (!s.recent_bookings || s.recent_bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-secondary);">Belum ada aktivitas reservasi.</td></tr>`;
      return;
    }

    tbody.innerHTML = s.recent_bookings.map(b => {
      let badgeClass = 'badge-pending';
      if (b.booking_status === 'confirmed') badgeClass = 'badge-confirmed';
      if (b.booking_status === 'checked_in') badgeClass = 'badge-checked_in';
      if (b.booking_status === 'completed') badgeClass = 'badge-completed';
      if (b.booking_status === 'cancelled') badgeClass = 'badge-cancelled';

      return `
        <tr>
          <td><strong style="color: var(--gold-light);">${b.booking_code}</strong></td>
          <td>
            <div style="font-weight: 600;">${b.guest_name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${b.guest_email}</div>
          </td>
          <td>${b.room_type_name}</td>
          <td><strong>#${b.room_number}</strong></td>
          <td>${b.check_in_date} <i class="fa-solid fa-arrow-right" style="font-size: 0.7rem; color: var(--gold-primary);"></i> ${b.check_out_date}</td>
          <td><strong>Rp ${Number(b.total_price).toLocaleString('id-ID')}</strong></td>
          <td><span class="badge ${badgeClass}">${b.booking_status}</span></td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn btn-outline-gold btn-sm" onclick="openAdminReservationForm('${b.id}')" title="Lihat & Cetak Official Reservation Form">
                <i class="fa-solid fa-file-contract"></i> Reservation Form
              </button>
              <button class="btn btn-outline-gold btn-sm" onclick="switchAdminTab('bookings')" title="Kelola di Tab Reservasi">
                <i class="fa-solid fa-sliders"></i> Kelola
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Stats error:', err);
    if (err.message.includes('Akses ditolak') || err.message.includes('Token')) {
      openAdminModal('adminLoginGateModal');
    }
  }
}

// ============================================================
// 4. TAB 2: MANAJEMEN RESERVASI
// ============================================================
async function loadBookings() {
  const tbody = document.getElementById('allBookingsTableBody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin text-gold"></i> Memuat data reservasi...</td></tr>`;

  const status = document.getElementById('bookingStatusFilter').value;
  const search = document.getElementById('bookingSearchInput').value.trim();

  try {
    let url = `${API_BASE}/admin/bookings?status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const bookings = data.data.bookings;
    adminState.allBookings = bookings;

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">Tidak ada reservasi yang sesuai dengan kriteria filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      let badgeClass = 'badge-pending';
      if (b.booking_status === 'confirmed') badgeClass = 'badge-confirmed';
      if (b.booking_status === 'checked_in') badgeClass = 'badge-checked_in';
      if (b.booking_status === 'completed') badgeClass = 'badge-completed';
      if (b.booking_status === 'cancelled') badgeClass = 'badge-cancelled';

      let payBadge = `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> BELUM BAYAR${b.payment_method === 'cash' ? ' (CASH)' : ''}</span>`;
      if (b.payment_status === 'paid') {
        payBadge = `<span class="badge badge-confirmed"><i class="fa-solid fa-check"></i> LUNAS (${(b.payment_method || 'transfer').toUpperCase()})</span>`;
      } else if (b.payment_status === 'waiting_verification') {
        payBadge = `<span class="badge badge-checked_in"><i class="fa-solid fa-hourglass-half"></i> MENUNGGU VERIFIKASI (${(b.payment_method || 'transfer').toUpperCase()})</span>`;
      }

      // Aksi Cepat berdasarkan status
      let actionButtons = '';
      if (b.booking_status === 'pending') {
        actionButtons = `
          <button class="btn btn-success btn-sm" onclick="handleUpdateBookingStatus('${b.id}', 'confirmed', '${b.booking_code}')" title="Verifikasi Pembayaran & Konfirmasi Reservasi">
            <i class="fa-solid fa-circle-check"></i> Verifikasi & Konfirmasi
          </button>
          <button class="btn btn-danger btn-sm" onclick="handleUpdateBookingStatus('${b.id}', 'cancelled', '${b.booking_code}')" title="Batalkan Reservasi">
            <i class="fa-solid fa-ban"></i> Batal
          </button>
        `;
      } else if (b.booking_status === 'confirmed') {
        actionButtons = `
          <button class="btn btn-info btn-sm" onclick="handleUpdateBookingStatus('${b.id}', 'checked_in', '${b.booking_code}')" title="Proses Tamu Masuk (Check-In)">
            <i class="fa-solid fa-key"></i> Check-In
          </button>
          <button class="btn btn-danger btn-sm" onclick="handleUpdateBookingStatus('${b.id}', 'cancelled', '${b.booking_code}')" title="Batalkan Reservasi">
            <i class="fa-solid fa-ban"></i> Batal
          </button>
        `;
      } else if (b.booking_status === 'checked_in') {
        actionButtons = `
          <button class="btn btn-success btn-sm" onclick="handleUpdateBookingStatus('${b.id}', 'completed', '${b.booking_code}')" title="Proses Tamu Keluar (Check-Out)">
            <i class="fa-solid fa-right-from-bracket"></i> Check-Out (Selesai)
          </button>
        `;
      } else {
        actionButtons = `<span style="font-size: 0.75rem; color: var(--text-muted);">Selesai / Dibatalkan</span>`;
      }

      return `
        <tr>
          <td><strong style="color: var(--gold-light); font-size: 0.95rem;">${b.booking_code}</strong></td>
          <td>
            <div style="font-weight: 700; color: #fff;">${b.guest_name}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${b.guest_email}</div>
            <div style="font-size: 0.75rem; color: var(--gold-light);"><i class="fa-solid fa-phone"></i> ${b.guest_phone || '-'}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${b.room_type_name}</div>
            <div style="font-size: 0.8rem; color: var(--gold-light);">Kamar #${b.room_number} (Lt. ${b.floor})</div>
          </td>
          <td>
            <div>${b.check_in_date} s/d ${b.check_out_date}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${b.total_nights} Malam</div>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--gold-primary);">Rp ${Number(b.total_price).toLocaleString('id-ID')}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Inc. Pajak 12%</div>
          </td>
          <td>${payBadge}</td>
          <td><span class="badge ${badgeClass}">${b.booking_status}</span></td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
              <button class="btn btn-outline-gold btn-sm" onclick="openAdminReservationForm('${b.id}')" title="Lihat & Cetak Official Reservation Form (Standar Edhotel)">
                <i class="fa-solid fa-file-contract"></i> Reservation Form
              </button>
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    showToast(err.message, 'error');
  }
}

let searchDebounceTimer;
function handleBookingSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadBookings();
  }, 400);
}

/**
 * Eksekusi update status booking
 */
async function handleUpdateBookingStatus(bookingId, newStatus, bookingCode) {
  const statusLabels = {
    confirmed: 'Konfirmasi Reservasi',
    checked_in: 'Check-In Tamu (Kamar akan di-set Occupied)',
    completed: 'Check-Out Tamu (Kamar akan di-set Available)',
    cancelled: 'Batalkan Reservasi (Kamar akan dilepaskan)',
  };

  if (!confirm(`Apakah Anda yakin ingin melakukan '${statusLabels[newStatus] || newStatus}' untuk kode booking ${bookingCode}?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(data.message, 'success');
    loadBookings();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 5. TAB 3: INVENTORI KAMAR
// ============================================================
async function loadRooms() {
  const container = document.getElementById('roomsInventoryContainer');
  container.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin text-gold" style="font-size: 2rem;"></i><p style="margin-top: 10px; color: var(--text-secondary);">Memuat inventori kamar...</p></div>`;

  try {
    const res = await fetch(`${API_BASE}/admin/rooms`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const rooms = data.data.rooms;
    adminState.allRooms = rooms;
    adminState.roomTypes = data.data.room_types;

    if (rooms.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 30px;">Belum ada kamar fisik terdaftar.</p>`;
      return;
    }

    // Kelompokkan kamar berdasarkan Lantai (Floor)
    const floorsMap = {};
    rooms.forEach(r => {
      const fl = r.floor || 1;
      if (!floorsMap[fl]) floorsMap[fl] = [];
      floorsMap[fl].push(r);
    });

    container.innerHTML = Object.keys(floorsMap).sort((a, b) => a - b).map(floorNum => {
      const floorRooms = floorsMap[floorNum];

      return `
        <div class="floor-section">
          <div class="floor-title">
            <i class="fa-solid fa-layer-group text-gold"></i> Lantai ${floorNum} (${floorRooms.length} Kamar)
          </div>
          <div class="rooms-grid">
            ${floorRooms.map(r => {
              let badgeClass = 'badge-available';
              if (r.room_status === 'occupied') badgeClass = 'badge-occupied';
              if (r.room_status === 'maintenance') badgeClass = 'badge-maintenance';
              if (r.room_status === 'cleaning') badgeClass = 'badge-cleaning';

              let occupantInfo = '';
              if (r.current_booking_code && r.current_guest_name) {
                occupantInfo = `
                  <div class="room-occupant">
                    <i class="fa-solid fa-user-check text-gold"></i> <strong>${r.current_guest_name.split(' ')[0]}</strong> (${r.current_booking_code})
                  </div>
                `;
              } else {
                occupantInfo = `<div class="room-occupant" style="color: var(--text-muted);"><i class="fa-regular fa-circle"></i> Tidak ada tamu aktif</div>`;
              }

              return `
                <div class="room-tile">
                  <div class="room-tile-header">
                    <span class="room-number-display">#${r.room_number}</span>
                    <span class="badge ${badgeClass}">${r.room_status}</span>
                  </div>

                  <div class="room-type-name">${r.room_type_name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Rp ${Number(r.base_price).toLocaleString('id-ID')} / malam</div>
                  
                  ${occupantInfo}

                  <div class="room-actions">
                    <select class="select-filter" style="width: 100%; font-size: 0.75rem; padding: 6px;" onchange="handleUpdateRoomStatus('${r.id}', this.value)">
                      <option value="" disabled selected>Ubah Status...</option>
                      <option value="available" ${r.room_status === 'available' ? 'disabled' : ''}>✅ Available</option>
                      <option value="occupied" ${r.room_status === 'occupied' ? 'disabled' : ''}>🔑 Occupied</option>
                      <option value="maintenance" ${r.room_status === 'maintenance' ? 'disabled' : ''}>🛠️ Maintenance</option>
                      <option value="cleaning" ${r.room_status === 'cleaning' ? 'disabled' : ''}>🧹 Cleaning</option>
                    </select>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Handle quick status update for physical room
 */
async function handleUpdateRoomStatus(roomId, newStatus) {
  if (!newStatus) return;

  try {
    const res = await fetch(`${API_BASE}/admin/rooms/${roomId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(data.message, 'success');
    loadRooms();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAddRoomModal() {
  const select = document.getElementById('newRoomTypeId');
  if (select && adminState.roomTypes.length > 0) {
    select.innerHTML = `<option value="">-- Pilih Tipe Kamar --</option>` +
      adminState.roomTypes.map(rt => `<option value="${rt.id}">${rt.name} (Rp ${Number(rt.base_price).toLocaleString('id-ID')})</option>`).join('');
  }
  openAdminModal('addRoomModal');
}

async function handleAddRoomSubmit(e) {
  e.preventDefault();
  const room_number = document.getElementById('newRoomNumber').value.trim();
  const room_type_id = document.getElementById('newRoomTypeId').value;
  const floor = document.getElementById('newRoomFloor').value;
  const status = document.getElementById('newRoomStatus').value;
  const submitBtn = document.getElementById('submitAddRoomBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;

  try {
    const res = await fetch(`${API_BASE}/admin/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`,
      },
      body: JSON.stringify({ room_number, room_type_id, floor, status }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(data.message, 'success');
    closeAdminModal('addRoomModal');
    document.getElementById('addRoomForm').reset();
    loadRooms();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Kamar`;
  }
}

// ============================================================
// 6. TAB 4: DIREKTORI TAMU
// ============================================================
async function loadGuests() {
  const tbody = document.getElementById('guestsTableBody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin text-gold"></i> Memuat data tamu...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/admin/guests`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const guests = data.data.guests;

    if (guests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">Belum ada tamu terdaftar.</td></tr>`;
      return;
    }

    tbody.innerHTML = guests.map(g => {
      const regDate = g.registered_at ? new Date(g.registered_at).toLocaleDateString('id-ID') : '-';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #fff;">${g.full_name}</div>
            <span style="font-size: 0.7rem; background: rgba(197, 160, 89, 0.15); color: var(--gold-light); padding: 2px 8px; border-radius: 4px;">GUEST</span>
          </td>
          <td><strong style="color: var(--text-primary);">${g.email}</strong></td>
          <td><i class="fa-solid fa-phone text-gold"></i> ${g.phone || '-'}</td>
          <td><span style="font-weight: 700; color: var(--gold-light);">${g.total_bookings}</span> Reservasi</td>
          <td><strong style="color: var(--gold-primary);">Rp ${Number(g.total_spent).toLocaleString('id-ID')}</strong></td>
          <td style="color: var(--text-muted);">${regDate}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 7. UTILITIES & MODAL CONTROLLERS
// ============================================================
function openAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

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
// 8. RESTAURANT BOOKINGS
// ============================================================
let allRestaurantBookings = [];

async function loadRestaurantBookings() {
  const tbody = document.getElementById('restaurantBookingsTableBody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin text-gold"></i> Memuat data reservasi restoran...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/admin/restaurant-bookings`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    allRestaurantBookings = data.data;
    renderRestaurantBookingsTable();
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 30px; color: var(--accent-rose);">${err.message}</td></tr>`;
    showToast('Gagal memuat reservasi restoran', 'error');
  }
}

function renderRestaurantBookingsTable() {
  const tbody = document.getElementById('restaurantBookingsTableBody');
  const filter = document.getElementById('restaurantBookingStatusFilter') ? document.getElementById('restaurantBookingStatusFilter').value : 'all';
  
  if (!tbody) return;
  
  let filtered = allRestaurantBookings;
  if (filter !== 'all') {
    filtered = filtered.filter(b => b.status === filter);
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: var(--text-secondary);">Tidak ada reservasi ditemukan.</td></tr>';
    return;
  }
  
  const statusColors = {
    'pending': 'var(--accent-amber)',
    'confirmed': 'var(--accent-emerald)',
    'completed': 'var(--text-secondary)',
    'cancelled': 'var(--accent-rose)'
  };
  
  tbody.innerHTML = filtered.map(b => {
    const statusColor = statusColors[b.status] || 'gray';
    const dateStr = new Date(b.reservation_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const sessionLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
    const sessionStr = sessionLabels[b.session_time] || b.session_time;
    const isPaid = b.payment_status === 'paid';
    const isWaiting = b.payment_status === 'waiting_verification';
    
    let payBadge = `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> BELUM BAYAR${b.payment_method === 'cash' ? ' (CASH)' : ''}</span>`;
    if (isPaid) {
      payBadge = `<span class="badge badge-confirmed"><i class="fa-solid fa-check"></i> LUNAS (${(b.payment_method || 'transfer').toUpperCase()})</span>`;
    } else if (isWaiting) {
      payBadge = `<span class="badge badge-checked_in"><i class="fa-solid fa-hourglass-half"></i> MENUNGGU VERIFIKASI (${(b.payment_method || 'transfer').toUpperCase()})</span>`;
    }

    let actionBtns = `
      <div style="display: flex; gap: 6px; align-items: center;">
        <button class="btn btn-outline-gold btn-sm" onclick="saveTableNumber('${b.id}')" title="Simpan Nomor Meja">
          <i class="fa-solid fa-save"></i>
        </button>
    `;

    if (!isPaid && b.status !== 'cancelled') {
      actionBtns += `
        <button class="btn btn-success btn-sm" onclick="handleVerifyRestaurantPayment('${b.id}', '${b.reservation_code}')" title="Verifikasi Pembayaran & Konfirmasi">
          <i class="fa-solid fa-circle-check"></i> Verifikasi Bayar
        </button>
      `;
    }

    if (b.status === 'pending') {
      actionBtns += `
        <button class="btn btn-danger btn-sm" onclick="updateRestaurantBookingStatus('${b.id}', 'cancelled')" title="Tolak Reservasi">
          <i class="fa-solid fa-circle-xmark"></i>
        </button>
      `;
    }

    actionBtns += `</div>`;

    return `
      <tr>
        <td style="font-family: monospace; font-weight: bold; color: var(--gold-light);">${b.reservation_code}</td>
        <td>
          <div style="font-weight: 600;">${b.guest_name}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.guest_email}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.guest_phone || '-'}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${dateStr}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Sesi: ${sessionStr}</div>
        </td>
        <td>${b.guest_count} Orang</td>
        <td style="font-weight: 600; color: var(--gold-primary);">Rp ${Number(b.total_price || 100000).toLocaleString('id-ID')}</td>
        <td>${payBadge}</td>
        <td>
          <input type="text" class="admin-input" style="width: 70px; padding: 4px; text-align: center;" 
            value="${b.table_number || ''}" id="tableNum-${b.id}" placeholder="Meja">
        </td>
        <td style="font-size: 0.85rem; max-width: 130px; white-space: normal;">${b.special_requests || '-'}</td>
        <td>
          <select class="select-filter" style="width: 125px; font-weight: bold; color: ${statusColor};" 
            onchange="updateRestaurantBookingStatus('${b.id}', this.value)">
            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>${actionBtns}</td>
      </tr>
    `;
  }).join('');
}

async function updateRestaurantBookingStatus(id, newStatus, paymentStatus) {
  if (!paymentStatus && !confirm(`Ubah status reservasi menjadi '${newStatus}'?`)) {
    loadRestaurantBookings();
    return;
  }
  
  const tableNum = document.getElementById(`tableNum-${id}`)?.value;
  const bodyPayload = { status: newStatus, table_number: tableNum };
  if (paymentStatus) {
    bodyPayload.payment_status = paymentStatus;
  }
  
  try {
    const res = await fetch(`${API_BASE}/admin/restaurant-bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify(bodyPayload)
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    showToast(data.message, 'success');
    loadRestaurantBookings();
  } catch (err) {
    showToast(err.message, 'error');
    loadRestaurantBookings();
  }
}

async function handleVerifyRestaurantPayment(id, code) {
  if (!confirm(`Konfirmasi verifikasi pembayaran deposit untuk kode meja ${code}? Status akan otomatis CONFIRMED.`)) {
    return;
  }
  await updateRestaurantBookingStatus(id, 'confirmed', 'paid');
}

async function saveTableNumber(id) {
  const tableNum = document.getElementById(`tableNum-${id}`).value;
  const booking = allRestaurantBookings.find(b => b.id === id);
  if (!booking) return;
  
  try {
    const res = await fetch(`${API_BASE}/admin/restaurant-bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify({ status: booking.status, table_number: tableNum })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    showToast('Nomor meja berhasil disimpan.', 'success');
    loadRestaurantBookings();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 8b. VENUE & BALLROOM BOOKINGS (MICE)
// ============================================================
let allVenueBookings = [];

async function loadVenueBookings() {
  const tbody = document.getElementById('venueBookingsTableBody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin text-gold"></i> Memuat data reservasi venue...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/admin/venue-bookings`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    allVenueBookings = data.data;
    renderVenueBookingsTable();
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--accent-rose);">${err.message}</td></tr>`;
    showToast('Gagal memuat reservasi venue', 'error');
  }
}

function renderVenueBookingsTable() {
  const tbody = document.getElementById('venueBookingsTableBody');
  const filter = document.getElementById('venueBookingStatusFilter') ? document.getElementById('venueBookingStatusFilter').value : 'all';
  
  if (!tbody) return;
  
  let filtered = allVenueBookings;
  if (filter !== 'all') {
    filtered = filtered.filter(b => b.status === filter);
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-secondary);">Tidak ada reservasi venue ditemukan.</td></tr>';
    return;
  }
  
  const statusColors = {
    'pending': 'var(--accent-amber)',
    'confirmed': 'var(--accent-emerald)',
    'completed': 'var(--text-secondary)',
    'cancelled': 'var(--accent-rose)'
  };
  
  tbody.innerHTML = filtered.map(b => {
    const statusColor = statusColors[b.status] || 'gray';
    const dateStr = new Date(b.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const durLabel = b.duration_type === 'full_day' ? 'Full Day (12 Jam)' : 'Half Day (6 Jam)';
    const isPaid = b.payment_status === 'paid';
    const isWaiting = b.payment_status === 'waiting_verification';
    
    let payBadge = `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> BELUM BAYAR${b.payment_method === 'cash' ? ' (CASH)' : ''}</span>`;
    if (isPaid) {
      payBadge = `<span class="badge badge-confirmed"><i class="fa-solid fa-check"></i> LUNAS (${(b.payment_method || 'transfer').toUpperCase()})</span>`;
    } else if (isWaiting) {
      payBadge = `<span class="badge badge-checked_in"><i class="fa-solid fa-hourglass-half"></i> MENUNGGU VERIFIKASI (${(b.payment_method || 'transfer').toUpperCase()})</span>`;
    }

    let actionBtns = `<div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">`;

    if (!isPaid && b.status !== 'cancelled') {
      actionBtns += `
        <button class="btn btn-success btn-sm" onclick="handleVerifyVenuePayment('${b.id}', '${b.venue_booking_code}')" title="Verifikasi Pembayaran & Konfirmasi">
          <i class="fa-solid fa-circle-check"></i> Verifikasi Bayar
        </button>
      `;
    }

    if (b.status === 'pending') {
      actionBtns += `
        <button class="btn btn-danger btn-sm" onclick="updateVenueBookingStatus('${b.id}', 'cancelled')" title="Tolak Reservasi">
          <i class="fa-solid fa-circle-xmark"></i> Tolak
        </button>
      `;
    }

    actionBtns += `</div>`;

    return `
      <tr>
        <td style="font-family: monospace; font-weight: bold; color: var(--gold-light);">${b.venue_booking_code}</td>
        <td>
          <div style="font-weight: 600;">${b.guest_name}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.guest_email}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${b.guest_phone || '-'}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--gold-light);">${b.venue_name || 'Grand Ballroom'}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: capitalize;">Layout: ${b.layout_type} (${b.attendee_count} Tamu)</div>
        </td>
        <td>
          <div style="font-weight: 600;">${dateStr}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${durLabel}</div>
        </td>
        <td style="font-weight: 700; color: var(--gold-primary);">Rp ${Number(b.total_price).toLocaleString('id-ID')}</td>
        <td>${payBadge}</td>
        <td>
          <select class="select-filter" style="width: 125px; font-weight: bold; color: ${statusColor};" 
            onchange="updateVenueBookingStatus('${b.id}', this.value)">
            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>${actionBtns}</td>
      </tr>
    `;
  }).join('');
}

async function updateVenueBookingStatus(id, newStatus, paymentStatus) {
  if (!paymentStatus && !confirm(`Ubah status reservasi venue menjadi '${newStatus}'?`)) {
    loadVenueBookings();
    return;
  }
  
  const bodyPayload = { status: newStatus };
  if (paymentStatus) {
    bodyPayload.payment_status = paymentStatus;
  }
  
  try {
    const res = await fetch(`${API_BASE}/admin/venue-bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify(bodyPayload)
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    showToast(data.message, 'success');
    loadVenueBookings();
  } catch (err) {
    showToast(err.message, 'error');
    loadVenueBookings();
  }
}

async function handleVerifyVenuePayment(id, code) {
  if (!confirm(`Konfirmasi verifikasi pembayaran untuk event ${code}? Status akan otomatis CONFIRMED.`)) {
    return;
  }
  await updateVenueBookingStatus(id, 'confirmed', 'paid');
}

// ============================================================
// 8. TAB 6: ULASAN & RATING TAMU (MODERASI ADMIN)
// ============================================================
let allAdminReviews = [];

async function loadAdminReviews() {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin text-gold"></i> Memuat data ulasan...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/admin/reviews`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    allAdminReviews = data.data.reviews || [];
    renderAdminReviewsTable(allAdminReviews);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-rose); padding: 20px;">Gagal memuat ulasan: ${err.message}</td></tr>`;
  }
}

function renderAdminReviewsTable(reviews) {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;
  if (!reviews || reviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-secondary);">Tidak ada ulasan tamu yang ditemukan.</td></tr>';
    return;
  }

  tbody.innerHTML = reviews.map(r => {
    const stars = Array.from({ length: 5 }, (_, i) => 
      `<i class="fa-${i < r.rating ? 'solid' : 'regular'} fa-star text-gold"></i>`
    ).join('');

    const dateStr = new Date(r.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const bookingBadge = r.booking_code
      ? `<span class="badge" style="background: rgba(212,175,55,0.15); color: var(--gold-light);"><i class="fa-solid fa-bed"></i> #${r.booking_code} (${r.room_type_name || 'Kamar'})</span>`
      : '<span style="color: var(--text-muted); font-size: 0.85rem;">Ulasan Umum Hotel</span>';

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: #fff;">${escapeHtml(r.guest_name || 'Tamu')}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.guest_email || '')}</div>
        </td>
        <td>
          <div style="font-size: 0.95rem; white-space: nowrap;">${stars}</div>
          <span style="font-size: 0.75rem; color: var(--gold-light); font-weight: 600;">${r.rating} / 5 Bintang</span>
        </td>
        <td style="max-width: 320px; line-height: 1.5; font-size: 0.9rem;">
          "${escapeHtml(r.comment || '')}"
        </td>
        <td>${bookingBadge}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${dateStr}</td>
        <td style="text-align: right;">
          <button class="btn btn-outline-danger btn-sm" onclick="handleAdminDeleteReview('${r.id}')" title="Hapus Ulasan (Moderasi)">
            <i class="fa-solid fa-trash-can"></i> Hapus
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function handleFilterReviews() {
  const ratingFilter = document.getElementById('filterRatingSelect')?.value;
  let filtered = [...allAdminReviews];

  if (ratingFilter && ratingFilter !== 'all') {
    filtered = filtered.filter(r => r.rating === parseInt(ratingFilter, 10));
  }

  renderAdminReviewsTable(filtered);
}

async function handleAdminDeleteReview(reviewId) {
  if (!confirm('Apakah Anda yakin ingin menghapus ulasan ini secara permanen dari sistem?')) return;

  try {
    const res = await fetch(`${API_BASE}/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(data.message || 'Ulasan berhasil dihapus oleh admin.', 'success');
    loadAdminReviews();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// 9. OFFICIAL RESERVATION FORM (STANDAR PAKUBUWONO EDHOTEL)
// ============================================================

function parseAdminReservationMeta(booking) {
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

  const adminName = adminState.user?.full_name || 'Admin Pakubuwono Edhotel';

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
    confirmed_by: parsed.confirmed_by || (isConfirmed ? adminName : ''),
    confirmed_date: parsed.confirmed_date || confirmedDateStr,
  };
}

function renderAdminOfficialReservationFormHTML(b, p) {
  const meta = parseAdminReservationMeta(b);
  const activeStatus = adminState.resFormOverrideStatus || meta.form_status;
  const activeResBy = adminState.resFormOverrideResBy || meta.res_by;
  const activeBed = adminState.resFormOverrideBed || meta.bed_type;

  const roomRows = [
    { label: 'Superior', matchKey: 'Superior Room', rateIdr: 785000, rateUsd: 50 },
    { label: 'Deluxe', matchKey: 'Deluxe Room', rateIdr: 1020000, rateUsd: 65 },
    { label: 'Executive', matchKey: 'Executive Room', rateIdr: 1255000, rateUsd: 80 },
    { label: 'Junior Suite', matchKey: 'Junior Suite Room', rateIdr: 1490000, rateUsd: 95 },
    { label: 'Suite', matchKey: 'Suite Room', rateIdr: 1725000, rateUsd: 110 },
    { label: 'Presedential', matchKey: 'Presidential Suite', rateIdr: 3925000, rateUsd: 250 },
  ];

  const resByOptions = ['Phone', 'Letter', 'Email', 'Personal', 'OTA', 'Others'];
  const dottedLineStyle = 'border-bottom: 1.5px dotted #1e293b; display: inline-block; padding: 0 6px 1px; font-weight: 600; color: #0f172a; min-height: 20px;';

  return `
    <div class="official-resform-sheet" style="font-family: 'Times New Roman', Georgia, serif; color: #000000; background: #ffffff; padding: 10px 14px; line-height: 1.45; font-size: 0.95rem;">
      <!-- 1. TOP HEADER -->
      <div style="display: grid; grid-template-columns: 190px 1fr 220px; align-items: center; margin-bottom: 18px;">
        <div style="text-align: center;">
          <img src="assets/images/logo-emblem.png" alt="Pakubuwono Edotel" style="height: 46px; width: auto; object-fit: contain; display: block; margin: 0 auto 2px;">
          <div style="font-family: 'Playfair Display', 'Times New Roman', serif; font-weight: 800; font-size: 1.02rem; letter-spacing: 1.5px; color: #b89146; line-height: 1.1;">PAKUBUWONO</div>
          <div style="font-size: 0.68rem; font-weight: 700; letter-spacing: 2px; color: #b89146; line-height: 1.15;">EDOTEL</div>
          <div style="font-size: 0.52rem; font-weight: 700; letter-spacing: 1.2px; color: #b89146;">SMKN 30 JAKARTA</div>
        </div>
        <div style="text-align: center;">
          <h2 style="font-family: 'Times New Roman', Georgia, serif; font-size: 1.5rem; font-weight: 400; letter-spacing: 1px; margin: 0; color: #000;">RESERVATION FORM</h2>
        </div>
        <div style="text-align: right; align-self: end; font-size: 0.92rem;">
          <span>Reservation No. : </span>
          <span style="${dottedLineStyle} min-width: 110px; text-align: center; font-family: monospace; font-size: 0.92rem;">${b.booking_code}</span>
        </div>
      </div>

      <!-- 2. THREE STATUS BOXES -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 14px 0 24px; padding: 0 6px;">
        ${['New Booking', 'Amandement', 'Cancellation'].map(st => {
          const isChecked = activeStatus === st;
          return `
            <div style="text-align: center; cursor: pointer; user-select: none;" onclick="toggleAdminResFormBox('status', '${st}')" title="Klik untuk memilih status ${st}">
              <div style="width: 124px; height: 32px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; color: #0f172a; background: ${isChecked ? 'rgba(197, 160, 89, 0.14)' : '#fff'};">
                ${isChecked ? '&#10003;' : ''}
              </div>
              <div style="font-size: 0.92rem; margin-top: 4px; color: #000;">${st}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- 3. GUEST NAME, PAX, ARRIVAL & DEPARTURE -->
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;">Name of Guest</span>
          <span style="margin-right: 6px;">:</span>
          <span style="${dottedLineStyle} flex: 1;">${b.guest_name} (Room #${b.room_number} - Floor ${b.floor})</span>
        </div>

        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;">Number of Person</span>
          <span style="margin-right: 6px;">:</span>
          <span style="${dottedLineStyle} width: 90px; text-align: center;">${b.guest_count || 2} Adult</span>
          <span style="margin: 0 4px; font-weight: 700;">/</span>
          <span style="${dottedLineStyle} width: 120px; text-align: center;">0 Child (${b.total_nights} Night${b.total_nights > 1 ? 's' : ''})</span>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr 0.9fr; gap: 12px; align-items: baseline; margin-top: 6px;">
          <div style="display: flex; align-items: baseline;">
            <span style="width: 90px; flex-shrink: 0;">Arrival</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${b.check_in_date}</span>
          </div>
          <div style="display: flex; align-items: baseline;">
            <span style="width: 78px; flex-shrink: 0;">Flight No.</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${meta.arr_flight}</span>
          </div>
          <div style="display: flex; align-items: baseline;">
            <span style="width: 48px; flex-shrink: 0;">ETA</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${meta.eta}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr 0.9fr; gap: 12px; align-items: baseline;">
          <div style="display: flex; align-items: baseline;">
            <span style="width: 90px; flex-shrink: 0;">Departure</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${b.check_out_date}</span>
          </div>
          <div style="display: flex; align-items: baseline;">
            <span style="width: 78px; flex-shrink: 0;">Flight No.</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${meta.dep_flight}</span>
          </div>
          <div style="display: flex; align-items: baseline;">
            <span style="width: 48px; flex-shrink: 0;">ETD</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${meta.etd}</span>
          </div>
        </div>
      </div>

      <!-- 4. TWO TABLES: RESERVATION BY & TYPE OF ROOM -->
      <div style="display: grid; grid-template-columns: 185px 1fr; gap: 24px; margin-bottom: 22px; align-items: start;">
        <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #000; font-size: 0.88rem;">
          <thead>
            <tr>
              <th colspan="2" style="border: 1px solid #000; padding: 4px 8px; text-align: center; font-weight: 600;">Reservation by</th>
            </tr>
          </thead>
          <tbody>
            ${resByOptions.map(opt => {
              const isChecked = activeResBy.toLowerCase() === opt.toLowerCase();
              return `
                <tr style="cursor: pointer;" onclick="toggleAdminResFormBox('resBy', '${opt}')" title="Klik untuk memilih ${opt}">
                  <td style="border: 1px solid #000; padding: 3px 8px; text-align: center; width: 76%;">${opt}</td>
                  <td style="border: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: 800; background: ${isChecked ? 'rgba(197, 160, 89, 0.16)' : '#fff'};">${isChecked ? '&#10003;' : ''}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #000; font-size: 0.88rem;">
          <thead>
            <tr>
              <th colspan="2" style="border: 1px solid #000; padding: 4px 8px; text-align: center; font-weight: 600;">Type of Room</th>
              <th style="border: 1px solid #000; padding: 4px 8px; text-align: center; font-weight: 600; width: 92px;">Bed Type</th>
              <th style="border: 1px solid #000; padding: 4px 8px; text-align: center; font-weight: 600;">Rate</th>
            </tr>
          </thead>
          <tbody>
            ${roomRows.map(r => {
              const isSelectedRoom = (b.room_type_name || '').toLowerCase() === r.matchKey.toLowerCase();
              const bedDisplay = isSelectedRoom
                ? `<span style="cursor:pointer;" onclick="toggleAdminResFormBox('bed', '${activeBed === 'TW' ? 'KS' : 'TW'}')" title="Klik untuk ganti TW/KS">
                     <strong style="${activeBed === 'TW' ? 'border: 1.5px solid #000; border-radius: 10px; padding: 0 4px; background: rgba(197,160,89,0.2);' : 'color: #64748b;'}">TW</strong>/<strong style="${activeBed === 'KS' ? 'border: 1.5px solid #000; border-radius: 10px; padding: 0 4px; background: rgba(197,160,89,0.2);' : 'color: #64748b;'}">KS</strong>
                   </span>`
                : 'TW/KS';

              const rateDisplay = isSelectedRoom
                ? `<strong>Rp ${r.rateIdr.toLocaleString('id-ID')} ($${r.rateUsd}) / night</strong>`
                : `<span style="color: #64748b; font-size: 0.8rem;">Rp ${r.rateIdr.toLocaleString('id-ID')} ($${r.rateUsd})</span>`;

              return `
                <tr style="background: ${isSelectedRoom ? 'rgba(197, 160, 89, 0.14)' : '#fff'};">
                  <td style="border: 1px solid #000; padding: 3px 10px; text-align: center; width: 34%; font-weight: ${isSelectedRoom ? '700' : '400'};">${r.label}</td>
                  <td style="border: 1px solid #000; padding: 3px 4px; text-align: center; width: 36px; font-weight: 800;">${isSelectedRoom ? '&#10003;' : ''}</td>
                  <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">${bedDisplay}</td>
                  <td style="border: 1px solid #000; padding: 3px 10px; text-align: center;">${rateDisplay}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 5. COMPANY, ADDRESS, EMAIL, PHONE, REMARKS & BILLING -->
      <div style="display: flex; flex-direction: column; gap: 9px; margin-bottom: 24px;">
        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;">Company Name</span>
          <span style="margin-right: 6px;">:</span>
          <span style="${dottedLineStyle} flex: 1;">${meta.company}</span>
        </div>

        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;">Address</span>
          <span style="margin-right: 6px;">:</span>
          <span style="${dottedLineStyle} flex: 1;">${meta.address}</span>
        </div>

        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;"></span>
          <span style="margin-right: 6px; visibility: hidden;">:</span>
          <span style="${dottedLineStyle} flex: 1;">&nbsp;</span>
        </div>

        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;">Email</span>
          <span style="margin-right: 6px;">:</span>
          <span style="${dottedLineStyle} flex: 1;">${b.guest_email}</span>
        </div>

        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;">Phone Number</span>
          <span style="margin-right: 6px;">:</span>
          <span style="${dottedLineStyle} flex: 1;">${b.guest_phone || '-'}</span>
        </div>

        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;">Remarks</span>
          <span style="margin-right: 6px;">:</span>
          <span style="${dottedLineStyle} flex: 1;">${meta.remarks}</span>
        </div>

        <div style="display: flex; align-items: baseline;">
          <span style="width: 145px; flex-shrink: 0;">Billing Instruction</span>
          <span style="margin-right: 6px;">:</span>
          <span style="${dottedLineStyle} flex: 1;">${meta.billing} — Total (Inc. 12% Tax): Rp ${Number(p.total_price).toLocaleString('id-ID')} (${b.payment_status === 'paid' ? 'PAID' : 'UNPAID'})</span>
        </div>
      </div>

      <!-- 6. FOOTER SIGN-OFF -->
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px; padding-top: 6px;">
        <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 24px; align-items: baseline;">
          <div style="display: flex; align-items: baseline;">
            <span style="width: 135px; flex-shrink: 0;">Accepted by</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${meta.accepted_by}</span>
          </div>
          <div style="display: flex; align-items: baseline;">
            <span style="width: 55px; flex-shrink: 0;">Date</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${meta.accepted_date}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 24px; align-items: baseline;">
          <div style="display: flex; align-items: baseline;">
            <span style="width: 135px; flex-shrink: 0;">Confirmation by</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${meta.confirmed_by || '&nbsp;'}</span>
          </div>
          <div style="display: flex; align-items: baseline;">
            <span style="width: 55px; flex-shrink: 0;">Date</span>
            <span style="margin-right: 6px;">:</span>
            <span style="${dottedLineStyle} flex: 1; text-align: center;">${meta.confirmed_date || '&nbsp;'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function toggleAdminResFormBox(type, value) {
  if (type === 'status') adminState.resFormOverrideStatus = value;
  if (type === 'resBy') adminState.resFormOverrideResBy = value;
  if (type === 'bed') adminState.resFormOverrideBed = value;
  if (adminState.activeResFormBooking) {
    const printArea = document.getElementById('adminResFormPrintArea');
    if (printArea) {
      printArea.innerHTML = renderAdminOfficialReservationFormHTML(
        adminState.activeResFormBooking.booking,
        adminState.activeResFormBooking.pricing
      );
    }
  }
}

async function openAdminReservationForm(bookingIdOrCode) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingIdOrCode}`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal memuat data Reservation Form');

    const b = data.data.booking;
    const p = data.data.pricing_breakdown;
    adminState.activeResFormBooking = { booking: b, pricing: p };
    adminState.resFormOverrideStatus = null;
    adminState.resFormOverrideResBy = null;
    adminState.resFormOverrideBed = null;

    const printArea = document.getElementById('adminResFormPrintArea');
    if (printArea) {
      printArea.innerHTML = renderAdminOfficialReservationFormHTML(b, p);
    }
    openAdminModal('adminReservationFormModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
