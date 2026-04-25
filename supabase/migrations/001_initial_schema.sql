-- ============================================================
-- VideoTube Platform — Full Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE subscription_status_enum  AS ENUM ('active', 'inactive', 'cancelled', 'past_due', 'trialing');
CREATE TYPE subscription_plan_enum    AS ENUM ('free', 'basic', 'premium');
CREATE TYPE draw_status_enum          AS ENUM ('upcoming', 'open', 'closed', 'published');
CREATE TYPE match_tier_enum           AS ENUM ('tier_3', 'tier_4', 'tier_5', 'jackpot');
CREATE TYPE verification_status_enum  AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE payout_status_enum        AS ENUM ('pending', 'processing', 'paid', 'failed');

-- ─────────────────────────────────────────────────────────────
-- HELPER: is_admin()
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- TABLE: charities
-- (Created before users because users.charity_id references it)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charities (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT          NOT NULL,
  description      TEXT,
  image_url        TEXT,
  is_featured      BOOLEAN       NOT NULL DEFAULT false,
  upcoming_events  JSONB         NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT          NOT NULL UNIQUE,
  name                  TEXT,
  subscription_status   subscription_status_enum  NOT NULL DEFAULT 'inactive',
  subscription_plan     subscription_plan_enum    NOT NULL DEFAULT 'free',
  subscription_start    TIMESTAMPTZ,
  charity_id            UUID          REFERENCES charities(id) ON DELETE SET NULL,
  charity_percentage    SMALLINT      NOT NULL DEFAULT 10
                          CHECK (charity_percentage BETWEEN 0 AND 100),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: scores
-- (max 5 per user — enforced by trigger below)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_value  NUMERIC(10,2) NOT NULL,
  score_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Trigger: auto-delete oldest score when a user exceeds 5
CREATE OR REPLACE FUNCTION enforce_max_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM scores
  WHERE id IN (
    SELECT id
    FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 5
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_max_scores
AFTER INSERT ON scores
FOR EACH ROW EXECUTE FUNCTION enforce_max_scores();

-- ─────────────────────────────────────────────────────────────
-- TABLE: draws
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draws (
  id            UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  month         SMALLINT           NOT NULL CHECK (month BETWEEN 1 AND 12),
  year          SMALLINT           NOT NULL CHECK (year >= 2024),
  draw_numbers  INTEGER[]          NOT NULL DEFAULT '{}',
  status        draw_status_enum   NOT NULL DEFAULT 'upcoming',
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  UNIQUE (month, year)
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: draw_entries
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draw_entries (
  id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id          UUID              NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id          UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_numbers  INTEGER[]         NOT NULL DEFAULT '{}',
  match_tier       match_tier_enum,
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  UNIQUE (draw_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: prize_pools
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prize_pools (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id         UUID          NOT NULL REFERENCES draws(id) ON DELETE CASCADE UNIQUE,
  tier_3_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tier_4_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tier_5_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  jackpot_carry   NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: winners
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS winners (
  id                    UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id               UUID                    NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id               UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier                  match_tier_enum         NOT NULL,
  amount                NUMERIC(12,2)           NOT NULL,
  proof_url             TEXT,
  verification_status   verification_status_enum NOT NULL DEFAULT 'pending',
  payout_status         payout_status_enum       NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: subscriptions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id   TEXT                     UNIQUE,
  plan                     subscription_plan_enum   NOT NULL DEFAULT 'free',
  status                   subscription_status_enum NOT NULL DEFAULT 'inactive',
  renewal_date             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_scores_user_id         ON scores(user_id);
CREATE INDEX idx_scores_created_at      ON scores(user_id, created_at DESC);
CREATE INDEX idx_draw_entries_draw_id   ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id   ON draw_entries(user_id);
CREATE INDEX idx_winners_draw_id        ON winners(draw_id);
CREATE INDEX idx_winners_user_id        ON winners(user_id);
CREATE INDEX idx_subscriptions_user_id  ON subscriptions(user_id);
CREATE INDEX idx_draws_status           ON draws(status);
CREATE INDEX idx_charities_is_featured  ON charities(is_featured);

-- ─────────────────────────────────────────────────────────────
-- updated_at AUTO-STAMP TRIGGER
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_charities_updated_at
  BEFORE UPDATE ON charities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_draws_updated_at
  BEFORE UPDATE ON draws
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prize_pools_updated_at
  BEFORE UPDATE ON prize_pools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_winners_updated_at
  BEFORE UPDATE ON winners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- AUTO-CREATE users ROW ON SIGN-UP
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ═════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═════════════════════════════════════════════════════════════

-- ─── users ───────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: select own or admin"
  ON users FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "users: insert own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: update own or admin"
  ON users FOR UPDATE
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "users: delete admin only"
  ON users FOR DELETE
  USING (is_admin());

-- ─── scores ──────────────────────────────────────────────────
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores: select own or admin"
  ON scores FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "scores: insert own or admin"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "scores: update admin only"
  ON scores FOR UPDATE
  USING (is_admin());

CREATE POLICY "scores: delete own or admin"
  ON scores FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- ─── charities ───────────────────────────────────────────────
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "charities: select all authenticated"
  ON charities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "charities: insert admin only"
  ON charities FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "charities: update admin only"
  ON charities FOR UPDATE
  USING (is_admin());

CREATE POLICY "charities: delete admin only"
  ON charities FOR DELETE
  USING (is_admin());

-- ─── draws ───────────────────────────────────────────────────
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "draws: select published or admin"
  ON draws FOR SELECT
  USING (status = 'published' OR is_admin());

CREATE POLICY "draws: insert admin only"
  ON draws FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "draws: update admin only"
  ON draws FOR UPDATE
  USING (is_admin());

CREATE POLICY "draws: delete admin only"
  ON draws FOR DELETE
  USING (is_admin());

-- ─── draw_entries ─────────────────────────────────────────────
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "draw_entries: select own or admin"
  ON draw_entries FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "draw_entries: insert own or admin"
  ON draw_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "draw_entries: update admin only"
  ON draw_entries FOR UPDATE
  USING (is_admin());

CREATE POLICY "draw_entries: delete admin only"
  ON draw_entries FOR DELETE
  USING (is_admin());

-- ─── prize_pools ─────────────────────────────────────────────
ALTER TABLE prize_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prize_pools: select all authenticated"
  ON prize_pools FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "prize_pools: insert admin only"
  ON prize_pools FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "prize_pools: update admin only"
  ON prize_pools FOR UPDATE
  USING (is_admin());

CREATE POLICY "prize_pools: delete admin only"
  ON prize_pools FOR DELETE
  USING (is_admin());

-- ─── winners ─────────────────────────────────────────────────
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "winners: select own or admin"
  ON winners FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "winners: insert admin only"
  ON winners FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "winners: update admin only"
  ON winners FOR UPDATE
  USING (is_admin());

CREATE POLICY "winners: delete admin only"
  ON winners FOR DELETE
  USING (is_admin());

-- ─── subscriptions ────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: select own or admin"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "subscriptions: insert own or admin"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "subscriptions: update own or admin"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "subscriptions: delete admin only"
  ON subscriptions FOR DELETE
  USING (is_admin());

-- ═════════════════════════════════════════════════════════════
-- SEED: Sample charities
-- ═════════════════════════════════════════════════════════════
INSERT INTO charities (name, description, image_url, is_featured, upcoming_events) VALUES
(
  'Ocean Cleanup Foundation',
  'Dedicated to developing advanced technologies to rid the world''s oceans of plastic.',
  'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=800',
  true,
  '[{"title": "Beach Cleanup Day", "date": "2025-06-15", "location": "Malibu, CA"}]'::jsonb
),
(
  'Rainforest Alliance',
  'Working to conserve biodiversity and ensure sustainable livelihoods.',
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
  true,
  '[{"title": "Tree Planting Weekend", "date": "2025-07-20", "location": "Amazon Basin"}]'::jsonb
),
(
  'Children''s Education Fund',
  'Providing quality education resources to underprivileged children worldwide.',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
  false,
  '[]'::jsonb
);
