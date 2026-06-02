'use strict';

/**
 * JSON API consumed by the dashboards.
 *   GET /api/transfers      -> the logged-in hotel's own transfers
 *   GET /api/all-transfers  -> every transfer (driver view) + hotel name
 *   GET /api/me             -> current session identity (hotel or driver)
 */

const express = require('express');
const { db } = require('../database');

const router = express.Router();

function requireHotelApi(req, res, next) {
  if (req.session && req.session.hotelId) return next();
  return res.status(401).json({ error: 'Not authenticated', redirect: '/login' });
}
function requireDriverApi(req, res, next) {
  if (req.session && req.session.driverId) return next();
  return res
    .status(401)
    .json({ error: 'Not authenticated', redirect: '/driver/login' });
}

// Current logged-in identity, used to show a name in the dashboard header.
router.get('/me', (req, res) => {
  if (req.session && req.session.hotelId) {
    return res.json({
      role: 'hotel',
      id: req.session.hotelId,
      name: req.session.hotelName,
      username: req.session.hotelUsername,
    });
  }
  if (req.session && req.session.driverId) {
    return res.json({
      role: 'driver',
      id: req.session.driverId,
      name: req.session.driverName,
      username: req.session.driverUsername,
    });
  }
  res.status(401).json({ error: 'Not authenticated' });
});

// Hotel: only its own transfers, soonest arrival first.
router.get('/transfers', requireHotelApi, (req, res) => {
  const rows = db
    .prepare(
      'SELECT * FROM transfers WHERE hotel_id = ? ORDER BY arrival_datetime ASC, id ASC'
    )
    .all(req.session.hotelId);
  res.json({ transfers: rows });
});

// Driver: all transfers from all hotels (with hotel name), soonest first.
router.get('/all-transfers', requireDriverApi, (req, res) => {
  const rows = db
    .prepare(
      `SELECT t.*, h.name AS hotel_name
         FROM transfers t
         JOIN hotels h ON h.id = t.hotel_id
        ORDER BY t.arrival_datetime ASC, t.id ASC`
    )
    .all();
  const pending = rows.filter((r) => r.status === 'pending').length;
  res.json({ transfers: rows, pending });
});

module.exports = router;
