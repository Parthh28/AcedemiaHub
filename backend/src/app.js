// src/app.js — Express application setup
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const purchaseRoutes = require('./routes/purchases');
const reviewRoutes = require('./routes/reviews');
const sellerRoutes = require('./routes/seller');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173', 'https://acedemia-hub.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
}));

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── LOGGING ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── STATIC FILES ─────────────────────────────────────────────────────────────
// Serve uploaded files
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Serve frontend static files (for production / demo)
const frontendPath = path.join(__dirname, '../../');
app.use(express.static(frontendPath));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    supabase: !!process.env.SUPABASE_URL
  });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
const API_BASE = '/api/v1';

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/notes`, notesRoutes);
app.use(`${API_BASE}`, purchaseRoutes);          // cart, payments, purchases, wishlist
app.use(`${API_BASE}/reviews`, reviewRoutes);
app.use(`${API_BASE}/seller`, sellerRoutes);
app.use(`${API_BASE}/admin`, adminRoutes);
app.use(`${API_BASE}/notifications`, notificationRoutes);

// Colleges & Departments (lightweight, public)
const supabase = require('./config/supabase');
const { success } = require('./utils/response');

app.get(`${API_BASE}/colleges`, async (req, res) => {
  const { data, error } = await supabase.from('colleges').select('id, name, city, state').order('name');
  if (error) return res.status(500).json({ success: false, error });
  return success(res, { colleges: data });
});

app.get(`${API_BASE}/departments`, async (req, res) => {
  let query = supabase.from('departments').select('id, name, code, college_id, colleges(name)').order('name');
  if (req.query.college) query = query.eq('college_id', req.query.college);
  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, error });
  return success(res, { departments: data });
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
