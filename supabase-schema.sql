-- SVIT Supabase Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- No BEGIN/COMMIT/ROLLBACK — Supabase SQL Editor handles transactions automatically

-- ===========================================
-- 1. PROFILES (extends auth.users)
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  default_municipality TEXT,
  theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 2. MONITORS (keyword alerts)
-- ===========================================
CREATE TABLE IF NOT EXISTS monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  sources TEXT[] DEFAULT '{}',
  municipality TEXT,
  matches INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own monitors"
  ON monitors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monitors"
  ON monitors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitors"
  ON monitors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monitors"
  ON monitors FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- 3. CONNECTIONS (civic contact tracking)
-- ===========================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  councillor_name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  relationship TEXT DEFAULT 'following' CHECK (relationship IN ('constituent', 'met', 'working-with', 'following')),
  notes TEXT DEFAULT '',
  last_contact TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own connections"
  ON connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- 4. THREADS (discussion threads)
-- ===========================================
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  item_type TEXT DEFAULT 'note',
  item_id TEXT,
  message_count INTEGER DEFAULT 0,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own threads"
  ON threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own threads"
  ON threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads"
  ON threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads"
  ON threads FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- 5. LEADS (visitor lead capture — anon insert only)
-- ===========================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  display_name TEXT,
  municipality_interest TEXT,
  interests TEXT[] DEFAULT '{}',
  consent_marketing BOOLEAN DEFAULT FALSE,
  consent_privacy BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'website',
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert (lead capture works without auth)
CREATE POLICY "Anyone can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Anonymous users can update (for upsert on email)
CREATE POLICY "Anyone can update leads"
  ON leads FOR UPDATE
  USING (true);

-- Only service role can read (admin dashboard)
CREATE POLICY "Service role can read leads"
  ON leads FOR SELECT
  USING (auth.role() = 'service_role');

-- ===========================================
-- 6. LEAD_SOCIAL_ACCOUNTS (social handles per lead)
-- ===========================================
CREATE TABLE IF NOT EXISTS lead_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, platform)
);

ALTER TABLE lead_social_accounts ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert
CREATE POLICY "Anyone can insert lead social accounts"
  ON lead_social_accounts FOR INSERT
  WITH CHECK (true);

-- Anonymous users can update (for upsert on lead_id,platform)
CREATE POLICY "Anyone can update lead social accounts"
  ON lead_social_accounts FOR UPDATE
  USING (true);

-- Only service role can read
CREATE POLICY "Service role can read lead social accounts"
  ON lead_social_accounts FOR SELECT
  USING (auth.role() = 'service_role');

-- ===========================================
-- 7. AUTO-UPDATE TRIGGERS for updated_at columns
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_monitors_updated_at
  BEFORE UPDATE ON monitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
