/**
 * POST /api/generate-roadmap
 *
 * Body (JSON):
 *   {
 *     topics:     { [topicName]: { score_pct, total, correct } },  // from /submit-test
 *     ranked:     [{ topic, weight }],                             // from /rank-priorities
 *     days?:      number   // roadmap length, default 7, max 30
 *   }
 *
 * Flow
 * ────
 * 1. Derive "weak topics" — score_pct < 70 OR not attempted, sorted by weight
 * 2. Build an allowed topic→resource map from the DB (ground truth)
 * 3. Call Ollama /api/generate with a strict JSON-only prompt
 * 4. Parse JSON; if it fails retry once with a stricter reminder
 * 5. Validate every entry: topic tag must be in DB, resource_link must exist in DB
 *    Strip any entry that fails validation — never trust raw LLM output
 * 6. If validated result is empty, fall back to a deterministic DB-driven roadmap
 * 7. Store in roadmap table (truncate previous), return to client
 *
 * Returns:
 *   { source: "ollama"|"fallback", days: number, roadmap: [{ day, topic, description, resource_link }] }
 */

const express  = require("express");
const http     = require("http");
const { getDb } = require("../db/init");

const router = express.Router();

// ── Config ────────────────────────────────────────────────────────────────────
const OLLAMA_HOST    = "localhost";
const OLLAMA_PORT    = 11434;
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL || "llama3.1:8b";
const WEAK_THRESHOLD = 70;   // score_pct below this = weak topic
const DEFAULT_DAYS   = 7;
const MAX_DAYS       = 30;
const OLLAMA_TIMEOUT = 120_000; // 2 min — local models can be slow

// ── DB helpers ────────────────────────────────────────────────────────────────

/**
 * Build a map of  tag → [resource_link, ...]  from the questions table.
 * Only includes tags that appear in the allowedTags set.
 */
function buildTagResourceMap(allowedTags) {
  const db   = getDb();
  const rows = db.prepare("SELECT tags, resource_link FROM questions WHERE resource_link IS NOT NULL").all();
  const map  = {};                          // tag → Set<url>

  for (const row of rows) {
    let tags;
    try { tags = JSON.parse(row.tags); } catch { continue; }
    for (const tag of tags) {
      if (!allowedTags.has(tag)) continue;
      if (!map[tag]) map[tag] = new Set();
      map[tag].add(row.resource_link);
    }
  }

  // Convert Sets to sorted arrays for the prompt
  return Object.fromEntries(
    Object.entries(map).map(([tag, urls]) => [tag, [...urls]])
  );
}

/**
 * Build the full allowed-tag set from the DB (all tags that have questions).
 */
function getAllDbTags() {
  const db   = getDb();
  const rows = db.prepare("SELECT tags FROM questions WHERE tags IS NOT NULL").all();
  const set  = new Set();
  for (const row of rows) {
    try { JSON.parse(row.tags).forEach((t) => set.add(t)); } catch { /* skip */ }
  }
  return set;
}

/**
 * Get the complete set of valid resource_links in the DB.
 */
function getAllDbLinks() {
  const db   = getDb();
  const rows = db.prepare("SELECT DISTINCT resource_link FROM questions WHERE resource_link IS NOT NULL").all();
  return new Set(rows.map((r) => r.resource_link));
}

// ── Ollama call ───────────────────────────────────────────────────────────────

