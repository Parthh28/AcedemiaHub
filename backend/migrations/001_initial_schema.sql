-- migrations/001_initial_schema.sql
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- This creates all tables needed for the Notes Marketplace backend

-- ─── Enable UUID extension ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Colleges ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  website_url TEXT,
  logo_url TEXT,
  student_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Departments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  code VARCHAR(10),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, code)
);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_pic_url TEXT,
  college_id UUID REFERENCES colleges(id),
  department_id UUID REFERENCES departments(id),
  year INTEGER CHECK(year BETWEEN 1 AND 6),
  bio TEXT,
  role VARCHAR(20) DEFAULT 'buyer' CHECK(role IN ('buyer','seller','both','admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(15),
  upi_id VARCHAR(100),
  bank_account_verified BOOLEAN DEFAULT false,
  refresh_token TEXT,
  reset_token TEXT,
  reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ─── Notes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  department_id UUID REFERENCES departments(id),
  college_id UUID REFERENCES colleges(id),
  year INTEGER CHECK(year BETWEEN 1 AND 6),
  file_url TEXT,
  file_size INTEGER,
  page_count INTEGER,
  preview_url TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'draft' CHECK(status IN ('draft','under_review','live','rejected','deleted')),
  rejection_reason TEXT,
  tags JSONB DEFAULT '[]',
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  reviewed_by_admin_id UUID REFERENCES users(id),
  review_date TIMESTAMPTZ
);

-- ─── Purchases ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  notes_id UUID NOT NULL REFERENCES notes(id),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'card' CHECK(payment_method IN ('upi','card','wallet','free')),
  payment_id UUID,
  status VARCHAR(20) DEFAULT 'completed' CHECK(status IN ('completed','refunded','failed','pending')),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, notes_id)
);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notes_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notes_id, reviewer_id)
);

-- ─── Payments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(20) DEFAULT 'card',
  razorpay_payment_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','completed','failed','refunded')),
  refund_amount DECIMAL(10,2),
  refund_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seller Earnings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  notes_id UUID NOT NULL REFERENCES notes(id),
  purchase_id UUID NOT NULL REFERENCES purchases(id),
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_commission DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK(status IN ('pending','available','paid')),
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Cart Items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notes_id)
);

-- ─── Wishlists ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notes_id)
);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK(type IN ('sale','review','new_notes','message','admin_alert','payout')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Moderation Queue ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notes_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  assigned_to_admin UUID REFERENCES users(id),
  reason_for_rejection TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_comments TEXT
);

-- ─── Payouts ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  upi_id VARCHAR(100),
  bank_account TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  transaction_id VARCHAR(100)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notes_dept_year_status ON notes(department_id, year, status);
CREATE INDEX IF NOT EXISTS idx_notes_seller ON notes(seller_id);
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_notes ON purchases(notes_id);
CREATE INDEX IF NOT EXISTS idx_reviews_notes ON reviews(notes_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, status);

-- ─── Helper Functions ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_download_count(note_id UUID)
RETURNS void AS $$
  UPDATE notes SET download_count = download_count + 1, updated_at = NOW() WHERE id = note_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_helpful(review_id UUID)
RETURNS void AS $$
  UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = review_id;
$$ LANGUAGE SQL;

-- ─── Row Level Security (RLS) - Optional, set to permissive for service_role ──
-- The backend uses service_role key which bypasses RLS.
-- Enable RLS only if you want per-user client access control.
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

SELECT 'Schema created successfully! 🎉' as status;
