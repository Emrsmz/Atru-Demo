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
const bcrypt = require('bcryptjs');

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

function seed() {
  const SALT_ROUNDS = 10;

  // Seed driver accounts only if the table is empty (first run).
  const driverCount = db.prepare('SELECT COUNT(*) AS c FROM drivers').get().c;
  if (driverCount === 0) {
    const drivers = [
      { username: 'sofor1', password: 'Sofor123', full_name: 'Driver One' },
      { username: 'sofor2', password: 'Sofor456', full_name: 'Driver Two' },
      { username: 'sofor3', password: 'Sofor789', full_name: 'Driver Three' },
    ];
    const insert = db.prepare(
      'INSERT INTO drivers (username, password_hash, full_name) VALUES (?, ?, ?)'
    );
    const insertMany = db.transaction((rows) => {
      for (const d of rows) {
        insert.run(d.username, bcrypt.hashSync(d.password, SALT_ROUNDS), d.full_name);
      }
    });
    insertMany(drivers);
    console.log(`[seed] Inserted ${drivers.length} driver account(s).`);
  }

  // Seed demo hotel accounts only if the table is empty (first run).
  const hotelCount = db.prepare('SELECT COUNT(*) AS c FROM hotels').get().c;
  if (hotelCount === 0) {
    const hotels = [
      { name: 'Demo Hotel One', username: 'hotel1', password: 'Hotel123' },
      { name: 'Demo Hotel Two', username: 'hotel2', password: 'Hotel456' },
    ];
    const insert = db.prepare(
      'INSERT INTO hotels (name, username, password_hash) VALUES (?, ?, ?)'
    );
    const insertMany = db.transaction((rows) => {
      for (const h of rows) {
        insert.run(h.name, h.username, bcrypt.hashSync(h.password, SALT_ROUNDS));
      }
    });
    insertMany(hotels);
    console.log(`[seed] Inserted ${hotels.length} demo hotel account(s).`);
  }
}

function init() {
  createTables();
  seed();
  console.log(`[db] SQLite ready at ${DB_PATH}`);
}

module.exports = { db, init, DB_PATH };
