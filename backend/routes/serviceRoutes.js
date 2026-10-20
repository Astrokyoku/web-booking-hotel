// ============================================================
// 📁 backend/routes/serviceRoutes.js
// Rute untuk layanan hotel: Restoran, Fasilitas, dan MICE/Venue
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getRestaurantMenus,
  bookRestaurantTable,
  getMyRestaurantBookings,
  getHotelFacilities,
  getVenues,
  bookVenue,
  getMyVenueBookings
} = require('../controllers/serviceController');
const { authenticate } = require('../middleware/authMiddleware');

// --- Restoran "Angie" ---
router.get('/restaurant/menus', getRestaurantMenus);
router.post('/restaurant/book', authenticate, bookRestaurantTable);
router.get('/restaurant/my-bookings', authenticate, getMyRestaurantBookings);

// --- Fasilitas Hotel ---
router.get('/facilities', getHotelFacilities);

// --- MICE & Ballroom (Venues) ---
router.get('/venues', getVenues);
router.get('/venues/my-bookings', authenticate, getMyVenueBookings);
router.post('/venues/book', authenticate, bookVenue);

module.exports = router;
