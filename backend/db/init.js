const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// DB file lives at backend/db/skillgap.sqlite
const DB_PATH = path.join(__dirname, "skillgap.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

let db;

function getDb() {
  if (!db) {
    throw new Error("Database not initialised. Call initDb() first.");
  }
  return db;
}

function initDb() {
  db = new Database(DB_PATH);

  // WAL mode — better concurrent read performance and crash safety
  db.pragma("journal_mode = WAL");
  // Enforce foreign-key constraints (off by default in SQLite)
  db.pragma("foreign_keys = ON");

  // Read and execute the schema (all statements are IF NOT EXISTS,
  // so this is safe to run on every startup)
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);

  // ── Migrations — add columns that didn't exist in earlier versions ─────────
  // SQLite has no IF NOT EXISTS for ALTER TABLE, so we check pragma table_info.
  const roadmapCols = db.pragma("table_info(roadmap)").map((c) => c.name);
  if (!roadmapCols.includes("tasks")) {
    db.exec("ALTER TABLE roadmap ADD COLUMN tasks TEXT");
    console.log("[db] Migration applied: roadmap.tasks column added");
  }

  console.log(`[db] SQLite ready → ${DB_PATH}`);
  return db;
}

module.exports = { initDb, getDb };
