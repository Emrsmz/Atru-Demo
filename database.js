'use strict';

/**
 * Database setup + seeding.
 *
 * The SQLite file lives at DB_PATH. On Railway you mount a persistent volume
 * at /data and set DB_PATH=/data/transfers.db so the data survives redeploys.
 * On local dev it falls back to ./transfers.db in the project directory.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Resolve where the SQLite file lives:
//   1. DB_PATH env var always wins (set DB_PATH=/data/transfers.db on Railway).
//   2. Otherwise, if a writable /data volume is mounted (Railway), use it so the
//      data survives redeploys even when DB_PATH wasn't set explicitly.
//   3. Otherwise (typical local dev), fall back to ./transfers.db.
function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  try {
    fs.accessSync('/data', fs.constants.W_OK);
    return '/data/transfers.db';
  } catch (_) {
    return path.join(__dirname, 'transfers.db');
  }
}

const DB_PATH = resolveDbPath();

// Make sure the directory that will hold the database actually exists
// (e.g. the /data volume mount, or any nested local path).
const dbDir = path.dirname(DB_PATH);
if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hotels (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id           INTEGER NOT NULL,
      group_id           TEXT,
      flight_code        TEXT NOT NULL,
      passenger_name     TEXT NOT NULL,
      arrival_datetime   TEXT NOT NULL,
      departure_datetime TEXT,
      phone              TEXT,
      notes              TEXT,
      status             TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'completed')),
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name     TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_transfers_hotel   ON transfers(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_transfers_arrival ON transfers(arrival_datetime);
    CREATE INDEX IF NOT EXISTS idx_transfers_status  ON transfers(status);
  `);
}

// Add columns introduced after a database may have first been created, so older
// SQLite files (e.g. a local dev DB) keep working without being wiped. Safe to
// run on every startup — each change is checked before it's applied.
function migrate() {
  const cols = db.prepare('PRAGMA table_info(transfers)').all().map((c) => c.name);
  if (!cols.includes('group_id')) {
    db.exec('ALTER TABLE transfers ADD COLUMN group_id TEXT');
    console.log('[migrate] Added transfers.group_id column.');
  }
}

function init() {
  createTables();
  migrate();
  console.log(`[db] SQLite ready at ${DB_PATH}`);
}

module.exports = { db, init, DB_PATH };
