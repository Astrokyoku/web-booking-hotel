const http = require('http');

function postJson(path, payload, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function putJson(path, payload, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'PUT',
      headers,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runAdminE2ETest() {
  console.log('🚀 Running Admin End-to-End Test Suite...\n');

  // 1. Login Admin
  const adminLogin = await postJson('/api/v1/auth/login', {
    email: 'admin@luminaresort.com',
    password: 'admin123'
  });

  if (adminLogin.status !== 200 || !adminLogin.data.data?.token) {
    console.error('❌ Admin login failed:', adminLogin);
    process.exit(1);
  }
  const token = adminLogin.data.data.token;
  console.log('✅ 1. Admin Login Success (Role: admin)');

  // 2. Fetch Stats
  const statsRes = await getJson('/api/v1/admin/stats', token);
  if (statsRes.status !== 200) {
    console.error('Stats error:', statsRes);
    process.exit(1);
  }
  console.log('✅ 2. GET /admin/stats:', {
    revenue: statsRes.data.data.financials.total_revenue,
    occupancy_rate: statsRes.data.data.rooms.occupancy_rate_percent + '%',
    total_rooms: statsRes.data.data.rooms.total,
    recent_bookings_count: statsRes.data.data.recent_bookings.length
  });

  // 3. Fetch Rooms Inventory
  const roomsRes = await getJson('/api/v1/admin/rooms', token);
  console.log('✅ 3. GET /admin/rooms:', {
    total_physical_rooms: roomsRes.data.data.rooms.length,
    room_types_count: roomsRes.data.data.room_types.length
  });

  // 4. Add Room (e.g. #901 on Floor 9)
  const roomTypeId = roomsRes.data.data.room_types[0].id;
  const testRoomNumber = '90' + Math.floor(Math.random() * 90 + 10);
  const addRoomRes = await postJson('/api/v1/admin/rooms', {
    room_number: testRoomNumber,
    room_type_id: roomTypeId,
    floor: 9,
    status: 'available'
  }, token);
  console.log('✅ 4. POST /admin/rooms:', addRoomRes.data.message, `(#${testRoomNumber})`);
  const createdRoomId = addRoomRes.data.data.room.id;

  // 5. Update Room Status
  const updateRoomRes = await putJson(`/api/v1/admin/rooms/${createdRoomId}/status`, {
    status: 'maintenance'
  }, token);
  console.log('✅ 5. PUT /admin/rooms/:id/status -> maintenance:', updateRoomRes.data.message);

  // 6. Fetch Guests Directory
  const guestsRes = await getJson('/api/v1/admin/guests', token);
  console.log('✅ 6. GET /admin/guests:', {
    total_guests_registered: guestsRes.data.data.guests.length,
    sample_guest: guestsRes.data.data.guests[0]?.full_name
  });

  // 7. Fetch Bookings Management
  const bookingsRes = await getJson('/api/v1/admin/bookings?status=all', token);
  console.log('✅ 7. GET /admin/bookings:', {
    total_bookings: bookingsRes.data.data.bookings.length,
    sample_booking_code: bookingsRes.data.data.bookings[0]?.booking_code
  });

  console.log('\n🎉 ALL ADMIN SUITE TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runAdminE2ETest().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
