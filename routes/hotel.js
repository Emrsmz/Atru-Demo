'use strict';

/**
 * Hotel routes: login / register pages, auth, dashboard, and transfer CRUD.
 * All transfer operations are scoped to the logged-in hotel (hotel_id) so a
 * hotel can only ever see / edit / delete its own records.
 *
 * Adding supports MULTIPLE passengers in a single operation: the shared flight /
 * arrival / departure / notes are combined with a list of passengers and one
 * transfer row is created per passenger.
 *
 * Error responses include a machine-readable `code` so the frontend can show a
 * localized (TR/EN) message.
 */

const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');

const router = express.Router();
const VIEWS = path.join(__dirname, '..', 'views');

// --- Auth guards ---
function requireHotelPage(req, res, next) {
  if (req.session && req.session.hotelId) return next();
  return res.redirect('/login');
}
function requireHotelApi(req, res, next) {
  if (req.session && req.session.hotelId) return next();
  return res
    .status(401)
    .json({ error: 'Not authenticated', code: 'not_authenticated', redirect: '/login' });
}

// --- Helpers ---
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const str = (v) => String(v == null ? '' : v).trim();

function readShared(body) {
  return {
    flight_code: str(body.flight_code),
    arrival_datetime: str(body.arrival_datetime),
    departure_datetime: str(body.departure_datetime) || null,
    notes: str(body.notes) || null,
  };
}

// Build a normalized passenger list. Accepts either a `passengers` array
// ([{ passenger_name, phone }, ...]) or the legacy single passenger_name/phone.
function readPassengers(body) {
  if (Array.isArray(body.passengers)) {
    return body.passengers
      .map((p) => ({
        passenger_name: str(p && p.passenger_name),
        phone: str(p && p.phone) || null,
      }))
      .filter((p) => p.passenger_name.length > 0);
  }
  const name = str(body.passenger_name);
  if (!name) return [];
  return [{ passenger_name: name, phone: str(body.phone) || null }];
}

// --- Pages ---
router.get('/login', (req, res) => {
  if (req.session && req.session.hotelId) return res.redirect('/hotel');
  res.sendFile(path.join(VIEWS, 'login.html'));
});

router.get('/hotel', requireHotelPage, (req, res) => {
  res.sendFile(path.join(VIEWS, 'hotel.html'));
});

// --- Auth ---
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!isNonEmpty(username) || !isNonEmpty(password)) {
    return res
      .status(400)
      .json({ error: 'Username and password are required.', code: 'fields_required' });
  }
  const hotel = db
    .prepare('SELECT * FROM hotels WHERE username = ?')
    .get(username.trim());
  if (!hotel || !bcrypt.compareSync(password, hotel.password_hash)) {
    return res
      .status(401)
      .json({ error: 'Invalid username or password.', code: 'invalid_credentials' });
  }
  req.session.hotelId = hotel.id;
  req.session.hotelName = hotel.name;
  req.session.hotelUsername = hotel.username;
  req.session.role = 'hotel';
  res.json({ ok: true, redirect: '/hotel', hotel: { id: hotel.id, name: hotel.name } });
});

router.post('/register', (req, res) => {
  const { name, username, password } = req.body || {};
  if (!isNonEmpty(name) || !isNonEmpty(username) || !isNonEmpty(password)) {
    return res.status(400).json({
      error: 'Hotel name, username and password are required.',
      code: 'reg_required',
    });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 6 characters.', code: 'password_short' });
  }
  const existing = db
    .prepare('SELECT id FROM hotels WHERE username = ?')
    .get(username.trim());
  if (existing) {
    return res
      .status(409)
      .json({ error: 'That username is already taken.', code: 'username_taken' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO hotels (name, username, password_hash) VALUES (?, ?, ?)')
    .run(name.trim(), username.trim(), hash);

  req.session.hotelId = info.lastInsertRowid;
  req.session.hotelName = name.trim();
  req.session.hotelUsername = username.trim();
  req.session.role = 'hotel';
  res.status(201).json({ ok: true, redirect: '/hotel' });
});

// --- Add transfer(s): one or more passengers in a single operation ---
router.post('/hotel/transfer', requireHotelApi, (req, res) => {
  const body = req.body || {};
  const shared = readShared(body);
  if (!isNonEmpty(shared.flight_code)) {
    return res.status(400).json({ error: 'Flight code is required.', code: 'flight_required' });
  }
  if (!isNonEmpty(shared.arrival_datetime)) {
    return res
      .status(400)
      .json({ error: 'Arrival date & time is required.', code: 'arrival_required' });
  }
  const passengers = readPassengers(body);
  if (passengers.length === 0) {
    return res
      .status(400)
      .json({ error: 'At least one passenger name is required.', code: 'passenger_required' });
  }

  const insert = db.prepare(
    `INSERT INTO transfers
       (hotel_id, flight_code, passenger_name, arrival_datetime,
        departure_datetime, phone, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const ids = [];
  const insertAll = db.transaction((rows) => {
    for (const p of rows) {
      const info = insert.run(
        req.session.hotelId,
        shared.flight_code,
        p.passenger_name,
        shared.arrival_datetime,
        shared.departure_datetime,
        p.phone,
        shared.notes
      );
      ids.push(info.lastInsertRowid);
    }
  });
  insertAll(passengers);

  const placeholders = ids.map(() => '?').join(',');
  const created = db
    .prepare(`SELECT * FROM transfers WHERE id IN (${placeholders})`)
    .all(...ids);
  res.status(201).json({ ok: true, count: created.length, transfers: created });
});

// --- Edit a single transfer (one passenger record) ---
router.put('/hotel/transfer/:id', requireHotelApi, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id.', code: 'invalid_id' });
  }
  const existing = db
    .prepare('SELECT id FROM transfers WHERE id = ? AND hotel_id = ?')
    .get(id, req.session.hotelId);
  if (!existing) {
    return res.status(404).json({ error: 'Transfer not found.', code: 'not_found' });
  }

  const body = req.body || {};
  const flight_code = str(body.flight_code);
  const passenger_name = str(body.passenger_name);
  const arrival_datetime = str(body.arrival_datetime);
  const departure_datetime = str(body.departure_datetime) || null;
  const phone = str(body.phone) || null;
  const notes = str(body.notes) || null;

  if (!isNonEmpty(flight_code)) {
    return res.status(400).json({ error: 'Flight code is required.', code: 'flight_required' });
  }
  if (!isNonEmpty(passenger_name)) {
    return res
      .status(400)
      .json({ error: 'At least one passenger name is required.', code: 'passenger_required' });
  }
  if (!isNonEmpty(arrival_datetime)) {
    return res
      .status(400)
      .json({ error: 'Arrival date & time is required.', code: 'arrival_required' });
  }

  db.prepare(
    `UPDATE transfers
        SET flight_code = ?, passenger_name = ?, arrival_datetime = ?,
            departure_datetime = ?, phone = ?, notes = ?,
            updated_at = datetime('now')
      WHERE id = ? AND hotel_id = ?`
  ).run(
    flight_code,
    passenger_name,
    arrival_datetime,
    departure_datetime,
    phone,
    notes,
    id,
    req.session.hotelId
  );
  const row = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id);
  res.json({ ok: true, transfer: row });
});

router.delete('/hotel/transfer/:id', requireHotelApi, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id.', code: 'invalid_id' });
  }
  const info = db
    .prepare('DELETE FROM transfers WHERE id = ? AND hotel_id = ?')
    .run(id, req.session.hotelId);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Transfer not found.', code: 'not_found' });
  }
  res.json({ ok: true });
});

module.exports = router;
