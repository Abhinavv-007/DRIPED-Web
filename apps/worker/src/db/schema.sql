-- Driped D1 Schema — full migration
-- Run: wrangler d1 execute driped-db --file=src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  full_name  TEXT,
  avatar_url TEXT,
  currency   TEXT DEFAULT 'INR',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,
  icon_slug    TEXT,
  last_four    TEXT,
  expiry_month INTEGER,
  expiry_year  INTEGER,
  is_default   INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  name         TEXT NOT NULL,
  colour_hex   TEXT NOT NULL,
  icon_name    TEXT NOT NULL,
  budget_limit REAL,
  is_default   INTEGER DEFAULT 1,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL REFERENCES users(id),
  service_name          TEXT NOT NULL,
  service_slug          TEXT NOT NULL,
  category_id           TEXT REFERENCES categories(id),
  amount                REAL NOT NULL,
  currency              TEXT DEFAULT 'INR',
  billing_cycle         TEXT NOT NULL,
  start_date            TEXT,
  next_renewal_date     TEXT,
  trial_end_date        TEXT,
  is_trial              INTEGER DEFAULT 0,
  status                TEXT DEFAULT 'active',
  payment_method_id     TEXT REFERENCES payment_methods(id),
  notes                 TEXT,
  source                TEXT DEFAULT 'manual',
  last_email_detected_at TEXT,
  created_at            TEXT DEFAULT (datetime('now')),
  updated_at            TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_history (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id),
  subscription_id    TEXT NOT NULL REFERENCES subscriptions(id),
  amount             REAL NOT NULL,
  currency           TEXT DEFAULT 'INR',
  charged_at         TEXT NOT NULL,
  email_subject      TEXT,
  payment_method_hint TEXT,
  created_at         TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scan_log (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id),
  scan_type           TEXT NOT NULL,
  emails_scanned      INTEGER DEFAULT 0,
  subscriptions_found INTEGER DEFAULT 0,
  scanned_at          TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id           ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status            ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal_date ON subscriptions(next_renewal_date);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id         ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id              ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id         ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_scan_log_user_id                ON scan_log(user_id);

-- Unique constraint for deduplication on bulk payment history inserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_history_dedup
  ON payment_history(subscription_id, charged_at);
