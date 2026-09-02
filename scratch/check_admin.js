const { pool } = require('../backend/config/db');

async function checkAdmin() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT email, role FROM users WHERE role = 'admin'");
    console.log(result.rows);
  } finally {
    client.release();
    pool.end();
  }
}
checkAdmin();
