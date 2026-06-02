'use strict';

/**
 * Transfer Management System — main Express server.
 *
 * Routes overview:
 *   GET  /                              redirect -> /login
 *   GET  /login                         hotel login page          (routes/hotel.js)
 *   POST /login                         hotel auth                (routes/hotel.js)
 *   POST /register                      hotel registration        (routes/hotel.js)
 *   GET  /hotel                         hotel dashboard (auth)    (routes/hotel.js)
 *   POST /hotel/transfer                add transfer    (auth)    (routes/hotel.js)
 *   PUT  /hotel/transfer/:id            edit transfer   (auth)    (routes/hotel.js)
 *   DELETE /hotel/transfer/:id          delete transfer (auth)    (routes/hotel.js)
 *   GET  /driver/login                  driver login page         (routes/driver.js)
 *   POST /driver/login                  driver auth               (routes/driver.js)
 *   GET  /driver                        driver dashboard (auth)   (routes/driver.js)
 *   POST /driver/transfer/:id/complete  toggle complete (auth)    (routes/driver.js)
 *   GET  /api/transfers                 hotel's own transfers     (routes/api.js)
 *   GET  /api/all-transfers             all transfers for driver  (routes/api.js)
 *   GET  /api/me                        current session identity  (routes/api.js)
 *   POST /logout                        clear session             (this file)
 *   GET  /health                        Railway health check      (this file)
 */

const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const { init, DB_PATH } = require('./database');
const hotelRoutes = require('./routes/hotel');
const driverRoutes = require('./routes/driver');
const apiRoutes = require('./routes/api');

// Create tables + seed default accounts on first run.
init();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Railway terminates TLS at a proxy; trust it so secure cookies work.
app.set('trust proxy', 1);

// Body parsing.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static assets (stylesheet, etc.).
app.use(express.static(path.join(__dirname, 'public')));

// Persist sessions to SQLite so logins survive restarts / redeploys.
// The sessions DB lives next to the main DB (e.g. inside the /data volume).
const sessionDir = path.dirname(DB_PATH);
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: sessionDir }),
    secret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// --- Health check (Railway) ---
app.get('/health', (req, res) => res.status(200).send('OK'));

// --- Root -> hotel login ---
app.get('/', (req, res) => res.redirect('/login'));

// --- Logout (shared by hotel + driver) ---
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true, redirect: '/login' });
  });
});

// --- Feature routers ---
app.use('/', hotelRoutes); // /login, /register, /hotel, /hotel/transfer...
app.use('/driver', driverRoutes); // /driver/login, /driver, /driver/transfer/:id/complete
app.use('/api', apiRoutes); // /api/transfers, /api/all-transfers, /api/me

// --- 404 fallback ---
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).send('Not found');
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Server error' });
  }
  res.status(500).send('Server error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Transfer Management System running on http://0.0.0.0:${PORT} (${NODE_ENV})`
  );
});

module.exports = app;
