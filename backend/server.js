// ============================================================
// 📁 backend/server.js
// Entry Point - Express.js Server untuk Hotel Booking API
// ============================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

// Inisialisasi Express Application
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE GLOBAL
// ============================================================

// Helmet: Mengamankan HTTP headers (XSS, clickjacking, dll.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Dinonaktifkan agar frontend bisa load resource
}));

// CORS: Mengizinkan request dari frontend (berbeda origin)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parser: Mengurai request body dalam format JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static Files: Menyajikan file frontend secara statis
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'assets')));

// Root Route: Membuka Web App Frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ============================================================
// API ROUTES (akan ditambahkan di fase berikutnya)
// ============================================================

// Health Check Endpoint - untuk memastikan server berjalan
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbStatus = await db.testConnection();
    res.status(200).json({
      status: 'OK',
      message: '🏨 Hotel Booking API is running',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'Connected' : 'Disconnected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Server health check failed',
      error: error.message,
    });
  }
});

// Auth Routes (Fase 2)
app.use('/api/v1/auth', require('./routes/authRoutes'));

// Room Routes (Fase 3)
app.use('/api/v1/rooms', require('./routes/roomRoutes'));

// Booking Routes (Fase 3)
app.use('/api/v1/bookings', require('./routes/bookingRoutes'));

// Admin & Management Routes (Fase 5)
app.use('/api/v1/admin', require('./routes/adminRoutes'));

// Extended Hotel Services (Fase 6)
app.use('/api/v1/services', require('./routes/serviceRoutes'));

// Hotel Reviews & Ratings
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================

// 404 Handler - Route tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    status: 'ERROR',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(err.status || 500).json({
    status: 'ERROR',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, async () => {
  console.log('='.repeat(55));
  console.log(`🏨 Hotel Booking API Server`);
  console.log(`🚀 Running on: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(55));

  // Test koneksi database saat server startup
  await db.testConnection();
});

module.exports = app;
