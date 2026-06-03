'use strict';

/**
 * Database backups.
 *
 *  - Scheduled: a consistent copy of the SQLite DB is written to BACKUP_DIR
 *    every BACKUP_INTERVAL_HOURS (default 24h), keeping the last BACKUP_KEEP
 *    files (default 14). BACKUP_DIR defaults to <db dir>/backups, so on Railway
 *    it lives on the persistent /data volume and survives redeploys.
 *  - On demand: createBackup(dest) writes a single consistent snapshot, used by
 *    the admin "download backup" route.
 *
 * Uses better-sqlite3's online backup API, so it is safe to run while the app
 * is serving requests (no need to pause writes).
 *
 * NOTE: scheduled backups live on the SAME volume as the database, so they
 * protect against accidental deletion / corruption but NOT against losing the
 * whole volume. For true off-site safety, download a backup from the admin
 * panel periodically (or point BACKUP_DIR at external storage).
 */

const path = require('path');
const fs = require('fs');
const { db, DB_PATH } = require('./database');

const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups');
const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP) || 14);
const INTERVAL_HOURS = Math.max(1, Number(process.env.BACKUP_INTERVAL_HOURS) || 24);

function ensureDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Write a consistent snapshot to `dest`. Returns a Promise (better-sqlite3).
function createBackup(dest) {
  return db.backup(dest);
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(
    d.getHours()
  )}${p(d.getMinutes())}`;
}

// Keep only the most recent KEEP backup files; delete older ones.
function rotate() {
  let files;
  try {
    files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('transfers-') && f.endsWith('.db'));
  } catch (_) {
    return;
  }
  files.sort(); // timestamped names sort chronologically
  const excess = files.length - KEEP;
  for (let i = 0; i < excess; i++) {
    try {
      fs.unlinkSync(path.join(BACKUP_DIR, files[i]));
    } catch (_) {
      /* ignore */
    }
  }
}

async function runScheduledBackup() {
  try {
    ensureDir();
    const dest = path.join(BACKUP_DIR, `transfers-${stamp()}.db`);
    await createBackup(dest);
    rotate();
    console.log(`[backup] wrote ${dest}`);
  } catch (err) {
    console.error('[backup] failed:', err);
  }
}

function startBackupScheduler() {
  ensureDir();
  // First backup shortly after boot, then on a fixed interval. unref() so these
  // timers never keep the process alive on their own.
  setTimeout(runScheduledBackup, 10 * 1000).unref();
  setInterval(runScheduledBackup, INTERVAL_HOURS * 60 * 60 * 1000).unref();
  console.log(
    `[backup] scheduler on: every ${INTERVAL_HOURS}h, keep ${KEEP}, dir ${BACKUP_DIR}`
  );
}

module.exports = { createBackup, runScheduledBackup, startBackupScheduler, BACKUP_DIR };
