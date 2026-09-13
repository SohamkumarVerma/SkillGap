/**
 * /api/daily-activity
 *
 * GET  /api/daily-activity
 *   Returns all rows from daily_activity ordered by date ASC.
 *   Used by the heatmap to paint the full year.
 *
 * POST /api/daily-activity
 *   Body: { tasks_delta?: number, date?: 'YYYY-MM-DD' } or { tasks_completed?: number }
 *   Upserts the supplied date (or today) and adjusts tasks_completed.
 *   Returns the updated row.
 */

const express = require("express");
const { getDb } = require("../db/init");

const router = express.Router();

/** Returns today's date as 'YYYY-MM-DD' in local time. */
function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// ── GET — full activity history ───────────────────────────────────────────────
router.get("/", (_req, res) => {
  const db   = getDb();
  const rows = db
    .prepare("SELECT date, active, tasks_completed FROM daily_activity ORDER BY date ASC")
    .all();
  res.json({ activity: rows });
});

// ── POST — mark today active, increment task count ───────────────────────────
router.post("/", (req, res) => {
  const db        = getDb();
  const date      = req.body?.date || today();
  const hasDelta  = req.body?.tasks_delta !== undefined;
  const delta     = hasDelta
    ? parseInt(req.body.tasks_delta, 10)
    : Math.max(1, parseInt(req.body?.tasks_completed, 10) || 1);

  if (!isDate(date) || !Number.isInteger(delta) || (hasDelta && delta === 0)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD and tasks_delta must be a non-zero integer." });
  }

  // INSERT new row or UPDATE existing one atomically
  db.prepare(
    `INSERT INTO daily_activity (date, active, tasks_completed)
     VALUES (?, ?, MAX(0, ?))
     ON CONFLICT(date) DO UPDATE SET
       tasks_completed  = MAX(0, tasks_completed + ?),
       active           = CASE WHEN MAX(0, tasks_completed + ?) > 0 THEN 1 ELSE 0 END`
  ).run(date, delta > 0 ? 1 : 0, delta, delta, delta);

  const row = db
    .prepare("SELECT date, active, tasks_completed FROM daily_activity WHERE date = ?")
    .get(date);

  res.json({ date, ...row });
});

module.exports = router;
