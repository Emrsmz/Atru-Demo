'use strict';

/**
 * Admin routes (mounted at /admin): a single-admin panel to manage hotel and
 * driver accounts and review every transfer.
 *
 * Auth is via environment variables (no admin row in the DB):
 *   ADMIN_USER  (default 'admin')
 *   ADMIN_PASS  (required in production; defaults to 'admin' in development)
 * Set these in the Railway dashboard. If ADMIN_PASS is unset in production,
 * admin login is disabled.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { createBackup } = require('../backup');
const loginLimiter = require('./loginLimiter');

const router = express.Router();
const VIEWS = path.join(__dirname, '..', 'views');
const NODE_ENV = process.env.NODE_ENV || 'development';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || (NODE_ENV === 'production' ? null : 'admin');

const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const str = (v) => String(v == null ? '' : v).trim();

// Constant-time string compare so admin credentials can't be timing-probed.
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// --- Guards ---
function requireAdminPage(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}
function requireAdminApi(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res
    .status(401)
    .json({ error: 'Not authenticated', code: 'not_authenticated', redirect: '/admin/login' });
}

// --- Pages ---
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.sendFile(path.join(VIEWS, 'admin-login.html'));
});
router.get('/', requireAdminPage, (req, res) => {
  res.sendFile(path.join(VIEWS, 'admin.html'));
});

// --- Auth ---
router.post('/login', (req, res) => {
  if (loginLimiter.blocked(req)) {
    return res.status(429).json({ error: 'Too many failed attempts.', code: 'too_many_attempts' });
  }
  if (!ADMIN_PASS) {
    return res
      .status(403)
      .json({ error: 'Admin login is not configured.', code: 'admin_not_configured' });
  }
  const { username, password } = req.body || {};
  if (!isNonEmpty(username) || !isNonEmpty(password)) {
    return res
      .status(400)
      .json({ error: 'Username and password are required.', code: 'fields_required' });
  }
  if (!safeEqual(username.trim(), ADMIN_USER) || !safeEqual(password, ADMIN_PASS)) {
    loginLimiter.fail(req);
    return res
      .status(401)
      .json({ error: 'Invalid username or password.', code: 'invalid_credentials' });
  }
  loginLimiter.succeed(req);
  req.session.isAdmin = true;
  req.session.adminUser = ADMIN_USER;
  req.session.role = 'admin';
  res.json({ ok: true, redirect: '/admin' });
});

// --- Data: everything the panel needs in one call (no password hashes) ---
router.get('/api/data', requireAdminApi, (req, res) => {
  const hotels = db
    .prepare('SELECT id, name, username, created_at FROM hotels ORDER BY id ASC')
    .all();
  const drivers = db
    .prepare('SELECT id, username, full_name, created_at FROM drivers ORDER BY id ASC')
    .all();
  const transfers = db
    .prepare(
      `SELECT t.*, h.name AS hotel_name
         FROM transfers t
         JOIN hotels h ON h.id = t.hotel_id
        ORDER BY t.arrival_datetime ASC, t.id ASC`
    )
    .all();
  res.json({ admin: req.session.adminUser, hotels, drivers, transfers });
});

// --- Download a fresh database backup (.db file) ---
// Writes a consistent snapshot to a temp file, streams it, then cleans up.
router.get('/backup', requireAdminApi, async (req, res) => {
  const p = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const name = `transfers-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(
    d.getDate()
  )}.db`;
  const tmp = path.join(os.tmpdir(), `tms-backup-${Date.now()}.db`);
  try {
    await createBackup(tmp);
  } catch (err) {
    console.error('[admin] backup failed:', err);
    return res.status(500).json({ error: 'Backup failed.', code: 'backup_failed' });
  }
  res.download(tmp, name, (err) => {
    fs.unlink(tmp, () => {});
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Download failed.', code: 'backup_failed' });
    }
  });
});

// --- Hotels CRUD ---
router.post('/hotels', requireAdminApi, (req, res) => {
  const name = str(req.body && req.body.name);
  const username = str(req.body && req.body.username);
  const password = String((req.body && req.body.password) || '');
  if (!isNonEmpty(name) || !isNonEmpty(username) || !isNonEmpty(password)) {
    return res.status(400).json({ error: 'Required.', code: 'reg_required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password too short.', code: 'password_short' });
  }
  if (db.prepare('SELECT id FROM hotels WHERE username = ?').get(username)) {
    return res.status(409).json({ error: 'Username taken.', code: 'username_taken' });
  }
  const info = db
    .prepare('INSERT INTO hotels (name, username, password_hash) VALUES (?, ?, ?)')
    .run(name, username, bcrypt.hashSync(password, 10));
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/hotels/:id', requireAdminApi, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.', code: 'invalid_id' });
  if (!db.prepare('SELECT id FROM hotels WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Hotel not found.', code: 'not_found' });
  }
  const name = str(req.body && req.body.name);
  const username = str(req.body && req.body.username);
  const password = String((req.body && req.body.password) || '');
  if (!isNonEmpty(name) || !isNonEmpty(username)) {
    return res.status(400).json({ error: 'Required.', code: 'reg_required' });
  }
  if (db.prepare('SELECT id FROM hotels WHERE username = ? AND id != ?').get(username, id)) {
    return res.status(409).json({ error: 'Username taken.', code: 'username_taken' });
  }
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password too short.', code: 'password_short' });
    }
    db.prepare('UPDATE hotels SET name = ?, username = ?, password_hash = ? WHERE id = ?').run(
      name,
      username,
      bcrypt.hashSync(password, 10),
      id
    );
  } else {
    db.prepare('UPDATE hotels SET name = ?, username = ? WHERE id = ?').run(name, username, id);
  }
  res.json({ ok: true });
});

router.delete('/hotels/:id', requireAdminApi, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.', code: 'invalid_id' });
  // Transfers cascade-delete via the foreign key (ON DELETE CASCADE).
  const info = db.prepare('DELETE FROM hotels WHERE id = ?').run(id);
  if (!info.changes) return res.status(404).json({ error: 'Hotel not found.', code: 'not_found' });
  res.json({ ok: true });
});

// --- Drivers CRUD ---
router.post('/drivers', requireAdminApi, (req, res) => {
  const full_name = str(req.body && req.body.full_name);
  const username = str(req.body && req.body.username);
  const password = String((req.body && req.body.password) || '');
  if (!isNonEmpty(username) || !isNonEmpty(password)) {
    return res.status(400).json({ error: 'Required.', code: 'fields_required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password too short.', code: 'password_short' });
  }
  if (db.prepare('SELECT id FROM drivers WHERE username = ?').get(username)) {
    return res.status(409).json({ error: 'Username taken.', code: 'username_taken' });
  }
  const info = db
    .prepare('INSERT INTO drivers (username, password_hash, full_name) VALUES (?, ?, ?)')
    .run(username, bcrypt.hashSync(password, 10), full_name || null);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/drivers/:id', requireAdminApi, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.', code: 'invalid_id' });
  if (!db.prepare('SELECT id FROM drivers WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Driver not found.', code: 'not_found' });
  }
  const full_name = str(req.body && req.body.full_name);
  const username = str(req.body && req.body.username);
  const password = String((req.body && req.body.password) || '');
  if (!isNonEmpty(username)) {
    return res.status(400).json({ error: 'Required.', code: 'fields_required' });
  }
  if (db.prepare('SELECT id FROM drivers WHERE username = ? AND id != ?').get(username, id)) {
    return res.status(409).json({ error: 'Username taken.', code: 'username_taken' });
  }
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password too short.', code: 'password_short' });
    }
    db.prepare('UPDATE drivers SET full_name = ?, username = ?, password_hash = ? WHERE id = ?').run(
      full_name || null,
      username,
      bcrypt.hashSync(password, 10),
      id
    );
  } else {
    db.prepare('UPDATE drivers SET full_name = ?, username = ? WHERE id = ?').run(
      full_name || null,
      username,
      id
    );
  }
  res.json({ ok: true });
});

router.delete('/drivers/:id', requireAdminApi, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.', code: 'invalid_id' });
  const info = db.prepare('DELETE FROM drivers WHERE id = ?').run(id);
  if (!info.changes) return res.status(404).json({ error: 'Driver not found.', code: 'not_found' });
  res.json({ ok: true });
});

module.exports = router;
