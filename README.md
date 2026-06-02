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
- Dates/times are shown Turkey-style — `gün.ay.yıl 24:saat` (e.g. `01.06.2026 14:30`).

### Hotel panel (`/login` → `/hotel`)
- Register / log in (hotel name, username, password)
- **Add multiple passengers in a single operation** — shared flight/arrival/
  departure/notes plus a list of passengers (each with an optional phone);
  one record is created per passenger
- **Departure and phone are optional** — you can record an arrival-only transfer
- Add, edit, and delete passenger transfer records
- A hotel only ever sees and manages **its own** records

### Driver panel (`/driver/login` → `/driver`)
- 3 separate driver accounts
- See **all** records from **all** hotels, sorted by arrival time (soonest first)
- **List (stacked) or Card** view toggle (remembered per browser)
- Hotel name shown on every record
- Toggle a transfer **done / pending**
- Filter by **Today / Upcoming / Completed / All**
- Live **pending count** badge

### Security
- Passwords hashed with **bcryptjs**
- Sessions via **express-session** with `SESSION_SECRET` from the environment
- Session middleware protects the `/hotel` and `/driver` routes
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
   | `PORT`           | *(leave unset — Railway provides it)*  |

5. **Deploy.** The app auto-starts (`node app.js`, bound to `0.0.0.0`), and
   Railway health-checks `GET /health`. Tables + default accounts are created
   on first boot.

---

## 3. Default login credentials

Seeded automatically on first run.

**Drivers** (`/driver/login`)

| Username | Password   |
| -------- | ---------- |
| `sofor1` | `Sofor123` |
| `sofor2` | `Sofor456` |
| `sofor3` | `Sofor789` |

**Demo hotels** (`/login`)

| Username | Password   |
| -------- | ---------- |
| `hotel1` | `Hotel123` |
| `hotel2` | `Hotel456` |

> Change or remove these before any real-world use.

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
| GET    | `/driver/login`                      | Driver login page                    |
| POST   | `/driver/login`                      | Driver authentication                |
| GET    | `/driver`                            | Driver dashboard *(auth)*            |
| POST   | `/driver/transfer/:id/complete`      | Toggle complete/pending *(auth)*     |
| GET    | `/api/transfers`                     | Logged-in hotel's transfers (JSON)   |
| GET    | `/api/all-transfers`                 | All transfers for drivers (JSON)     |
| GET    | `/api/me`                            | Current session identity (JSON)      |
| POST   | `/logout`                            | Clear the session                    |
| GET    | `/health`                            | Health check → `200 OK`              |

---

## Project structure

```
.
├── app.js              # Express server: sessions, routers, health check
├── database.js         # SQLite init + auto-seed (drivers, demo hotels)
├── routes/
│   ├── hotel.js        # hotel auth + transfer CRUD (scoped to hotel)
│   ├── driver.js       # driver auth + complete toggle
│   └── api.js          # JSON endpoints for the dashboards
├── public/
│   ├── style.css       # all styles (mobile-friendly)
│   └── i18n.js         # TR/EN translations + language switch + TR date format
├── views/
│   ├── login.html      # hotel login + register
│   ├── hotel.html      # hotel dashboard (form + table)
│   ├── driver-login.html
│   └── driver.html     # driver dashboard (cards + filters)
├── Procfile            # web: node app.js
├── railway.json        # NIXPACKS build + /data volume + healthcheck
├── .railwayignore
├── .env.example
└── package.json
```

## Database schema

```
hotels   (id, name, username, password_hash, created_at)
transfers(id, hotel_id, flight_code, passenger_name, arrival_datetime,
          departure_datetime, phone, notes, status, created_at, updated_at)
          status ∈ { 'pending', 'completed' }
drivers  (id, username, password_hash, full_name, created_at)
```
