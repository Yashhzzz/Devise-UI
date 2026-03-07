-- =====================================================================
-- Devise Dashboard — Full PostgreSQL Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: Devise (cxayrkozrivicvmbztqo)
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Organizations ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── Profiles (linked to auth.users) ────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name   TEXT,
    email       TEXT,
    department  TEXT,
    role        TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(org_id);

-- ─── Detection Events ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detection_events (
    id                   BIGSERIAL PRIMARY KEY,
    event_id             TEXT UNIQUE,
    org_id               UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id              TEXT,
    user_email           TEXT,
    department           TEXT,
    device_id            TEXT,
    tool_name            TEXT,
    domain               TEXT,
    category             TEXT,
    vendor               TEXT,
    risk_level           TEXT,
    source               TEXT DEFAULT 'desktop',
    process_name         TEXT,
    process_path         TEXT,
    is_approved          BOOLEAN DEFAULT false,
    timestamp            TIMESTAMPTZ,
    connection_frequency INTEGER,
    high_frequency       BOOLEAN DEFAULT false,
    bytes_read           BIGINT,
    bytes_write          BIGINT,
    received_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON detection_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_risk ON detection_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_events_category ON detection_events(category);
CREATE INDEX IF NOT EXISTS idx_events_device ON detection_events(device_id);
CREATE INDEX IF NOT EXISTS idx_events_org ON detection_events(org_id);

-- ─── Heartbeats ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS heartbeats (
    id                  BIGSERIAL PRIMARY KEY,
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_id           TEXT NOT NULL,
    agent_version       TEXT,
    queue_depth         INTEGER DEFAULT 0,
    last_detection_time TIMESTAMPTZ,
    os_version          TEXT,
    restart_detected    BOOLEAN DEFAULT false,
    timestamp           TIMESTAMPTZ,
    received_at         TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_heartbeats_org ON heartbeats(org_id);

-- ─── Tamper Alerts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tamper_alerts (
    id            BIGSERIAL PRIMARY KEY,
    org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_id     TEXT,
    expected_hash TEXT,
    actual_hash   TEXT,
    timestamp     TIMESTAMPTZ,
    received_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tamper_org ON tamper_alerts(org_id);

-- ─── Agent Gaps ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_gaps (
    id           BIGSERIAL PRIMARY KEY,
    org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_id    TEXT,
    gap_seconds  INTEGER DEFAULT 0,
    last_seen    TIMESTAMPTZ,
    suspicious   BOOLEAN DEFAULT false,
    timestamp    TIMESTAMPTZ,
    received_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gaps_org ON agent_gaps(org_id);

-- ─── Dismissed Alerts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dismissed_alerts (
    alert_id      TEXT PRIMARY KEY,
    org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action        TEXT DEFAULT 'dismissed' CHECK (action IN ('dismissed', 'resolved')),
    dismissed_by  UUID REFERENCES auth.users(id),
    dismissed_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dismissed_org ON dismissed_alerts(org_id);

-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 2 FEATURE TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Subscriptions (AI Tool Billing) ────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tool_name   TEXT NOT NULL,
    vendor      TEXT,
    seats       INTEGER DEFAULT 1,
    seats_used  INTEGER DEFAULT 0,
    cost_monthly NUMERIC(10,2) DEFAULT 0,
    currency    TEXT DEFAULT 'INR',
    status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'zombie', 'cancelled', 'trial')),
    renewal_date DATE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_org ON subscriptions(org_id);

-- ─── Organization Settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_settings (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id            UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    monthly_budget    NUMERIC(12,2) DEFAULT 0,
    alert_threshold   NUMERIC(5,2) DEFAULT 80.00,
    auto_block        BOOLEAN DEFAULT false,
    allowed_categories TEXT[] DEFAULT '{}',
    blocked_domains   TEXT[] DEFAULT '{}',
    notification_email BOOLEAN DEFAULT true,
    notification_slack BOOLEAN DEFAULT false,
    slack_webhook_url TEXT,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── Team Invites ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_invites (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    role        TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by  UUID REFERENCES auth.users(id),
    status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    expires_at  TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);
CREATE INDEX IF NOT EXISTS idx_invites_org ON team_invites(org_id);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════

-- Helper function: get current user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── organizations ──────────────────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own org"
    ON organizations FOR SELECT
    USING (id = public.get_user_org_id());

-- ─── profiles ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view profiles in their org"
    ON profiles FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- ─── detection_events ───────────────────────────────────────────────
ALTER TABLE detection_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view events in their org"
    ON detection_events FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Service role can insert events"
    ON detection_events FOR INSERT
    WITH CHECK (true);  -- agent uses service_role key

-- ─── heartbeats ─────────────────────────────────────────────────────
ALTER TABLE heartbeats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view heartbeats in their org"
    ON heartbeats FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Service role can upsert heartbeats"
    ON heartbeats FOR INSERT
    WITH CHECK (true);
CREATE POLICY "Service role can update heartbeats"
    ON heartbeats FOR UPDATE
    USING (true);

-- ─── tamper_alerts ──────────────────────────────────────────────────
ALTER TABLE tamper_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tamper alerts in their org"
    ON tamper_alerts FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Service role can insert tamper alerts"
    ON tamper_alerts FOR INSERT
    WITH CHECK (true);

-- ─── agent_gaps ─────────────────────────────────────────────────────
ALTER TABLE agent_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view agent gaps in their org"
    ON agent_gaps FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Service role can insert agent gaps"
    ON agent_gaps FOR INSERT
    WITH CHECK (true);

-- ─── dismissed_alerts ───────────────────────────────────────────────
ALTER TABLE dismissed_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view dismissed alerts in their org"
    ON dismissed_alerts FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Users can dismiss alerts in their org"
    ON dismissed_alerts FOR INSERT
    WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "Users can delete dismissed alerts in their org"
    ON dismissed_alerts FOR DELETE
    USING (org_id = public.get_user_org_id());

-- ─── subscriptions ──────────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view subscriptions in their org"
    ON subscriptions FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Admins can manage subscriptions"
    ON subscriptions FOR ALL
    USING (org_id = public.get_user_org_id());

-- ─── org_settings ───────────────────────────────────────────────────
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their org settings"
    ON org_settings FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Admins can update org settings"
    ON org_settings FOR UPDATE
    USING (org_id = public.get_user_org_id());

-- ─── team_invites ───────────────────────────────────────────────────
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invites for their org"
    ON team_invites FOR SELECT
    USING (org_id = public.get_user_org_id());
CREATE POLICY "Admins can create invites"
    ON team_invites FOR INSERT
    WITH CHECK (org_id = public.get_user_org_id());

-- ═══════════════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    _org_id UUID;
BEGIN
    -- Create a default org for new users (or assign to existing)
    INSERT INTO organizations (name, slug)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 2)),
        LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 2)), ' ', '-'))
            || '-' || substr(gen_random_uuid()::text, 1, 8)
    )
    RETURNING id INTO _org_id;

    -- Create profile
    INSERT INTO profiles (id, org_id, full_name, email, role)
    VALUES (
        NEW.id,
        _org_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        'owner'
    );

    -- Create default org_settings
    INSERT INTO org_settings (org_id) VALUES (_org_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
