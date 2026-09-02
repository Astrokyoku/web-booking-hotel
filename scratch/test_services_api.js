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

async function runServicesTest() {
  console.log('🚀 Running Services API Test Suite (Phase 6)...\n');

  // 1. Guest Login to get token for booking
  const loginRes = await postJson('/api/v1/auth/login', {
    email: 'budi@gmail.com',
    password: 'tamu123'
  });

  if (loginRes.status !== 200 || !loginRes.data.data?.token) {
    console.error('❌ Guest login failed:', loginRes);
    process.exit(1);
  }
  const token = loginRes.data.data.token;
  console.log('✅ 1. Guest Login Success (budi@gmail.com)');

  // 2. Fetch Restaurant Menus
  const menusRes = await getJson('/api/v1/services/restaurant/menus');
  if (menusRes.status !== 200) throw new Error('Failed to fetch menus');
  console.log('✅ 2. GET /services/restaurant/menus: Found', menusRes.data.data.menus.length, 'menus');

  // 3. Book Restaurant Table
  const restBookingRes = await postJson('/api/v1/services/restaurant/book', {
    reservation_date: '2026-08-15',
    session_time: 'dinner',
    guest_count: 2,
    special_requests: 'Anniversary dinner'
  }, token);
  if (restBookingRes.status !== 201) {
    console.error('❌ Restaurant booking failed:', restBookingRes);
    process.exit(1);
  }
  console.log('✅ 3. POST /services/restaurant/book:', restBookingRes.data.message, `(${restBookingRes.data.data.reservation.reservation_code})`);

  // 4. Fetch Facilities
  const facilitiesRes = await getJson('/api/v1/services/facilities');
  if (facilitiesRes.status !== 200) throw new Error('Failed to fetch facilities');
  console.log('✅ 4. GET /services/facilities: Found', facilitiesRes.data.data.facilities.length, 'facilities');

  // 5. Fetch Venues
  const venuesRes = await getJson('/api/v1/services/venues');
  if (venuesRes.status !== 200) throw new Error('Failed to fetch venues');
  console.log('✅ 5. GET /services/venues: Found', venuesRes.data.data.venues.length, 'venues');
  const testVenueId = venuesRes.data.data.venues[0].id;

  // 6. Book Venue
  const venueBookingRes = await postJson('/api/v1/services/venues/book', {
    venue_id: testVenueId,
    event_date: '2026-09-10',
    duration_type: 'full_day',
    layout_type: 'banquet',
    attendee_count: 250,
    special_requests: 'Company gathering'
  }, token);
  if (venueBookingRes.status !== 201) {
    console.error('❌ Venue booking failed:', venueBookingRes);
    process.exit(1);
  }
  console.log('✅ 6. POST /services/venues/book:', venueBookingRes.data.message, `(${venueBookingRes.data.data.booking.venue_booking_code})`);

  console.log('\n🎉 ALL SERVICES API TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runServicesTest().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
