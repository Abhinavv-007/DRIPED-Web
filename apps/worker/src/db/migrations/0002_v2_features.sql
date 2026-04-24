-- Driped V2 migration \u2014 additive only. Safe to re-run.
-- Run: wrangler d1 execute driped-db --file=src/db/migrations/0002_v2_features.sql

-- ─── Web Push + FCM registry ───
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  platform      TEXT NOT NULL,         -- 'web' | 'android' | 'ios'
  endpoint      TEXT NOT NULL,         -- webpush endpoint OR fcm token
  p256dh        TEXT,                   -- webpush only
  auth_secret   TEXT,                   -- webpush only
  device_label  TEXT,                   -- "Chrome on MacBook Air", "Pixel 8"
  last_seen_at  TEXT DEFAULT (datetime('now')),
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
  ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

-- ─── Device sync state ───
CREATE TABLE IF NOT EXISTS device_sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  device_id    TEXT NOT NULL,
  platform     TEXT NOT NULL,           -- 'web' | 'android' | 'ios'
  device_label TEXT,
  last_sync_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_sessions_unique
  ON device_sessions(user_id, device_id);

-- ─── User preferences (split out of users for flexibility) ───
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id                   TEXT PRIMARY KEY REFERENCES users(id),
  theme                     TEXT DEFAULT 'dark',
  notify_renewal_7d         INTEGER DEFAULT 1,
  notify_renewal_3d         INTEGER DEFAULT 1,
  notify_renewal_1d         INTEGER DEFAULT 1,
  notify_trial_end          INTEGER DEFAULT 1,
  notify_price_change       INTEGER DEFAULT 1,
  notify_monthly_summary    INTEGER DEFAULT 1,
  auto_add_high_confidence  INTEGER DEFAULT 0,
  quiet_hours_start         INTEGER,   -- 0-23
  quiet_hours_end           INTEGER,
  updated_at                TEXT DEFAULT (datetime('now'))
);

-- ─── Price change history ───
CREATE TABLE IF NOT EXISTS price_history (
  id              TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  user_id         TEXT NOT NULL REFERENCES users(id),
  old_amount      REAL,
  new_amount      REAL NOT NULL,
  currency        TEXT DEFAULT 'INR',
  delta_pct       REAL,
  detected_at     TEXT DEFAULT (datetime('now')),
  source          TEXT DEFAULT 'email_scan'
);

CREATE INDEX IF NOT EXISTS idx_price_history_subscription
  ON price_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_price_history_user
  ON price_history(user_id);

-- ─── Merchant registry \u2014 crowd-sourceable ───
CREATE TABLE IF NOT EXISTS merchants (
  id               TEXT PRIMARY KEY,
  slug             TEXT NOT NULL,         -- 'netflix', 'spotify', ...
  display_name     TEXT NOT NULL,
  domains          TEXT NOT NULL,         -- JSON array of sender domains
  aliases          TEXT,                   -- JSON array of alt names
  typical_cycle    TEXT,                   -- 'monthly' | 'yearly' | null
  typical_amount   REAL,                   -- rough centroid in INR
  typical_currency TEXT DEFAULT 'INR',
  category_slug    TEXT,                   -- 'streaming', 'productivity', ...
  icon_slug        TEXT,                   -- brand icon ref
  cancel_url       TEXT,                   -- public cancel deep-link if known
  verified         INTEGER DEFAULT 0,     -- curated vs user-contributed
  confidence_base  INTEGER DEFAULT 60,    -- 0-100 baseline match confidence
  updated_at       TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_slug ON merchants(slug);

-- ─── Scan extraction feedback loop ───
CREATE TABLE IF NOT EXISTS scan_feedback (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  email_hash      TEXT NOT NULL,
  detected_slug   TEXT,
  correct_slug    TEXT,
  verdict         TEXT NOT NULL,        -- 'correct' | 'wrong' | 'duplicate' | 'not_subscription'
  payload_json    TEXT,                  -- anonymised parser output snapshot
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scan_feedback_user ON scan_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_feedback_hash ON scan_feedback(email_hash);

-- ─── Receipt locker \u2014 email references for each subscription ───
CREATE TABLE IF NOT EXISTS receipt_refs (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  subscription_id TEXT REFERENCES subscriptions(id),
  email_hash      TEXT NOT NULL,         -- dedup key
  gmail_message_id TEXT,
  subject         TEXT,
  sender          TEXT,
  snippet         TEXT,
  amount          REAL,
  currency        TEXT,
  charged_at      TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_receipt_refs_hash
  ON receipt_refs(user_id, email_hash);
CREATE INDEX IF NOT EXISTS idx_receipt_refs_subscription
  ON receipt_refs(subscription_id);

-- ─── Additive columns on existing tables (SQLite \u2014 ignore if exists) ───
-- sync_version for simple last-write-wins conflict hints on subscriptions
-- Wrapping in a harmless PRAGMA so re-runs don't error. D1 doesn't support
-- "IF NOT EXISTS" for ALTER COLUMN, so we rely on the wrangler exec failing
-- gracefully when already applied. Run once.
-- ALTER TABLE subscriptions ADD COLUMN sync_version INTEGER DEFAULT 0;
-- ALTER TABLE subscriptions ADD COLUMN device_origin TEXT;

-- If re-running, comment the ALTERs above out. First-time migration: uncomment.
