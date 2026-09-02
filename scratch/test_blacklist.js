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

function putJson(path, payload, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload || {});
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

async function runTest() {
  console.log('🚀 Mulai Pengujian Fitur Blacklist & Reset Password...\n');

  // 1. Buat user tamu baru (karena tadi sudah dihapus semua)
  console.log('1. Registrasi tamu baru...');
  const regRes = await postJson('/api/v1/auth/register', {
    full_name: 'Joko Blacklist',
    email: 'joko4@gmail.com',
    password: 'joko123',
    phone: '08123456789'
  });
  if (regRes.status !== 201) throw new Error('Gagal registrasi: ' + JSON.stringify(regRes.data));
  const guestId = regRes.data.data.user.id;
  console.log('✅ Tamu berhasil didaftarkan: ' + guestId);

  // 2. Login sebagai Admin
  console.log('\n2. Login sebagai admin...');
  const loginAdmin = await postJson('/api/v1/auth/login', {
    email: 'admin@luminaresort.com',
    password: 'admin123'
  });
  if (loginAdmin.status !== 200) throw new Error('Gagal login admin');
  const adminToken = loginAdmin.data.data.token;
  console.log('✅ Admin login berhasil.');

  // 3. Blacklist Tamu (Admin)
  console.log('\n3. Admin me-blacklist tamu...');
  const blacklistRes = await putJson(`/api/v1/admin/guests/${guestId}/blacklist`, { action: 'blacklist' }, adminToken);
  if (blacklistRes.status !== 200) throw new Error('Gagal blacklist: ' + JSON.stringify(blacklistRes.data));
  console.log('✅ Tamu berhasil diblacklist.');

  // 4. Coba login sebagai Tamu (Seharusnya gagal karena blacklist)
  console.log('\n4. Tamu mencoba login...');
  const loginGuestFail = await postJson('/api/v1/auth/login', {
    email: 'joko4@gmail.com',
    password: 'joko123'
  });
  if (loginGuestFail.status === 403) {
    console.log('✅ Tamu gagal login (Akun diblacklist) sesuai ekspektasi: ' + loginGuestFail.data.message);
  } else {
    throw new Error('Gagal! Tamu masih bisa login atau error lain.');
  }

  // 5. Reset Password Tamu (Admin)
  console.log('\n5. Admin me-reset password tamu...');
  const resetRes = await putJson(`/api/v1/admin/guests/${guestId}/reset-password`, null, adminToken);
  if (resetRes.status !== 200) throw new Error('Gagal reset password: ' + JSON.stringify(resetRes.data));
  console.log('✅ Password tamu berhasil direset.');

  // 6. Aktifkan kembali tamu (Admin)
  console.log('\n6. Admin mengaktifkan kembali tamu...');
  const activateRes = await putJson(`/api/v1/admin/guests/${guestId}/blacklist`, { action: 'activate' }, adminToken);
  if (activateRes.status !== 200) throw new Error('Gagal mengaktifkan kembali: ' + JSON.stringify(activateRes.data));
  console.log('✅ Tamu diaktifkan.');

  // 7. Coba login sebagai Tamu dengan password default
  console.log('\n7. Tamu mencoba login dengan password default...');
  const loginGuestSuccess = await postJson('/api/v1/auth/login', {
    email: 'joko4@gmail.com',
    password: 'password123'
  });
  if (loginGuestSuccess.status === 200) {
    console.log('✅ Tamu berhasil login dengan password123!');
  } else {
    throw new Error('Gagal login setelah reset password.');
  }

  console.log('\n🎉 PENGUJIAN SELESAI DAN SUKSES!');
  process.exit(0);
}

runTest().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
