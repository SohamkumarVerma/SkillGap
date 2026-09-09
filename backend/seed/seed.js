/**
 * seed.js — Populate the questions table from the JSON question banks.
 *
 * Usage:
 *   node backend/seed/seed.js          (from project root)
 *   node seed/seed.js                  (from backend/)
 *
 * Safe to re-run: uses INSERT OR IGNORE so existing rows are skipped.
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// ── Paths ─────────────────────────────────────────────────────────────────────
const DB_PATH = path.resolve(__dirname, "../db/skillgap.sqlite");
const SCHEMA_PATH = path.resolve(__dirname, "../db/schema.sql");

const SEED_FILES = [
  path.join(__dirname, "webdev.json"),
  path.join(__dirname, "dsa.json"),
  path.join(__dirname, "csfundamentals.json"),
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Some resource_link values are formatted as Markdown links: [text](url)
 * Strip the wrapper and return the bare URL.
 */
function extractUrl(raw) {
  if (!raw) return null;
  const match = raw.match(/\(([^)]+)\)\s*$/);
  return match ? match[1] : raw;
}

/**
 * Normalise a single question record before insertion.
 */
function normalise(q) {
  return {
    topic: q.topic,
    difficulty: q.difficulty,
    question_text: q.question_text,
    options: Array.isArray(q.options) ? JSON.stringify(q.options) : null,
    correct_answer: q.correct_answer,
    resource_link: extractUrl(q.resource_link),
    tags: Array.isArray(q.tags) ? JSON.stringify(q.tags) : null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  // Ensure the DB file and schema exist
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);

  // Prepared statement — INSERT OR IGNORE keeps the script idempotent
  const insert = db.prepare(`
    INSERT OR IGNORE INTO questions
      (topic, difficulty, question_text, options, correct_answer, resource_link, tags)
    VALUES
      (@topic, @difficulty, @question_text, @options, @correct_answer, @resource_link, @tags)
  `);

  const insertMany = db.transaction((questions) => {
    let inserted = 0;
    for (const q of questions) {
      const info = insert.run(normalise(q));
      inserted += info.changes; // 1 if inserted, 0 if ignored
    }
    return inserted;
  });

  let totalLoaded = 0;
  let totalInserted = 0;

  for (const filePath of SEED_FILES) {
    const fileName = path.basename(filePath);

    if (!fs.existsSync(filePath)) {
      console.warn(`[seed] WARN: ${fileName} not found — skipping.`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!Array.isArray(raw)) {
      console.warn(`[seed] WARN: ${fileName} is not a JSON array — skipping.`);
      continue;
    }

    const inserted = insertMany(raw);
    console.log(
      `[seed] ${fileName}: ${raw.length} loaded, ${inserted} inserted` +
        (raw.length - inserted > 0
          ? `, ${raw.length - inserted} already existed (skipped)`
          : "")
    );

    totalLoaded += raw.length;
    totalInserted += inserted;
  }

  // Final count straight from the DB — ground truth
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM questions").get();

  console.log("─".repeat(50));
  console.log(
    `[seed] Done. ${totalInserted} new rows inserted across ${SEED_FILES.length} files.`
  );
  console.log(`[seed] Total questions in DB: ${count}`);

  db.close();
}

main();
