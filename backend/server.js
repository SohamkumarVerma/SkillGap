const express = require("express");
const cors    = require("cors");
const http    = require("http");
const { initDb } = require("./db/init");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── DB init (creates file + tables if needed) ─────────────────────────────────
const db = initDb();

function localDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/upload-jd",        require("./routes/upload-jd"));
app.use("/api/rank-priorities",  require("./routes/rank-priorities"));
app.use("/api/generate-test",    require("./routes/generate-test"));
app.use("/api/submit-test",      require("./routes/submit-test"));
app.use("/api/generate-roadmap", require("./routes/generate-roadmap"));
app.use("/api/daily-activity",   require("./routes/daily-activity"));

// ── GET /api/roadmap — restore dashboard on page reload ───────────────────────
app.get("/api/roadmap", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT day_number AS day, topic, description, resource_link, tasks, completed
       FROM roadmap ORDER BY day_number`
    )
    .all()
    .map((r) => ({
      ...r,
      // Parse the tasks JSON; fall back to a single-task array using the
      // legacy resource_link column so old rows still render correctly.
      tasks: (() => {
        try { return r.tasks ? JSON.parse(r.tasks) : null; } catch { return null; }
      })() ?? [{ description: r.description ?? "", resource_link: r.resource_link }],
    }));

  if (rows.length === 0) return res.json({ roadmap: [] });
  res.json({ source: "restored", days: rows.length, roadmap: rows });
});

// ── PATCH /api/roadmap/:day — persist completion for a roadmap day ───────────
app.patch("/api/roadmap/:day", (req, res) => {
  const day = Number.parseInt(req.params.day, 10);
  const completed = req.body?.completed === true ? 1 : 0;

  if (!Number.isInteger(day) || day < 1) {
    return res.status(400).json({ error: "Day must be a positive integer." });
  }

  const result = db
    .prepare("UPDATE roadmap SET completed = ? WHERE day_number = ?")
    .run(completed, day);

  if (result.changes === 0) {
    return res.status(404).json({ error: `Roadmap day ${day} not found.` });
  }

  res.json({ day, completed: Boolean(completed) });
});

// ── PATCH /api/roadmap/:day/task/:index — persist task completion timestamp ──
app.patch("/api/roadmap/:day/task/:index", (req, res) => {
  const day = Number.parseInt(req.params.day, 10);
  const index = Number.parseInt(req.params.index, 10);
  const completed = req.body?.completed === true;

  if (!Number.isInteger(day) || day < 1 || !Number.isInteger(index) || index < 0) {
    return res.status(400).json({ error: "Day and task index must be valid non-negative integers." });
  }

  const row = db
    .prepare("SELECT tasks, description, resource_link FROM roadmap WHERE day_number = ?")
    .get(day);
  if (!row) return res.status(404).json({ error: `Roadmap day ${day} not found.` });

  let tasks;
  try { tasks = row.tasks ? JSON.parse(row.tasks) : null; } catch { tasks = null; }
  if (!Array.isArray(tasks) || tasks.length === 0) {
    tasks = [{ description: row.description ?? "", resource_link: row.resource_link }];
  }
  if (index >= tasks.length) {
    return res.status(404).json({ error: `Task ${index} not found on roadmap day ${day}.` });
  }

  const previousCompletedAt = tasks[index].completed_at ?? null;
  tasks[index] = {
    ...tasks[index],
    completed_at: completed ? new Date().toISOString() : null,
  };
  const dayCompleted = tasks.every((task) => Boolean(task.completed_at));

  db.prepare("UPDATE roadmap SET tasks = ?, completed = ? WHERE day_number = ?")
    .run(JSON.stringify(tasks), dayCompleted ? 1 : 0, day);

  res.json({
    day,
    index,
    completed,
    completed_at: tasks[index].completed_at,
    previous_completed_at: previousCompletedAt,
    activity_date: completed
      ? localDate()
      : previousCompletedAt ? localDate(previousCompletedAt) : null,
    day_completed: dayCompleted,
  });
});

// ── DELETE /api/roadmap — wipe roadmap so user can start fresh ────────────────
app.delete("/api/roadmap", (_req, res) => {
  db.prepare("DELETE FROM roadmap").run();
  res.json({ ok: true });
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((r) => r.name);

  // Non-blocking Ollama check
  const ollamaReq = http.get(
    { hostname: "localhost", port: 11434, path: "/api/tags", timeout: 1500 },
    (ollamaRes) => {
      ollamaRes.resume(); // drain
      res.json({ status: "ok", db: "connected", tables, ollama: "running" });
    }
  );
  ollamaReq.on("error", () => {
    res.json({ status: "ok", db: "connected", tables, ollama: "not detected" });
  });
  ollamaReq.on("timeout", () => {
    ollamaReq.destroy();
    res.json({ status: "ok", db: "connected", tables, ollama: "not detected" });
  });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? "An unexpected server error occurred." : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Backend running at http://localhost:${PORT}`);
  console.log(`[server] SQLite: ${db.name}`);
});

// ── Process guards — prevent silent crashes ───────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught exception:", err);
  // Don't exit — keep serving other requests
});
process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled rejection:", reason);
});
