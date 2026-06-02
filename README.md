# Transfer Management System

A full-stack web app for coordinating **airport ↔ hotel passenger transfers**.
Hotels record passenger pickups/drop-offs; drivers see every hotel's records in
one combined, time-sorted list and mark each transfer as done.

Built with **Node.js + Express**, **SQLite (better-sqlite3)**, sessions stored in
SQLite (connect-sqlite3), and a plain **HTML/CSS/JS** frontend — no frontend
framework.

---

## Features

### Language & formatting
- **Turkish by default**, with a **TR / EN** toggle in the top-right (remembered
  per browser via `localStorage`).
- Dates/times are shown as **`gg/aa/yyyy HH:mm`** (24-hour, e.g. `01/06/2026 14:30`).

### Hotel panel (`/login` → `/hotel`)
- Register / log in (hotel name, username, password)
- **Add multiple passengers in a single operation** — shared flight/arrival/
  departure/notes plus a list of passengers (each with an optional phone);
  one record is created per passenger
- **Departure and phone are optional** — you can record an arrival-only transfer
- Passengers added together are **shown grouped**; edit a whole booking at once
  (including adding/removing passengers) or delete the group
- A hotel only ever sees and manages **its own** records

### Driver panel (`/driver/login` → `/driver`)
- See **all** records from **all** hotels, sorted by arrival time (soonest first)
- Passengers from the same booking are **grouped** in one card/row
- **List (stacked) or Card** view toggle (remembered per browser)
- Hotel name shown on every record
- Toggle a transfer **done / pending**
- Filter by **Today / Upcoming / Completed / All**
- Live **pending count** badge

### Admin panel (`/admin/login` → `/admin`)
- Single admin, authenticated via **environment variables** (`ADMIN_USER` /
  `ADMIN_PASS`) — no admin account in the database
- Add / edit / delete hotels and drivers, and set their passwords
- Review every transfer (grouped, read-only)

### Security
- Passwords hashed with **bcryptjs**
- Sessions via **express-session** with `SESSION_SECRET` from the environment
- Session middleware protects the `/hotel`, `/driver` and `/admin` routes
- **Login throttling**: after 30 failed attempts from one IP, logins are
  temporarily blocked
- All SQL uses parameterized statements; the frontend renders data via
  `textContent` (no `innerHTML`) to avoid XSS

---

## 1. Run locally

Requires **Node.js ≥ 18**.

```bash
npm install
node app.js
```

Then open <http://localhost:3000>.

The database is created and seeded automatically on first run at
`./transfers.db` (override with `DB_PATH`). Optionally set a session secret:

```bash
SESSION_SECRET="some-long-random-string" node app.js
```

`npm run dev` and `npm start` both run `node app.js`.

> The first `npm install` compiles the native SQLite modules, so it needs a
> C/C++ toolchain (build-essential / Xcode CLT / windows-build-tools). Most dev
> machines already have this.

---

## 2. Deploy to Railway