function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:  OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.2 },   // low temp → more deterministic JSON
    });

    const req = http.request(
      {
        hostname: OLLAMA_HOST,
        port:     OLLAMA_PORT,
        path:     "/api/generate",
        method:   "POST",
        headers:  {
          "Content-Type":   "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Ollama HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
          }
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed.response ?? "");
          } catch {
            reject(new Error("Ollama response was not valid JSON wrapper"));
          }
        });
      }
    );

    req.setTimeout(OLLAMA_TIMEOUT, () => {
      req.destroy();
      reject(new Error(`Ollama request timed out after ${OLLAMA_TIMEOUT / 1000}s`));
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(weakTopics, tagResourceMap, days, isRetry = false) {
  const topicLines = weakTopics
    .map((t) => `- ${t}`)
    .join("\n");

  // Only include the first resource link per topic to keep the prompt short
  const resourceLines = Object.entries(tagResourceMap)
    .map(([tag, links]) => `- ${tag}: ${links[0]}`)
    .join("\n");

  const retryReminder = isRetry
    ? "\n⚠️  IMPORTANT: Your previous response was not valid JSON. Return ONLY the JSON object below — no explanation, no markdown, no code fences.\n"
    : "";

  return `${retryReminder}You are a study roadmap generator. You MUST follow these rules strictly:
1. Only use topics from the ALLOWED TOPICS list below. Do not invent topics.
2. Only use resource_link URLs from the ALLOWED RESOURCES list below. Do not invent URLs.
3. Return ONLY valid JSON — no markdown, no code fences, no explanation text.
4. Each day must have exactly one topic from the allowed list.

Weak topics to focus on (from test results):
${topicLines}

ALLOWED TOPICS AND RESOURCES (use only these):
${resourceLines}

Generate a ${days}-day study roadmap covering the weak topics above.
Prioritise topics with lower test scores. Repeat a topic on a second day only if it appears in the weak list and the list is shorter than ${days} topics.

Return ONLY this exact JSON structure:
{
  "roadmap": [
    { "day": 1, "topic": "topic-slug-from-list", "description": "one sentence study goal", "resource_link": "url-from-list" }
  ]
}`;
}

// ── JSON extraction ───────────────────────────────────────────────────────────

/**
 * Try to extract a JSON object from the LLM response.
 * Handles cases where the model wraps JSON in markdown fences.
 */
function extractJson(text) {
  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();

  // Try full parse first
  try { return JSON.parse(stripped); } catch { /* fall through */ }

  // Try finding the first { ... } block
  const start = stripped.indexOf("{");
  const end   = stripped.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(stripped.slice(start, end + 1)); } catch { /* fall through */ }
  }

  return null;
}

// ── Validator ─────────────────────────────────────────────────────────────────

/**
 * Filter the LLM roadmap to only entries whose topic tag and resource_link
 * both exist in the DB. Returns the cleaned array.
 */
function validateRoadmap(entries, allowedTags, allowedLinks) {
  return entries.filter((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const tagOk  = typeof entry.topic === "string" && allowedTags.has(entry.topic);
    const linkOk = typeof entry.resource_link === "string" && allowedLinks.has(entry.resource_link);
    if (!tagOk)  console.warn(`[roadmap] stripped entry — unknown tag: "${entry.topic}"`);
    if (!linkOk) console.warn(`[roadmap] stripped entry — unknown link: "${entry.resource_link}"`);
    return tagOk && linkOk;
  });
}

// ── Deterministic fallback ────────────────────────────────────────────────────

/**
 * Build a roadmap purely from DB data when Ollama is unavailable or
 * validation leaves too few entries.
 */
function buildFallbackRoadmap(weakTopics, tagResourceMap, days) {
  const entries = [];
  let day = 1;

  // Cycle through weak topics, filling `days` slots
  const topics = weakTopics.filter((t) => tagResourceMap[t]);
  if (topics.length === 0) return [];

  while (entries.length < days) {
    const topic = topics[entries.length % topics.length];
    const link  = (tagResourceMap[topic] || [])[0];
    if (!link) { entries.length++; continue; } // safety skip
    entries.push({
      day,
      topic,
      description: `Study and practise ${topic.replace(/-/g, " ")} to strengthen your understanding.`,
      resource_link: link,
    });
    day++;
  }

  return entries;
}

// ── DB persistence ────────────────────────────────────────────────────────────

