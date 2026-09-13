/**
 * POST /api/generate-test
 *
 * Body (JSON):
 *   {
 *     ranked: [{ topic, weight, question_count }, ...],  // from /rank-priorities
 *     total_questions?: number   // target test size (default 15, max 30)
 *   }
 *
 * Algorithm
 * ─────────
 * 1. Allocate question slots proportionally to weight, min 1 per covered topic.
 * 2. For each topic, pull questions tagged with it ordered by:
 *      difficulty ASC (easy → medium → hard) so every test starts accessible,
 *      then RANDOM() within the same difficulty so reruns feel fresh.
 * 3. Deduplicate — a question that satisfies multiple topics is only included once.
 * 4. If a topic has fewer questions than its allocation, the remainder is
 *    redistributed to the next-highest-weight topics.
 *
 * Returns:
 *   { test_id (timestamp), questions: [{ id, topic, difficulty,
 *     question_text, options, resource_link, tags }] }
 *   NOTE: correct_answer is intentionally excluded from this response.
 */

const express = require("express");
const { getDb } = require("../db/init");

const router = express.Router();

const DEFAULT_TOTAL = 15;
const MAX_TOTAL     = 30;
const MIN_PER_TOPIC = 1;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Allocate `total` slots across topics weighted by `weight`.
 * Returns Map<topic, allocatedCount>.
 */
function allocateSlots(ranked, total) {
  const weightSum = ranked.reduce((s, r) => s + r.weight, 0);
  if (weightSum === 0) return new Map();

  // First pass: proportional floor allocation (at least MIN_PER_TOPIC each)
  const alloc = new Map();
  let assigned = 0;
  const remainders = [];

  for (const { topic, weight } of ranked) {
    const raw = (weight / weightSum) * total;
    const floored = Math.max(MIN_PER_TOPIC, Math.floor(raw));
    alloc.set(topic, floored);
    assigned += floored;
    remainders.push({ topic, remainder: raw - Math.floor(raw) });
  }

  // Second pass: distribute leftover slots to largest remainders
  let leftover = total - assigned;
  remainders.sort((a, b) => b.remainder - a.remainder);
  for (const { topic } of remainders) {
    if (leftover <= 0) break;
    alloc.set(topic, alloc.get(topic) + 1);
    leftover--;
  }

  return alloc;
}

/**
 * Fetch up to `limit` questions for a given tag from the DB.
 * Ordered easy→medium→hard, random within tier.
 */
function fetchForTag(tag, limit) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, topic, difficulty, question_text, options, resource_link, tags
       FROM questions
       WHERE tags LIKE ?
       ORDER BY
         CASE difficulty
           WHEN 'easy'   THEN 1
           WHEN 'medium' THEN 2
           WHEN 'hard'   THEN 3
           ELSE 4
         END,
         RANDOM()
       LIMIT ?`
    )
    .all(`%"${tag}"%`, limit);
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post("/", (req, res) => {
  const { ranked, total_questions } = req.body;

  if (!Array.isArray(ranked) || ranked.length === 0) {
    return res.status(400).json({
      error: "Body must include a non-empty `ranked` array from /api/rank-priorities.",
    });
  }

  const total = Math.min(
    MAX_TOTAL,
    Math.max(1, parseInt(total_questions, 10) || DEFAULT_TOTAL)
  );

  // Only use topics that have at least 1 question in the DB
  const coveredTopics = ranked.filter((r) => r.covered && r.question_count > 0);
  if (coveredTopics.length === 0) {
    return res.status(422).json({ error: "No ranked topics have matching questions in the DB." });
  }

  const alloc = allocateSlots(coveredTopics, total);

  const seen = new Set();       // dedup by question id
  const questions = [];

  // Pull questions in weight order (highest priority first)
  for (const { topic } of coveredTopics) {
    const need = alloc.get(topic) || 0;
    if (need === 0) continue;

    const candidates = fetchForTag(topic, need * 3); // fetch 3× to have dedup headroom
    let taken = 0;

    for (const q of candidates) {
      if (taken >= need) break;
      if (seen.has(q.id)) continue;

      seen.add(q.id);
      taken++;

      // Parse JSON fields; strip correct_answer before sending to client
      questions.push({
        id:            q.id,
        topic:         q.topic,
        difficulty:    q.difficulty,
        question_text: q.question_text,
        options:       q.options ? JSON.parse(q.options) : null,
        resource_link: q.resource_link,
        tags:          q.tags ? JSON.parse(q.tags) : [],
      });
    }
  }

  if (questions.length === 0) {
    return res.status(422).json({ error: "Could not assemble any questions for the given topics." });
  }

  return res.json({
    test_id:         Date.now(),       // client uses this as a session key
    total_questions: questions.length,
    allocation: Object.fromEntries(alloc),
    questions,
  });
});

module.exports = router;