1. **Push the code to GitHub.**

   ```bash
   git init
   git add .
   git commit -m "Transfer Management System"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect the repo on [railway.app](https://railway.app):**
   New Project → *Deploy from GitHub repo* → pick this repository.
   Railway auto-detects Node (NIXPACKS) and starts it via the `Procfile`.

3. **Add a persistent volume** so the SQLite data survives redeploys:
   Service → **Variables/Settings → Volumes → New Volume**, mount path **`/data`**.
   (This matches `volumeMounts` in `railway.json`.)

4. **Set environment variables** (Service → **Variables**):

   | Variable         | Value                                  |
   | ---------------- | -------------------------------------- |
   | `SESSION_SECRET` | a long random string                   |
   | `DB_PATH`        | `/data/transfers.db`                   |
   | `NODE_ENV`       | `production`                           |
   | `ADMIN_USER`     | admin panel username                   |
   | `ADMIN_PASS`     | admin panel password (use a strong one)|
   | `PORT`           | *(leave unset — Railway provides it)*  |

5. **Deploy.** The app auto-starts (`node app.js`, bound to `0.0.0.0`), and
   Railway health-checks `GET /health`. Tables are created on first boot; add
   hotels and drivers from the admin panel (`/admin/login`).

---

## 3. Accounts & the admin panel

The app ships with **no demo accounts** — the database starts empty. You create
hotels and drivers yourself from the **admin panel**.

**Admin login (`/admin/login`)** is configured via environment variables (never
stored in code or the database):

| Variable     | Notes                                                              |
| ------------ | ------------------------------------------------------------------ |
| `ADMIN_USER` | admin username (default `admin`)                                   |
| `ADMIN_PASS` | admin password — **required in production**; `admin` in dev if unset |

> In production, if `ADMIN_PASS` is unset, admin login is disabled.

From `/admin` you can add / edit / delete hotels and drivers, set their
passwords, and review every transfer. Hotels can also self-register at `/login`.

---

## Routes

| Method | Path                                 | Description                          |
| ------ | ------------------------------------ | ------------------------------------ |
| GET    | `/`                                  | Redirect → `/login`                  |
| GET    | `/login`                             | Hotel login / register page          |
| POST   | `/login`                             | Hotel authentication                 |
| POST   | `/register`                          | Hotel registration                   |
| GET    | `/hotel`                             | Hotel dashboard *(auth)*             |
| POST   | `/hotel/transfer`                    | Add a transfer *(auth)*              |
| PUT    | `/hotel/transfer/:id`                | Edit a transfer *(auth)*             |
| DELETE | `/hotel/transfer/:id`                | Delete a transfer *(auth)*           |
| PUT    | `/hotel/group/:groupId`              | Edit a whole booking *(auth)*        |
| DELETE | `/hotel/group/:groupId`              | Delete a whole booking *(auth)*      |
| GET    | `/driver/login`                      | Driver login page                    |
| POST   | `/driver/login`                      | Driver authentication                |
| GET    | `/driver`                            | Driver dashboard *(auth)*            |
| POST   | `/driver/transfer/:id/complete`      | Toggle complete/pending *(auth)*     |
| GET    | `/api/transfers`                     | Logged-in hotel's transfers (JSON)   |
| GET    | `/api/all-transfers`                 | All transfers for drivers (JSON)     |
| GET    | `/api/me`                            | Current session identity (JSON)      |
| GET    | `/admin/login`                       | Admin login page                     |
| POST   | `/admin/login`                       | Admin authentication                 |
| GET    | `/admin`                             | Admin panel *(admin)*                |
| GET    | `/admin/api/data`                    | Hotels, drivers, transfers (JSON)    |
| POST/PUT/DELETE | `/admin/hotels[/:id]`       | Manage hotels *(admin)*              |
| POST/PUT/DELETE | `/admin/drivers[/:id]`      | Manage drivers *(admin)*             |
| POST   | `/logout`                            | Clear the session                    |
| GET    | `/health`                            | Health check → `200 OK`              |

---

## Project structure

```
.
├── app.js              # Express server: sessions, routers, health check
├── database.js         # SQLite init + auto-migration (no demo seed)
├── routes/
│   ├── hotel.js        # hotel auth + transfer/group CRUD (scoped to hotel)
│   ├── driver.js       # driver auth + complete toggle
│   ├── admin.js        # admin auth + hotel/driver management
│   ├── api.js          # JSON endpoints for the dashboards
│   └── loginLimiter.js # in-memory login attempt throttle
├── public/
│   ├── style.css       # all styles (mobile-friendly)
│   └── i18n.js         # TR/EN translations + language switch + date format
├── views/
│   ├── login.html      # hotel login + register
│   ├── hotel.html      # hotel dashboard (form + table)
│   ├── driver-login.html
│   ├── driver.html     # driver dashboard (cards + filters)
│   ├── admin-login.html
│   └── admin.html      # admin panel (hotels, drivers, transfers)
├── Procfile            # web: node app.js
├── railway.json        # NIXPACKS build + /data volume + healthcheck
├── .railwayignore
├── .env.example
└── package.json
```

## Database schema

```
hotels   (id, name, username, password_hash, created_at)
transfers(id, hotel_id, group_id, flight_code, passenger_name, arrival_datetime,
          departure_datetime, phone, notes, status, created_at, updated_at)
          status ∈ { 'pending', 'completed' }
          group_id groups passengers added together (one booking)
drivers  (id, username, password_hash, full_name, created_at)
```
