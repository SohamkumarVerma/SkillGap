/**
 * POST /api/generate-roadmap
 *
 * Body (JSON):
 *   {
 *     topics:        { [topicName]: { score_pct, total, correct } },
 *     ranked:        [{ topic, weight }],
 *     days?:         number   default 7, max 30
 *     tasks_per_day?: number  default 1, max 4
 *                            (derived from rigor: light=1, standard=2, intense=3)
 *   }
 *
 * Roadmap row shape (stored + returned):
 *   { day, topic, description, tasks: [{ description, resource_link }], resource_link }
 *
 *   `resource_link` at the row level = tasks[0].resource_link (primary link,
 *   kept for backward-compat with the restore path and RoadmapView fallback).
 */

const express   = require("express");
const http      = require("http");
const { getDb } = require("../db/init");

const router = express.Router();

// ── Config ────────────────────────────────────────────────────────────────────
const OLLAMA_HOST    = "localhost";
const OLLAMA_PORT    = 11434;
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL || "llama3.1:8b";
const WEAK_THRESHOLD = 70;
const DEFAULT_DAYS   = 7;
const MAX_DAYS       = 30;
const DEFAULT_TPD    = 1;   // tasks_per_day default
const MAX_TPD        = 4;
const OLLAMA_TIMEOUT = 120_000;

// ── DB helpers ────────────────────────────────────────────────────────────────

function buildTagResourceMap(allowedTags) {
  const db   = getDb();
  const rows = db.prepare(
    "SELECT tags, resource_link FROM questions WHERE resource_link IS NOT NULL"
  ).all();
  const map = {};
  for (const row of rows) {
    let tags;
    try { tags = JSON.parse(row.tags); } catch { continue; }
    for (const tag of tags) {
      if (!allowedTags.has(tag)) continue;
      if (!map[tag]) map[tag] = new Set();
      map[tag].add(row.resource_link);
    }
  }
  return Object.fromEntries(
    Object.entries(map).map(([tag, urls]) => [tag, [...urls]])
  );
}

function getAllDbTags() {
  const db   = getDb();
  const rows = db.prepare("SELECT tags FROM questions WHERE tags IS NOT NULL").all();
  const set  = new Set();
  for (const row of rows) {
    try { JSON.parse(row.tags).forEach((t) => set.add(t)); } catch { /* skip */ }
  }
  return set;
}

function getAllDbLinks() {
  const db   = getDb();
  const rows = db.prepare(
    "SELECT DISTINCT resource_link FROM questions WHERE resource_link IS NOT NULL"
  ).all();
  return new Set(rows.map((r) => r.resource_link));
}

// ── Ollama call ───────────────────────────────────────────────────────────────

function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:   OLLAMA_MODEL,
      prompt,
      stream:  false,
      options: { temperature: 0.2 },
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
            resolve(JSON.parse(raw).response ?? "");
          } catch {
            reject(new Error("Ollama response was not valid JSON wrapper"));
          }
        });
      }
    );

    req.setTimeout(OLLAMA_TIMEOUT, () => {
      req.destroy();
      reject(new Error(`Ollama timed out after ${OLLAMA_TIMEOUT / 1000}s`));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(weakTopics, tagResourceMap, days, tasksPerDay, isRetry = false) {
  const topicLines = weakTopics.map((t) => `- ${t}`).join("\n");

  // Give the model ALL resource links per topic so it can assign different
  // links to each task on the same day (more useful at tasksPerDay > 1).
  const resourceLines = Object.entries(tagResourceMap)
    .map(([tag, links]) => `- ${tag}: ${links.join(" | ")}`)
    .join("\n");

  const retryHint = isRetry
    ? "\n⚠️  Your previous response was not valid JSON. Return ONLY the JSON object — no markdown, no code fences, no extra text.\n"
    : "";

  const taskShape = tasksPerDay === 1
    ? `{ "description": "one sentence study goal", "resource_link": "url-from-list" }`
    : Array.from({ length: tasksPerDay }, (_, i) =>
        `{ "description": "task ${i + 1} study goal", "resource_link": "url-from-list" }`
      ).join(",\n        ");

  return `${retryHint}You are a study roadmap generator. Rules:
1. Only use topics from ALLOWED TOPICS. Do not invent topics.
2. Only use resource_link URLs from ALLOWED RESOURCES. Do not invent URLs.
3. Return ONLY valid JSON — no markdown, no fences, no explanation.
4. Each day has exactly one topic and exactly ${tasksPerDay} task${tasksPerDay > 1 ? "s" : ""}.
5. For multi-task days, use different resource links for each task where possible.

Weak topics (prioritise lower scores first):
${topicLines}

ALLOWED TOPICS AND RESOURCES:
${resourceLines}

Generate a ${days}-day roadmap. Fill all ${days} days. Prioritise weak topics; repeat if needed.

Return ONLY this JSON:
{
  "roadmap": [
    {
      "day": 1,
      "topic": "topic-slug",
      "tasks": [
        ${taskShape}
      ]
    }
  ]
}`;
}

// ── JSON extraction ───────────────────────────────────────────────────────────

function extractJson(text) {
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(stripped); } catch { /* fall through */ }
  const start = stripped.indexOf("{");
  const end   = stripped.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(stripped.slice(start, end + 1)); } catch { /* fall through */ }
  }
  return null;
}

