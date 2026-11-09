// ============================================================
// 📁 backend/config/migratePayments.js
// Migration: Tambahkan verifikasi pembayaran ke reservasi kamar, restoran dan venue/ballroom
// Mendukung status: unpaid, waiting_verification, paid, refunded
// ============================================================

const { pool, query } = require('./db');

async function runMigration() {
  console.log('🚀 Menjalankan migrasi skema verifikasi pembayaran (Kamar, Restoran, & Ballroom)...');
  try {
    // 0. Alter payments table (untuk reservasi kamar)
    await query(`
      ALTER TABLE payments 
        ALTER COLUMN status TYPE VARCHAR(30);
    `);

    await query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT conname FROM pg_constraint 
          WHERE conrelid = 'payments'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%status%'
        ) LOOP
          EXECUTE 'ALTER TABLE payments DROP CONSTRAINT ' || quote_ident(r.conname);
        END LOOP;

        ALTER TABLE payments ADD CONSTRAINT chk_payments_status 
          CHECK (status IN ('unpaid', 'waiting_verification', 'paid', 'refunded'));
      END $$;
    `);
    console.log('✅ Tabel payments berhasil diperbarui (mendukung waiting_verification).');

    // 1. Alter table_reservations
    await query(`
      ALTER TABLE table_reservations 
        ADD COLUMN IF NOT EXISTS total_price DECIMAL(14, 2) NOT NULL DEFAULT 100000.00,
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
        ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'bank_transfer',
        ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
    `);
    await query(`ALTER TABLE table_reservations ALTER COLUMN payment_status TYPE VARCHAR(30);`);

    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_table_reservations_payment_status'
        ) THEN
          ALTER TABLE table_reservations DROP CONSTRAINT chk_table_reservations_payment_status;
        END IF;

        ALTER TABLE table_reservations ADD CONSTRAINT chk_table_reservations_payment_status 
          CHECK (payment_status IN ('unpaid', 'waiting_verification', 'paid', 'refunded'));

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_table_reservations_payment_method'
        ) THEN
          ALTER TABLE table_reservations ADD CONSTRAINT chk_table_reservations_payment_method 
            CHECK (payment_method IN ('bank_transfer', 'credit_card', 'ewallet', 'cash'));
        END IF;
      END $$;
    `);
    console.log('✅ Tabel table_reservations berhasil dimigrasi.');

    // 2. Alter venue_bookings
    await query(`
      ALTER TABLE venue_bookings 
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
        ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'bank_transfer',
        ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
    `);
    await query(`ALTER TABLE venue_bookings ALTER COLUMN payment_status TYPE VARCHAR(30);`);

    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_venue_bookings_payment_status'
        ) THEN
          ALTER TABLE venue_bookings DROP CONSTRAINT chk_venue_bookings_payment_status;
        END IF;

        ALTER TABLE venue_bookings ADD CONSTRAINT chk_venue_bookings_payment_status 
          CHECK (payment_status IN ('unpaid', 'waiting_verification', 'paid', 'refunded'));

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_venue_bookings_payment_method'
        ) THEN
          ALTER TABLE venue_bookings ADD CONSTRAINT chk_venue_bookings_payment_method 
            CHECK (payment_method IN ('bank_transfer', 'credit_card', 'ewallet', 'cash'));
        END IF;
      END $$;
    `);
    console.log('✅ Tabel venue_bookings berhasil dimigrasi.');

    // 3. Sinkronisasi data lama yang sudah confirmed/completed
    await query(`
      UPDATE table_reservations 
      SET payment_status = 'paid', paid_at = COALESCE(paid_at, updated_at) 
      WHERE status IN ('confirmed', 'completed') AND payment_status != 'paid';
    `);

    await query(`
      UPDATE venue_bookings 
      SET payment_status = 'paid', paid_at = COALESCE(paid_at, updated_at) 
      WHERE status IN ('confirmed', 'completed') AND payment_status != 'paid';
    `);
    console.log('✅ Status data yang sudah confirmed/completed disinkronkan.');

    console.log('🎉 Migrasi pembayaran berhasil diselesaikan.');
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
