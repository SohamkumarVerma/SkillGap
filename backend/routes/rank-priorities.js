/**
 * POST /api/rank-priorities
 *
 * Body (JSON):
 *   {
 *     skills: [{ skill: string, frequency: number }, ...],  // from /upload-jd
 *     text:   string   // optional — the raw JD text, used for position scoring
 *   }
 *
 * Returns:
 *   {
 *     ranked: [{ topic, weight, frequency, position_bonus, covered, question_count }],
 *     uncovered: string[]   // skills with no matching questions in DB
 *   }
 *
 * Scoring model
 * ─────────────
 * raw_score = freq_score + position_bonus
 *
 *   freq_score    = log2(frequency + 1) / log2(MAX_FREQ + 1)   → [0, 1]
 *                   (log scale so "mentioned 10x" isn't 10× more important
 *                    than "mentioned 5x" — both are clearly required)
 *
 *   position_bonus = 0.0 – 0.3 depending on where in the JD the skill
 *                   first appears:
 *                     top 15% of text  → +0.30  (title / summary)
 *                     top 40%          → +0.20  (requirements section)
 *                     top 70%          → +0.10  (responsibilities)
 *                     bottom 30%       → +0.00  (nice-to-have / footer)
 *
 * weight = clamp(raw_score, 0, 1), rounded to 2 dp
 *
 * After scoring, skills are matched against the questions.tags column in
 * SQLite.  coverage = true when ≥1 question has that tag.  Uncovered skills
 * are returned separately so future phases can flag gaps.
 */

const express = require("express");
const { getDb } = require("../db/init");

const router = express.Router();

// ── Tuneable constants (easy to adjust after real-JD testing) ─────────────────
const POSITION_WEIGHTS = [
  { threshold: 0.15, bonus: 0.30 }, // title / opening summary
  { threshold: 0.40, bonus: 0.20 }, // requirements / qualifications
  { threshold: 0.70, bonus: 0.10 }, // responsibilities / day-to-day
  { threshold: 1.00, bonus: 0.00 }, // nice-to-have / benefits / footer
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Clamp x to [min, max] */
const clamp = (x, min, max) => Math.min(max, Math.max(min, x));

/**
 * Find the first character position (0–1 relative to text length) where any
 * of the keyword's variants appear in the JD text.
 * Returns 1.0 (bottom of doc) if not found — position bonus = 0.
 *
 * @param {string} lowerText   JD text already lowercased
 * @param {string} skill       canonical skill name
 * @returns {number}           relative position [0, 1]
 */
function firstPosition(lowerText, skill) {
  if (!lowerText) return 1.0;
  // Simple approach: search for the skill name itself (hyphens → spaces too)
  const probe = skill.replace(/-/g, " ");
  const idx = lowerText.indexOf(probe);
  if (idx === -1) {
    // Fallback: try the raw canonical with hyphens
    const idx2 = lowerText.indexOf(skill);
    if (idx2 === -1) return 1.0;
    return idx2 / lowerText.length;
  }
  return idx / lowerText.length;
}

/**
 * Map a relative position [0,1] to a position bonus score.
 */
function positionBonus(relPos) {
  for (const { threshold, bonus } of POSITION_WEIGHTS) {
    if (relPos <= threshold) return bonus;
  }
  return 0;
}

/**
 * Build a Set of all tags that have at least one question in the DB.
 * Cached for the lifetime of the process (tags only change on reseed).
 */
let _coveredTagsCache = null;
function getCoveredTags() {
  if (_coveredTagsCache) return _coveredTagsCache;
  const db = getDb();
  const rows = db.prepare("SELECT tags FROM questions WHERE tags IS NOT NULL").all();
  _coveredTagsCache = new Set();
  for (const row of rows) {
    try {
      JSON.parse(row.tags).forEach((t) => _coveredTagsCache.add(t));
    } catch (_) { /* malformed row — skip */ }
  }
  return _coveredTagsCache;
}

/**
 * Count how many questions cover a given tag.
 */
function questionCountForTag(tag) {
  const db = getDb();
  // SQLite JSON: use LIKE to check if the tag string appears in the JSON array
  const { count } = db
    .prepare(
      `SELECT COUNT(*) AS count FROM questions
       WHERE tags LIKE ?`
    )
    .get(`%"${tag}"%`);
  return count;
}

// ── Core ranking function (exported so tests / other routes can reuse it) ─────

/**
 * @param {{ skill: string, frequency: number }[]} skills
 * @param {string} [rawText]  optional JD text for position scoring
 * @returns {{ ranked: object[], uncovered: string[] }}
 */
function rankSkills(skills, rawText = "") {
  if (!skills || skills.length === 0) return { ranked: [], uncovered: [] };

  const lowerText = rawText.toLowerCase();
  const coveredTags = getCoveredTags();
  const maxFreq = Math.max(...skills.map((s) => s.frequency), 1);

  const ranked = [];
  const uncovered = [];

  for (const { skill, frequency } of skills) {
    // ── Frequency score (log-scaled, normalised to max in this JD) ──────────
    const freqScore = Math.log2(frequency + 1) / Math.log2(maxFreq + 1);

    // ── Position bonus ────────────────────────────────────────────────────────
    const relPos = firstPosition(lowerText, skill);
    const posBonus = positionBonus(relPos);

    // ── Final weight ──────────────────────────────────────────────────────────
    const raw = freqScore + posBonus;
    const weight = Math.round(clamp(raw, 0, 1) * 100) / 100;

    // ── DB coverage ───────────────────────────────────────────────────────────
    const covered = coveredTags.has(skill);
    const question_count = covered ? questionCountForTag(skill) : 0;

    if (covered) {
      ranked.push({ topic: skill, weight, frequency, position_bonus: posBonus, covered, question_count });
    } else {
      uncovered.push(skill);
    }
  }

  // Sort by weight desc, break ties by question_count desc (more coverage = more useful)
  ranked.sort((a, b) => b.weight - a.weight || b.question_count - a.question_count);

  return { ranked, uncovered };
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post("/", (req, res) => {
  const { skills, text } = req.body;

  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({
      error: "Body must include a non-empty `skills` array from /api/upload-jd.",
    });
  }

  // Validate shape — each entry needs { skill: string, frequency: number }
  for (const s of skills) {
    if (typeof s.skill !== "string" || typeof s.frequency !== "number") {
      return res.status(400).json({
        error: "Each skill entry must have { skill: string, frequency: number }.",
      });
    }
  }

  const { ranked, uncovered } = rankSkills(skills, text || "");

  return res.json({
    total_input: skills.length,
    ranked_count: ranked.length,
    uncovered_count: uncovered.length,
    ranked,
    uncovered,
  });
});

module.exports = router;
module.exports.rankSkills = rankSkills; // named export for reuse
