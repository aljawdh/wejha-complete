-- ============================================================================
-- WEJHA COMPLETE DATABASE SCHEMA - PRODUCTION READY
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- COUNTRIES & REGIONS
-- ============================================================================
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  code VARCHAR(3) UNIQUE NOT NULL, -- QAT, SAU, UAE, etc.
  phone_prefix VARCHAR(10) NOT NULL, -- +974, +966, etc.
  currency VARCHAR(3) NOT NULL, -- QAR, SAR, AED, etc.
  currency_symbol VARCHAR(5) NOT NULL,
  flag_emoji VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  country_id INTEGER REFERENCES countries(id),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CATEGORIES
-- ============================================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon_url VARCHAR(500),
  banner_url VARCHAR(500),
  color_hex VARCHAR(7) DEFAULT '#8B1F24',
  slug VARCHAR(100) UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- USER PROFILES & AUTHENTICATION
-- ============================================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(200),
  email VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10), -- male, female, other
  country_id INTEGER REFERENCES countries(id),
  city_id INTEGER REFERENCES cities(id),
  preferred_language VARCHAR(5) DEFAULT 'ar', -- ar, en
  profile_image_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  total_savings DECIMAL(10, 2) DEFAULT 0,
  coupons_used INTEGER DEFAULT 0,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_otp_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) DEFAULT 'login', -- login, password_reset
  attempts INTEGER DEFAULT 0,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  device_type VARCHAR(50), -- web, ios, android
  device_name VARCHAR(255),
  fcm_token VARCHAR(500), -- for push notifications
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MERCHANTS
-- ============================================================================
CREATE TABLE merchants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  description TEXT,
  description_ar TEXT,
  description_en TEXT,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  website VARCHAR(500),
  instagram VARCHAR(255),
  category_id INTEGER REFERENCES categories(id),
  country_id INTEGER REFERENCES countries(id),
  city_id INTEGER REFERENCES cities(id),
  address TEXT NOT NULL,
  address_ar TEXT,
  address_en TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  logo_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  
  -- Business Information
  business_license VARCHAR(255),
  tax_id VARCHAR(255),
  bank_account_iban VARCHAR(34),
  bank_name VARCHAR(100),
  
  -- Working Hours (JSON format)
  working_hours JSONB,
  
  -- Status & Verification
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended, rejected
  verification_status VARCHAR(20) DEFAULT 'unverified', -- unverified, pending, verified, rejected
  verification_documents JSONB,
  rejection_reason TEXT,
  
  -- Statistics
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  active_deals INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00, -- percentage
  
  -- Authentication
  password_hash VARCHAR(255) NOT NULL,
  password_reset_token VARCHAR(100),
  password_reset_expires TIMESTAMP,
  email_verified_at TIMESTAMP,
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE merchant_images (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_type VARCHAR(20), -- logo, cover, gallery, document
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- DEALS & OFFERS
-- ============================================================================
CREATE TABLE deals (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  
  -- Deal Information
  title VARCHAR(200) NOT NULL,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  description TEXT,
  description_ar TEXT,
  description_en TEXT,
  terms_conditions TEXT,
  terms_conditions_ar TEXT,
  terms_conditions_en TEXT,
  
  -- Pricing
  original_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  discount_percent INTEGER GENERATED ALWAYS AS (
    ROUND(((original_price - final_price) / original_price * 100)::INTEGER)
  ) STORED,
  currency VARCHAR(3) DEFAULT 'QAR',
  
  -- Availability
  max_coupons INTEGER NOT NULL DEFAULT 100,
  remaining_coupons INTEGER,
  max_per_user INTEGER DEFAULT 1,
  claims_count INTEGER DEFAULT 0,
  redemptions_count INTEGER DEFAULT 0,
  
  -- Timing
  starts_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  -- Images & Media
  image_url VARCHAR(500),
  gallery_images JSONB,
  
  -- Status & Features
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  featured_until TIMESTAMP,
  
  -- Location Specific
  available_cities JSONB, -- array of city IDs
  
  -- SEO & Analytics
  slug VARCHAR(200) UNIQUE,
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Automatically set remaining_coupons on insert
CREATE OR REPLACE FUNCTION set_remaining_coupons()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.remaining_coupons IS NULL THEN
    NEW.remaining_coupons := NEW.max_coupons;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_remaining_coupons
  BEFORE INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION set_remaining_coupons();

-- ============================================================================
-- COUPONS & REDEMPTIONS
-- ============================================================================
CREATE TABLE claimed_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  merchant_id INTEGER REFERENCES merchants(id),
  
  -- Coupon Information
  coupon_code VARCHAR(12) UNIQUE NOT NULL,
  qr_code_url VARCHAR(500),
  
  -- Financial
  original_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  merchant_amount DECIMAL(10, 2) NOT NULL, -- after commission
  qreeb_commission DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'QAR',
  
  -- Status & Timing
  status VARCHAR(20) DEFAULT 'active', -- active, used, expired, cancelled, refunded
  claimed_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- Usage Information
  used_location POINT, -- PostGIS point for where it was used
  used_by_merchant_user VARCHAR(255), -- staff member who processed it
  usage_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generate unique coupon code
CREATE OR REPLACE FUNCTION generate_coupon_code()
RETURNS TRIGGER AS $$
DECLARE
  code_exists BOOLEAN := TRUE;
  new_code VARCHAR(12);
BEGIN
  WHILE code_exists LOOP
    new_code := upper(substring(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM claimed_coupons WHERE coupon_code = new_code) INTO code_exists;
  END LOOP;
  
  NEW.coupon_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_coupon_code
  BEFORE INSERT ON claimed_coupons
  FOR EACH ROW
  WHEN (NEW.coupon_code IS NULL OR NEW.coupon_code = '')
  EXECUTE FUNCTION generate_coupon_code();

-- ============================================================================
-- REVIEWS & RATINGS
-- ============================================================================
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  deal_id INTEGER REFERENCES deals(id),
  coupon_id UUID REFERENCES claimed_coupons(id),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  images JSONB, -- array of image URLs
  
  -- Moderation
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  moderation_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  moderation_notes TEXT,
  
  -- Engagement
  helpful_votes INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS & MESSAGING
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- deal_expiring, new_deal, coupon_used, etc.
  title VARCHAR(200) NOT NULL,
  title_ar VARCHAR(200),
  title_en VARCHAR(200),
  message TEXT NOT NULL,
  message_ar TEXT,
  message_en TEXT,
  
  -- Related entities
  deal_id INTEGER REFERENCES deals(id),
  merchant_id INTEGER REFERENCES merchants(id),
  coupon_id UUID REFERENCES claimed_coupons(id),
  
  -- Delivery
  channels JSONB, -- ['push', 'email', 'sms']
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  sent_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ADMIN & MANAGEMENT
-- ============================================================================
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- super_admin, admin, moderator, support
  permissions JSONB,
  
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  password_changed_at TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category VARCHAR(50),
  data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
  is_public BOOLEAN DEFAULT false, -- can be accessed by frontend
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID, -- can be user, merchant, or admin
  user_type VARCHAR(20), -- user, merchant, admin
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100), -- table or entity name
  resource_id VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- FINANCIAL & PAYOUTS
-- ============================================================================
CREATE TABLE payouts (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'QAR',
  
  -- Period covered by payout
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Banking details
  bank_name VARCHAR(100),
  iban VARCHAR(34),
  account_holder VARCHAR(200),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processed, paid, failed
  
  -- Processing
  processed_at TIMESTAMP,
  processed_by INTEGER REFERENCES admin_users(id),
  payment_reference VARCHAR(100),
  payment_method VARCHAR(50),
  
  -- Metadata
  notes TEXT,
  transaction_ids JSONB, -- related coupon IDs
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS & METRICS
-- ============================================================================
CREATE TABLE daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  
  -- User metrics
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  
  -- Merchant metrics
  new_merchants INTEGER DEFAULT 0,
  active_merchants INTEGER DEFAULT 0,
  
  -- Deal metrics
  new_deals INTEGER DEFAULT 0,
  active_deals INTEGER DEFAULT 0,
  deals_viewed INTEGER DEFAULT 0,
  
  -- Coupon metrics
  coupons_claimed INTEGER DEFAULT 0,
  coupons_redeemed INTEGER DEFAULT 0,
  
  -- Financial metrics
  gross_revenue DECIMAL(12, 2) DEFAULT 0,
  commission_revenue DECIMAL(12, 2) DEFAULT 0,
  merchant_revenue DECIMAL(12, 2) DEFAULT 0,
  
  -- Engagement metrics
  app_downloads INTEGER DEFAULT 0,
  session_duration INTERVAL,
  page_views INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER trigger_update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to decrement remaining coupons
CREATE OR REPLACE FUNCTION decrement_remaining_coupons(deal_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE deals 
  SET remaining_coupons = remaining_coupons - 1,
      claims_count = claims_count + 1
  WHERE id = deal_id_param AND remaining_coupons > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to increment redemption count
CREATE OR REPLACE FUNCTION increment_redemption_count(deal_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE deals 
  SET redemptions_count = redemptions_count + 1
  WHERE id = deal_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX idx_user_profiles_country ON user_profiles(country_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_otp_codes_phone_expires ON user_otp_codes(phone, expires_at);

-- Merchant indexes
CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_category ON merchants(category_id);
CREATE INDEX idx_merchants_location ON merchants(country_id, city_id);
CREATE INDEX idx_merchants_rating ON merchants(rating DESC);

-- Deal indexes
CREATE INDEX idx_deals_merchant_id ON deals(merchant_id);
CREATE INDEX idx_deals_category_id ON deals(category_id);
CREATE INDEX idx_deals_active ON deals(is_active, expires_at);
CREATE INDEX idx_deals_featured ON deals(is_featured, featured_until);
CREATE INDEX idx_deals_expires_at ON deals(expires_at);

-- Coupon indexes
CREATE INDEX idx_claimed_coupons_user_id ON claimed_coupons(user_id);
CREATE INDEX idx_claimed_coupons_deal_id ON claimed_coupons(deal_id);
CREATE INDEX idx_claimed_coupons_merchant_id ON claimed_coupons(merchant_id);
CREATE INDEX idx_claimed_coupons_code ON claimed_coupons(coupon_code);
CREATE INDEX idx_claimed_coupons_status ON claimed_coupons(status);

-- Review indexes
CREATE INDEX idx_reviews_merchant_id ON reviews(merchant_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================================================
-- SECURITY - ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Session policies  
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Coupon policies
CREATE POLICY "Users can view own coupons" ON claimed_coupons
  FOR SELECT USING (auth.uid() = user_id);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- INITIAL DATA - COUNTRIES & CITIES
-- ============================================================================

INSERT INTO countries (name, name_ar, name_en, code, phone_prefix, currency, currency_symbol, flag_emoji) VALUES
('قطر', 'قطر', 'Qatar', 'QAT', '+974', 'QAR', 'ر.ق', '🇶🇦'),
('السعودية', 'المملكة العربية السعودية', 'Saudi Arabia', 'SAU', '+966', 'SAR', 'ر.س', '🇸🇦'),
('الإمارات', 'دولة الإمارات العربية المتحدة', 'United Arab Emirates', 'ARE', '+971', 'AED', 'د.إ', '🇦🇪'),
('الكويت', 'دولة الكويت', 'Kuwait', 'KWT', '+965', 'KWD', 'د.ك', '🇰🇼'),
('البحرين', 'مملكة البحرين', 'Bahrain', 'BHR', '+973', 'BHD', 'د.ب', '🇧🇭'),
('عُمان', 'سلطنة عُمان', 'Oman', 'OMN', '+968', 'OMR', 'ر.ع', '🇴🇲'),
('الأردن', 'المملكة الأردنية الهاشمية', 'Jordan', 'JOR', '+962', 'JOD', 'د.أ', '🇯🇴'),
('لبنان', 'الجمهورية اللبنانية', 'Lebanon', 'LBN', '+961', 'LBP', 'ل.ل', '🇱🇧'),
('مصر', 'جمهورية مصر العربية', 'Egypt', 'EGY', '+20', 'EGP', 'ج.م', '🇪🇬'),
('العراق', 'جمهورية العراق', 'Iraq', 'IRQ', '+964', 'IQD', 'د.ع', '🇮🇶'),
('سوريا', 'الجمهورية العربية السورية', 'Syria', 'SYR', '+963', 'SYP', 'ل.س', '🇸🇾'),
('المغرب', 'المملكة المغربية', 'Morocco', 'MAR', '+212', 'MAD', 'د.م', '🇲🇦'),
('الجزائر', 'الجمهورية الجزائرية الديمقراطية الشعبية', 'Algeria', 'DZA', '+213', 'DZD', 'د.ج', '🇩🇿'),
('تونس', 'الجمهورية التونسية', 'Tunisia', 'TUN', '+216', 'TND', 'د.ت', '🇹🇳'),
('ليبيا', 'دولة ليبيا', 'Libya', 'LBY', '+218', 'LYD', 'د.ل', '🇱🇾'),
('السودان', 'جمهورية السودان', 'Sudan', 'SDN', '+249', 'SDG', 'ج.س', '🇸🇩'),
('اليمن', 'الجمهورية اليمنية', 'Yemen', 'YEM', '+967', 'YER', 'ر.ي', '🇾🇪');

-- Qatar cities
INSERT INTO cities (country_id, name, name_ar, name_en, latitude, longitude) VALUES
(1, 'الدوحة', 'الدوحة', 'Doha', 25.2854, 51.5310),
(1, 'الريان', 'الريان', 'Al Rayyan', 25.2919, 51.4244),
(1, 'الوكرة', 'الوكرة', 'Al Wakrah', 25.1654, 51.6042),
(1, 'أم صلال', 'أم صلال', 'Umm Salal', 25.4059, 51.4110),
(1, 'الخور', 'الخور', 'Al Khor', 25.6816, 51.4969);

-- Default categories
INSERT INTO categories (name, name_ar, name_en, description_ar, description_en, icon_url, slug, sort_order, is_active) VALUES
('🍽️ مطاعم', 'مطاعم', 'Restaurants', 'مطاعم وأماكن تناول الطعام', 'Restaurants and dining places', '', 'restaurants', 1, true),
('☕ مقاهي', 'مقاهي', 'Cafes', 'مقاهي ومشروبات', 'Cafes and beverages', '', 'cafes', 2, true),
('👗 موضة وجمال', 'موضة وجمال', 'Fashion & Beauty', 'ملابس ومستحضرات تجميل', 'Fashion and beauty products', '', 'fashion-beauty', 3, true),
('🛒 سوبر ماركت', 'سوبر ماركت', 'Supermarkets', 'بقالة ومواد غذائية', 'Groceries and food items', '', 'supermarkets', 4, true),
('🏥 صحة ورياضة', 'صحة ورياضة', 'Health & Sports', 'صالات رياضية ومراكز صحية', 'Gyms and health centers', '', 'health-sports', 5, true),
('📱 إلكترونيات', 'إلكترونيات', 'Electronics', 'أجهزة إلكترونية وتقنية', 'Electronic devices and tech', '', 'electronics', 6, true),
('🏠 منزل وحديقة', 'منزل وحديقة', 'Home & Garden', 'أثاث ومستلزمات منزلية', 'Furniture and home essentials', '', 'home-garden', 7, true),
('🎉 ترفيه', 'ترفيه', 'Entertainment', 'ألعاب وترفيه', 'Games and entertainment', '', 'entertainment', 8, true);

-- Default admin user
INSERT INTO admin_users (email, password_hash, full_name, role, permissions) VALUES
('admin@wejha.qa', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgDr2mwZ9m.kYgG', 'مدير وِجهة', 'super_admin', '["all"]');
-- Password: 123456 (hashed with bcrypt)

-- Default app settings
INSERT INTO app_settings (key, value, description, category, data_type, is_public) VALUES
('app_name', 'وِجهة', 'Application name', 'general', 'string', true),
('app_version', '1.0.0', 'Current app version', 'general', 'string', true),
('commission_rate', '10.0', 'Default commission rate percentage', 'financial', 'number', false),
('otp_length', '6', 'OTP code length', 'security', 'number', false),
('otp_expiry_minutes', '5', 'OTP expiry time in minutes', 'security', 'number', false),
('max_otp_attempts', '3', 'Maximum OTP attempts', 'security', 'number', false),
('currency_default', 'QAR', 'Default currency', 'general', 'string', true),
('language_default', 'ar', 'Default language', 'general', 'string', true),
('maintenance_mode', 'false', 'Maintenance mode status', 'system', 'boolean', true),
('min_app_version_ios', '1.0.0', 'Minimum required iOS app version', 'system', 'string', true),
('min_app_version_android', '1.0.0', 'Minimum required Android app version', 'system', 'string', true);

COMMIT;
