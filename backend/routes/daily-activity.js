/**
 * /api/daily-activity
 *
 * GET  /api/daily-activity
 *   Returns all rows from daily_activity ordered by date ASC.
 *   Used by the heatmap to paint the full year.
 *
 * POST /api/daily-activity
 *   Body: { tasks_completed?: number }   (default increment by 1)
 *   Upserts today's row: sets active = 1, increments tasks_completed.
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
  const date      = today();
  const increment = Math.max(1, parseInt(req.body?.tasks_completed, 10) || 1);

  // INSERT new row or UPDATE existing one atomically
  db.prepare(
    `INSERT INTO daily_activity (date, active, tasks_completed)
     VALUES (?, 1, ?)
     ON CONFLICT(date) DO UPDATE SET
       active           = 1,
       tasks_completed  = tasks_completed + ?`
  ).run(date, increment, increment);

  const row = db
    .prepare("SELECT date, active, tasks_completed FROM daily_activity WHERE date = ?")
    .get(date);

  res.json({ date, ...row });
});

module.exports = router;