// ── Validator ─────────────────────────────────────────────────────────────────

/**
 * Validates and normalises a raw LLM roadmap array.
 * - topic must be a known DB tag
 * - every task.resource_link must be a real DB link
 * - tasks that fail link validation are stripped (not the whole day)
 * - days with 0 valid tasks after stripping are removed entirely
 */
function validateRoadmap(entries, allowedTags, allowedLinks) {
  const result = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;

    const tagOk = typeof entry.topic === "string" && allowedTags.has(entry.topic);
    if (!tagOk) {
      console.warn(`[roadmap] stripped day — unknown tag: "${entry.topic}"`);
      continue;
    }

    // Normalise tasks — handle both the nested shape and the legacy flat shape
    let rawTasks = [];
    if (Array.isArray(entry.tasks) && entry.tasks.length > 0) {
      rawTasks = entry.tasks;
    } else if (typeof entry.resource_link === "string") {
      // Legacy / flat response — promote to task array
      rawTasks = [{ description: entry.description ?? "", resource_link: entry.resource_link }];
    }

    const validTasks = rawTasks.filter((t) => {
      const ok = typeof t.resource_link === "string" && allowedLinks.has(t.resource_link);
      if (!ok) console.warn(`[roadmap] stripped task — unknown link: "${t.resource_link}"`);
      return ok;
    });

    if (validTasks.length === 0) {
      console.warn(`[roadmap] stripped day ${entry.day} — no valid tasks after link check`);
      continue;
    }

    result.push({
      day:          entry.day,
      topic:        entry.topic,
      description:  entry.description ?? validTasks[0].description ?? "",
      tasks:        validTasks,
      resource_link: validTasks[0].resource_link, // primary link for compat
    });
  }

  return result;
}

// ── Deterministic fallback ────────────────────────────────────────────────────

function buildFallbackRoadmap(weakTopics, tagResourceMap, days, tasksPerDay) {
  const entries = [];
  const topics  = weakTopics.filter((t) => tagResourceMap[t]);
  if (topics.length === 0) return [];

  for (let d = 1; d <= days; d++) {
    const topic = topics[(d - 1) % topics.length];
    const links = tagResourceMap[topic] || [];
    if (links.length === 0) continue;

    // Build tasks — cycle through available links for variety
    const tasks = Array.from({ length: tasksPerDay }, (_, i) => ({
      description:   `Study ${topic.replace(/-/g, " ")} — focus area ${i + 1}.`,
      resource_link: links[i % links.length],
    }));

    entries.push({
      day:          d,
      topic,
      description:  tasks[0].description,
      tasks,
      resource_link: tasks[0].resource_link,
    });
  }

  return entries;
}

// ── DB persistence ────────────────────────────────────────────────────────────

