// ============================================================
// 📁 backend/utils/pricing.js
// Helper untuk kalkulasi durasi menginap, pajak (12%), dan total harga
// ============================================================

// Tarif Pajak & Layanan Hotel: 12%
const TAX_RATE = 0.12;

/**
 * Menghitung selisih jumlah malam antara tanggal check-in dan check-out
 * @param {string|Date} checkIn - Tanggal check-in (YYYY-MM-DD)
 * @param {string|Date} checkOut - Tanggal check-out (YYYY-MM-DD)
 * @returns {number} - Jumlah malam (minimal 1)
 */
const calculateNights = (checkIn, checkOut) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  
  // Set waktu ke UTC 00:00:00 untuk menghindari masalah timezone
  const inTime = Date.UTC(inDate.getFullYear(), inDate.getMonth(), inDate.getDate());
  const outTime = Date.UTC(outDate.getFullYear(), outDate.getMonth(), outDate.getDate());
  
  const diffTime = outTime - inTime;
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return nights > 0 ? nights : 1;
};

/**
 * Menghitung rincian biaya reservasi (Subtotal, Pajak 12%, dan Total Bayar)
 * @param {number} basePricePerNight - Tarif dasar kamar per malam
 * @param {string|Date} checkIn - Tanggal check-in
 * @param {string|Date} checkOut - Tanggal check-out
 * @returns {object} - Rincian harga
 */
const calculateBookingPrice = (basePricePerNight, checkIn, checkOut) => {
  const nights = calculateNights(checkIn, checkOut);
  const price = Number(basePricePerNight);
  const subtotal = price * nights;
  const taxAmount = Math.round(subtotal * TAX_RATE);
  const totalPrice = subtotal + taxAmount;

  return {
    price_per_night: price,
    total_nights: nights,
    subtotal: subtotal,
    tax_rate: TAX_RATE,
    tax_percentage: '12%',
    tax_amount: taxAmount,
    total_price: totalPrice,
  };
};

module.exports = {
  TAX_RATE,
  calculateNights,
  calculateBookingPrice,
};
