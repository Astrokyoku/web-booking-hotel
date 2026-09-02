// ============================================================
// 📁 backend/routes/serviceRoutes.js
// Rute untuk layanan hotel: Restoran, Fasilitas, dan MICE/Venue
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getRestaurantMenus,
  bookRestaurantTable,
  getHotelFacilities,
  getVenues,
  bookVenue
} = require('../controllers/serviceController');
const { authenticate } = require('../middleware/authMiddleware');

// --- Restoran "Angie" ---
router.get('/restaurant/menus', getRestaurantMenus);
router.post('/restaurant/book', authenticate, bookRestaurantTable);

// --- Fasilitas Hotel ---
router.get('/facilities', getHotelFacilities);

// --- MICE & Ballroom (Venues) ---
router.get('/venues', getVenues);
router.post('/venues/book', authenticate, bookVenue);

module.exports = router;
