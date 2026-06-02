'use strict';

/**
 * Simple in-memory login throttle. After MAX failed attempts from one IP within
 * WINDOW_MS, further attempts are blocked until the window expires; a successful
 * login clears the counter. In-memory state is fine for a single Railway
 * instance (it resets on redeploy, which is acceptable for this protection).
 */

const MAX = 30; // allowed failed attempts per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const attempts = new Map(); // ip -> { count, first }

function keyFor(req) {
  return (req && (req.ip || (req.connection && req.connection.remoteAddress))) || 'unknown';
}

// True if this IP has hit the limit (and the window is still open).
function blocked(req) {
  const k = keyFor(req);
  const rec = attempts.get(k);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(k);
    return false;
  }
  return rec.count >= MAX;
}

function fail(req) {
  const k = keyFor(req);
  const now = Date.now();
  const rec = attempts.get(k);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(k, { count: 1, first: now });
  } else {
    rec.count += 1;
  }
}

function succeed(req) {
  attempts.delete(keyFor(req));
}

module.exports = { blocked, fail, succeed, MAX, WINDOW_MS };
