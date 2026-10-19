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
    bookings: { title: 'Manajemen Reservasi', sub: 'Kelola status tamu (Check-in, Check-out, Konfirmasi, Pembatalan) secara real-time.' },
    restaurant_bookings: { title: 'Reservasi Restoran', sub: 'Kelola pemesanan meja dan status kedatangan tamu di restoran.' },
    rooms: { title: 'Inventori Kamar', sub: 'Pantau ketersediaan kamar, kamar terisi, dan atur status pemeliharaan (maintenance).' },
    guests: { title: 'Direktori Tamu', sub: 'Daftar seluruh tamu yang memiliki akun di LUXURY Hotel & Resort.' },
  };

  if (titles[tabId]) {
    document.getElementById('topbarHeaderTitle').innerText = titles[tabId].title;
    document.getElementById('topbarSubTitle').innerText = titles[tabId].sub;
  }

  // Fetch data sesuai tab
  if (tabId === 'dashboard') loadDashboardStats();
  else if (tabId === 'bookings') loadBookings();
  else if (tabId === 'restaurant_bookings') loadRestaurantBookings();
  else if (tabId === 'rooms') loadRooms();
  else if (tabId === 'guests') loadGuests();
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
            <button class="btn btn-outline-gold btn-sm" onclick="switchAdminTab('bookings')" title="Kelola di Tab Reservasi">
              <i class="fa-solid fa-sliders"></i> Kelola
            </button>
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

      let payBadge = b.payment_status === 'paid'
        ? `<span class="badge badge-confirmed"><i class="fa-solid fa-check"></i> LUNAS (${b.payment_method})</span>`
        : `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> BELUM BAYAR</span>`;

      // Aksi Cepat berdasarkan status
      let actionButtons = '';
      if (b.booking_status === 'pending') {
        actionButtons = `
          <button class="btn btn-success btn-sm" onclick="handleUpdateBookingStatus('${b.id}', 'confirmed', '${b.booking_code}')" title="Konfirmasi Reservasi">
            <i class="fa-solid fa-circle-check"></i> Konfirmasi
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
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
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
  if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin text-gold"></i> Memuat data reservasi restoran...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/admin/restaurant-bookings`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` },
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    allRestaurantBookings = data.data;
    renderRestaurantBookingsTable();
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--accent-rose);">${err.message}</td></tr>`;
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
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-secondary);">Tidak ada reservasi ditemukan.</td></tr>';
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
        <td>
          <input type="text" class="admin-input" style="width: 80px; padding: 4px; text-align: center;" 
            value="${b.table_number || ''}" id="tableNum-${b.id}" placeholder="Meja">
        </td>
        <td style="font-size: 0.85rem; max-width: 150px; white-space: normal;">${b.special_requests || '-'}</td>
        <td>
          <select class="select-filter" style="width: 130px; font-weight: bold; color: ${statusColor};" 
            onchange="updateRestaurantBookingStatus('${b.id}', this.value)">
            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn btn-outline-gold btn-sm" onclick="saveTableNumber('${b.id}')" title="Simpan Meja">
            <i class="fa-solid fa-save"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateRestaurantBookingStatus(id, newStatus) {
  if (!confirm(`Ubah status reservasi menjadi ${newStatus}?`)) {
    loadRestaurantBookings(); // reset
    return;
  }
  
  const tableNum = document.getElementById(`tableNum-${id}`)?.value;
  
  try {
    const res = await fetch(`${API_BASE}/admin/restaurant-bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify({ status: newStatus, table_number: tableNum })
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
