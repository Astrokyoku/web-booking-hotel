// ============================================================
// 📁 backend/routes/serviceRoutes.js
// Rute untuk layanan hotel: Restoran, Fasilitas, dan MICE/Venue
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getRestaurantMenus,
  bookRestaurantTable,
  payRestaurantReservation,
  cancelRestaurantReservation,
  getRestaurantReservationById,
  getMyRestaurantBookings,
  getHotelFacilities,
  getVenues,
  bookVenue,
  payVenueBooking,
  cancelVenueBooking,
  getVenueBookingById,
  getMyVenueBookings,
} = require('../controllers/serviceController');
const { authenticate } = require('../middleware/authMiddleware');

// --- Restoran "Angie" ---
router.get('/restaurant/menus', getRestaurantMenus);
router.post('/restaurant/book', authenticate, bookRestaurantTable);
router.get('/restaurant/my-bookings', authenticate, getMyRestaurantBookings);
router.get('/restaurant/:id', authenticate, getRestaurantReservationById);
router.post('/restaurant/:id/pay', authenticate, payRestaurantReservation);
router.post('/restaurant/:id/cancel', authenticate, cancelRestaurantReservation);

// --- Fasilitas Hotel ---
router.get('/facilities', getHotelFacilities);

// --- MICE & Ballroom (Venues) ---
router.get('/venues', getVenues);
router.get('/venues/my-bookings', authenticate, getMyVenueBookings);
router.get('/venues/:id', authenticate, getVenueBookingById);
router.post('/venues/book', authenticate, bookVenue);
router.post('/venues/:id/pay', authenticate, payVenueBooking);
router.post('/venues/:id/cancel', authenticate, cancelVenueBooking);

module.exports = router;