function saveRoadmap(entries) {
  const db = getDb();

  const clear  = db.prepare("DELETE FROM roadmap");
  const insert = db.prepare(
    `INSERT INTO roadmap (day_number, topic, description, resource_link)
     VALUES (?, ?, ?, ?)`
  );

  db.transaction(() => {
    clear.run();
    for (const e of entries) {
      insert.run(e.day, e.topic, e.description, e.resource_link);
    }
  })();
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { topics = {}, ranked = [], days: rawDays } = req.body;
  const days = Math.min(MAX_DAYS, Math.max(1, parseInt(rawDays, 10) || DEFAULT_DAYS));

  // ── 1. Derive weak topics ────────────────────────────────────────────────
  // Map fine-grained topic names ("React Components") back to tag slugs ("react")
  // by checking if the lowercased topic contains a known tag.
  const allDbTags      = getAllDbTags();
  const allDbLinks     = getAllDbLinks();

  // Build a map: fine-grained topic name → best matching tag slug
  function resolveTag(topicName) {
    const lower = topicName.toLowerCase().replace(/\s+/g, "-");
    // exact match first
    if (allDbTags.has(lower)) return lower;
    // partial match: find the longest tag that is a substring of the topic name
    let best = null;
    for (const tag of allDbTags) {
      if (lower.includes(tag) || topicName.toLowerCase().includes(tag.replace(/-/g, " "))) {
        if (!best || tag.length > best.length) best = tag;
      }
    }
    return best;
  }

  // Collect weak topic slugs — two buckets kept separate so weak always wins
  const weakSet     = new Set();
  const weakEntries = [];   // score_pct < WEAK_THRESHOLD — always included first
  const fillEntries = [];   // high-weight ranked topics not tested — pad remaining slots

  // From test results — these are the genuine weak spots
  for (const [topicName, bucket] of Object.entries(topics)) {
    if (bucket.score_pct < WEAK_THRESHOLD) {
      const tag = resolveTag(topicName);
      if (tag && !weakSet.has(tag)) {
        weakSet.add(tag);
        weakEntries.push({ tag, score_pct: bucket.score_pct });
      }
    }
  }

  // Sort weak topics: lowest score first (most urgent study need)
  weakEntries.sort((a, b) => a.score_pct - b.score_pct);

  // High-weight ranked topics not yet in the weak list — filler only
  for (const { topic, weight } of ranked) {
    if (weight >= 0.6 && !weakSet.has(topic) && allDbTags.has(topic)) {
      weakSet.add(topic);
      fillEntries.push({ tag: topic, score_pct: 100 }); // untested = lower urgency
    }
  }

  // Combine: ALL weak entries first, then filler up to `days` total
  // This guarantees a 0%-score topic is never dropped in favour of an untested one
  const combinedEntries = [
    ...weakEntries,
    ...fillEntries.slice(0, Math.max(0, days - weakEntries.length)),
  ];

  const weakTopics = combinedEntries.map((e) => e.tag);

  if (weakTopics.length === 0) {
    return res.status(422).json({ error: "No weak or relevant topics found to build a roadmap." });
  }

  // ── 2. Build allowed topic→resource map ─────────────────────────────────
  const tagResourceMap = buildTagResourceMap(new Set(weakTopics));

  // ── 3. Call Ollama (with retry) ──────────────────────────────────────────
  let roadmapEntries = null;
  let source = "ollama";

  try {
    const prompt1   = buildPrompt(weakTopics, tagResourceMap, days, false);
    let   llmText   = await callOllama(prompt1);
    let   parsed    = extractJson(llmText);

    // Retry once if parse failed or roadmap key missing
    if (!parsed || !Array.isArray(parsed.roadmap)) {
      console.warn("[roadmap] First Ollama response unparseable — retrying with strict prompt");
      const prompt2 = buildPrompt(weakTopics, tagResourceMap, days, true);
      llmText       = await callOllama(prompt2);
      parsed        = extractJson(llmText);
    }

    if (parsed && Array.isArray(parsed.roadmap)) {
      // Re-number days sequentially before validation
      const renumbered = parsed.roadmap.map((e, i) => ({ ...e, day: i + 1 }));
      const validated  = validateRoadmap(renumbered, allDbTags, allDbLinks);

      if (validated.length > 0) {
        roadmapEntries = validated;
      } else {
        console.warn("[roadmap] All Ollama entries failed validation — using fallback");
        source = "fallback";
      }
    } else {
      console.warn("[roadmap] Ollama parse failed after retry — using fallback");
      source = "fallback";
    }
  } catch (err) {
    console.warn(`[roadmap] Ollama unavailable (${err.message}) — using fallback`);
    source = "fallback";
  }

  // ── 4. Fallback ──────────────────────────────────────────────────────────
  if (!roadmapEntries || roadmapEntries.length === 0) {
    source         = "fallback";
    roadmapEntries = buildFallbackRoadmap(weakTopics, tagResourceMap, days);
  }

  if (roadmapEntries.length === 0) {
    return res.status(422).json({ error: "Could not build a roadmap — no matching DB resources." });
  }

  // Ensure days are sequential (in case Ollama returned out-of-order)
  roadmapEntries = roadmapEntries.map((e, i) => ({ ...e, day: i + 1 }));

  // ── 5. Persist ───────────────────────────────────────────────────────────
  saveRoadmap(roadmapEntries);
  console.log(`[roadmap] Saved ${roadmapEntries.length}-day roadmap (source: ${source})`);

  return res.json({
    source,
    days:    roadmapEntries.length,
    roadmap: roadmapEntries,
  });
});

module.exports = router;