function saveRoadmap(entries) {
  const db     = getDb();
  const clear  = db.prepare("DELETE FROM roadmap");
  const insert = db.prepare(
    `INSERT INTO roadmap (day_number, topic, description, resource_link, tasks)
     VALUES (?, ?, ?, ?, ?)`
  );

  db.transaction(() => {
    clear.run();
    for (const e of entries) {
      insert.run(
        e.day,
        e.topic,
        e.description,
        e.resource_link,
        JSON.stringify(e.tasks)
      );
    }
  })();
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const {
    topics        = {},
    ranked        = [],
    days:    rawDays,
    tasks_per_day: rawTpd,
  } = req.body;

  const days        = Math.min(MAX_DAYS, Math.max(1, parseInt(rawDays, 10)  || DEFAULT_DAYS));
  const tasksPerDay = Math.min(MAX_TPD,  Math.max(1, parseInt(rawTpd,  10)  || DEFAULT_TPD));

  const allDbTags  = getAllDbTags();
  const allDbLinks = getAllDbLinks();

  // ── Resolve fine-grained topic names → tag slugs ─────────────────────────
  function resolveTag(topicName) {
    const lower = topicName.toLowerCase().replace(/\s+/g, "-");
    if (allDbTags.has(lower)) return lower;
    let best = null;
    for (const tag of allDbTags) {
      if (lower.includes(tag) || topicName.toLowerCase().includes(tag.replace(/-/g, " "))) {
        if (!best || tag.length > best.length) best = tag;
      }
    }
    return best;
  }

  // ── Build candidate topic list — weak first, fillers second ──────────────
  const weakSet     = new Set();
  const weakEntries = [];
  const fillEntries = [];

  for (const [topicName, bucket] of Object.entries(topics)) {
    if (bucket.score_pct < WEAK_THRESHOLD) {
      const tag = resolveTag(topicName);
      if (tag && !weakSet.has(tag)) {
        weakSet.add(tag);
        weakEntries.push({ tag, score_pct: bucket.score_pct });
      }
    }
  }
  weakEntries.sort((a, b) => a.score_pct - b.score_pct);

  for (const { topic, weight } of ranked) {
    if (weight >= 0.6 && !weakSet.has(topic) && allDbTags.has(topic)) {
      weakSet.add(topic);
      fillEntries.push({ tag: topic });
    }
  }

  const combinedEntries = [
    ...weakEntries,
    ...fillEntries.slice(0, Math.max(0, days - weakEntries.length)),
  ];

  const weakTopics = combinedEntries.map((e) => e.tag);

  if (weakTopics.length === 0) {
    return res.status(422).json({ error: "No weak or relevant topics found to build a roadmap." });
  }

  const tagResourceMap = buildTagResourceMap(new Set(weakTopics));

  // ── Call Ollama (with one retry) ──────────────────────────────────────────
  let roadmapEntries = null;
  let source = "ollama";

  try {
    const prompt1 = buildPrompt(weakTopics, tagResourceMap, days, tasksPerDay, false);
    let   llmText = await callOllama(prompt1);
    let   parsed  = extractJson(llmText);

    if (!parsed || !Array.isArray(parsed.roadmap)) {
      console.warn("[roadmap] First response unparseable — retrying");
      llmText = await callOllama(buildPrompt(weakTopics, tagResourceMap, days, tasksPerDay, true));
      parsed  = extractJson(llmText);
    }

    if (parsed && Array.isArray(parsed.roadmap)) {
      const renumbered = parsed.roadmap.map((e, i) => ({ ...e, day: i + 1 }));
      const validated  = validateRoadmap(renumbered, allDbTags, allDbLinks);
      if (validated.length > 0) {
        roadmapEntries = validated;
      } else {
        console.warn("[roadmap] All entries failed validation — falling back");
        source = "fallback";
      }
    } else {
      console.warn("[roadmap] Parse failed after retry — falling back");
      source = "fallback";
    }
  } catch (err) {
    console.warn(`[roadmap] Ollama unavailable (${err.message}) — falling back`);
    source = "fallback";
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (!roadmapEntries || roadmapEntries.length === 0) {
    source         = "fallback";
    roadmapEntries = buildFallbackRoadmap(weakTopics, tagResourceMap, days, tasksPerDay);
  }

  if (roadmapEntries.length === 0) {
    return res.status(422).json({ error: "Could not build a roadmap — no matching DB resources." });
  }

  // Re-number sequentially in case of gaps
  roadmapEntries = roadmapEntries.map((e, i) => ({ ...e, day: i + 1 }));

  saveRoadmap(roadmapEntries);
  console.log(
    `[roadmap] Saved ${roadmapEntries.length}-day roadmap ` +
    `(${tasksPerDay} task/day, source: ${source})`
  );

  return res.json({
    source,
    days:          roadmapEntries.length,
    tasks_per_day: tasksPerDay,
    roadmap:       roadmapEntries,
  });
});

module.exports = router;
