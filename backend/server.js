const express = require("express");
const cors    = require("cors");
const http    = require("http");
const { initDb } = require("./db/init");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── DB init (creates file + tables if needed) ─────────────────────────────────
const db = initDb();

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
    .prepare("SELECT day_number AS day, topic, description, resource_link FROM roadmap ORDER BY day_number")
    .all();
  if (rows.length === 0) return res.json({ roadmap: [] });
  res.json({
    source:  "restored",
    days:    rows.length,
    roadmap: rows,
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
