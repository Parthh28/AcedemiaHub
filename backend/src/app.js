// src/app.js — Express application setup
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
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

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "upgrade-insecure-requests": null, // Disable so Tailscale HTTP connections work
      "img-src": ["'self'", "data:", "https:"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    },
  },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5500', 'http://localhost:5500', 'https://acedemia-hub.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any origin that looks like localhost, 127.0.0.1, or Tailscale/LAN IPs
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.') || origin.includes('100.')) {
      return callback(null, true);
    }
    // Fallback to allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 150, // Tightened global limit to 150
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

// Explicit fallback for root and HTML pages if static middleware misses
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

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
