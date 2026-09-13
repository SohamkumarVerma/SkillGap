/**
 * seed.js — Populate the questions table from the JSON question banks.
 *
 * Usage:
 *   node backend/seed/seed.js          (from project root)
 *   node seed/seed.js                  (from backend/)
 *
 * Safe to re-run: uses INSERT OR IGNORE so existing rows are skipped.
 */

const fs = require("fs");
const Database = require("better-sqlite3");
const path = require("path");
const { seedDatabase } = require("./loader");

// ── Paths ─────────────────────────────────────────────────────────────────────
const DB_PATH = path.resolve(__dirname, "../db/skillgap.sqlite");
const SCHEMA_PATH = path.resolve(__dirname, "../db/schema.sql");

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  // Ensure the DB file and schema exist
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);

  const questionCols = db.pragma("table_info(questions)").map((c) => c.name);
  if (!questionCols.includes("seed_file")) {
    db.exec("ALTER TABLE questions ADD COLUMN seed_file TEXT");
  }

  seedDatabase(db, { log: true });

  db.close();
}

main();
