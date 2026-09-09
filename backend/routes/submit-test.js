/**
 * POST /api/submit-test
 *
 * Body (JSON):
 *   {
 *     test_id: number,                        // from /generate-test
 *     answers: [{ question_id, user_answer }] // one entry per question
 *   }
 *
 * Steps:
 *   1. Load correct_answer for every question_id from DB.
 *   2. Compare, store each attempt in test_attempts.
 *   3. Return overall score + per-topic breakdown.
 *
 * Returns:
 *   {
 *     test_id,
 *     total:   number,
 *     correct: number,
 *     score_pct: number,            // 0-100
 *     topics: {
 *       [topicName]: { total, correct, score_pct, questions: [...] }
 *     },
 *     results: [{ question_id, topic, difficulty, question_text,
 *                 correct_answer, user_answer, is_correct, resource_link }]
 *   }
 */

const express = require("express");
const { getDb } = require("../db/init");

const router = express.Router();

router.post("/", (req, res) => {
  const { test_id, answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      error: "Body must include a non-empty `answers` array.",
    });
  }

  const db = getDb();

  // ── 1. Fetch questions from DB (includes correct_answer) ──────────────────
  const ids = answers.map((a) => a.question_id);

  // Build a parameterised IN clause
  const placeholders = ids.map(() => "?").join(", ");
  const dbRows = db
    .prepare(
      `SELECT id, topic, difficulty, question_text, correct_answer, resource_link
       FROM questions WHERE id IN (${placeholders})`
    )
    .all(...ids);

  const questionMap = new Map(dbRows.map((r) => [r.id, r]));

  // ── 2. Score answers & insert into test_attempts ──────────────────────────
  const insertAttempt = db.prepare(
    `INSERT INTO test_attempts (question_id, user_answer, is_correct)
     VALUES (?, ?, ?)`
  );

  const results = [];
  const topicBuckets = {};   // topic → { total, correct, questions[] }

  const storeAll = db.transaction(() => {
    for (const { question_id, user_answer } of answers) {
      const q = questionMap.get(question_id);
      if (!q) continue; // submitted a bogus id — skip silently

      const is_correct =
        (user_answer ?? "").trim().toLowerCase() ===
        q.correct_answer.trim().toLowerCase()
          ? 1
          : 0;

      insertAttempt.run(question_id, user_answer ?? "", is_correct);

      const result = {
        question_id,
        topic:          q.topic,
        difficulty:     q.difficulty,
        question_text:  q.question_text,
        correct_answer: q.correct_answer,
        user_answer:    user_answer ?? "",
        is_correct:     Boolean(is_correct),
        resource_link:  q.resource_link,
      };
      results.push(result);

      // Bucket by topic
      if (!topicBuckets[q.topic]) {
        topicBuckets[q.topic] = { total: 0, correct: 0, questions: [] };
      }
      topicBuckets[q.topic].total++;
      if (is_correct) topicBuckets[q.topic].correct++;
      topicBuckets[q.topic].questions.push(result);
    }
  });

  storeAll();

  // ── 3. Build summary ──────────────────────────────────────────────────────
  const totalAnswered = results.length;
  const totalCorrect  = results.filter((r) => r.is_correct).length;

  // Add score_pct to each topic bucket
  const topics = {};
  for (const [topic, bucket] of Object.entries(topicBuckets)) {
    topics[topic] = {
      ...bucket,
      score_pct: Math.round((bucket.correct / bucket.total) * 100),
    };
  }

  return res.json({
    test_id:   test_id ?? null,
    total:     totalAnswered,
    correct:   totalCorrect,
    score_pct: totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 100)
      : 0,
    topics,
    results,
  });
});

module.exports = router;
