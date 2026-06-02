'use strict';

/**
 * Driver routes (mounted at /driver): login page, auth, dashboard, and the
 * complete/pending toggle. Drivers see ALL transfers from ALL hotels, so the
 * toggle is intentionally not scoped to a single hotel.
 */

const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const loginLimiter = require('./loginLimiter');

const router = express.Router();
const VIEWS = path.join(__dirname, '..', 'views');

// --- Auth guards ---
function requireDriverPage(req, res, next) {
  if (req.session && req.session.driverId) return next();
  return res.redirect('/driver/login');
}
function requireDriverApi(req, res, next) {
  if (req.session && req.session.driverId) return next();
  return res
    .status(401)
    .json({ error: 'Not authenticated', redirect: '/driver/login' });
}

const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

// --- Pages ---
// Mounted at /driver, so '/login' -> /driver/login and '/' -> /driver.
router.get('/login', (req, res) => {
  if (req.session && req.session.driverId) return res.redirect('/driver');
  res.sendFile(path.join(VIEWS, 'driver-login.html'));
});

router.get('/', requireDriverPage, (req, res) => {
  res.sendFile(path.join(VIEWS, 'driver.html'));
});

// --- Auth ---
router.post('/login', (req, res) => {
  if (loginLimiter.blocked(req)) {
    return res
      .status(429)
      .json({ error: 'Too many failed attempts.', code: 'too_many_attempts' });
  }
  const { username, password } = req.body || {};
  if (!isNonEmpty(username) || !isNonEmpty(password)) {
    return res
      .status(400)
      .json({ error: 'Username and password are required.', code: 'fields_required' });
  }
  const driver = db
    .prepare('SELECT * FROM drivers WHERE username = ?')
    .get(username.trim());
  if (!driver || !bcrypt.compareSync(password, driver.password_hash)) {
    loginLimiter.fail(req);
    return res
      .status(401)
      .json({ error: 'Invalid username or password.', code: 'invalid_credentials' });
  }
  loginLimiter.succeed(req);
  req.session.driverId = driver.id;
  req.session.driverName = driver.full_name || driver.username;
  req.session.driverUsername = driver.username;
  req.session.role = 'driver';
  res.json({
    ok: true,
    redirect: '/driver',
    driver: { id: driver.id, name: driver.full_name },
  });
});

// --- Toggle complete / pending ---
router.post('/transfer/:id/complete', requireDriverApi, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id.', code: 'invalid_id' });
  }
  const row = db.prepare('SELECT status FROM transfers WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ error: 'Transfer not found.', code: 'not_found' });
  }

  const next = row.status === 'completed' ? 'pending' : 'completed';
  db.prepare(
    "UPDATE transfers SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(next, id);
  res.json({ ok: true, id, status: next });
});

module.exports = router;
