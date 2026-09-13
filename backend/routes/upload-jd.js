/**
 * POST /api/upload-jd
 *
 * Accepts a .txt or .pdf file (multipart/form-data, field name: "jd").
 * Extracts text, runs keyword matching against the curated keyword list,
 * and returns ranked { skill, frequency } results.
 */

const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const KEYWORDS = require("./keywords");

const router = express.Router();

// ── Multer: memory storage, 5 MB cap, .pdf and .txt only ─────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ["application/pdf", "text/plain"];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith(".txt")) {
      cb(null, true);
    } else {
      cb(new Error("Only .pdf and .txt files are accepted."));
    }
  },
});

// ── Keyword extraction ────────────────────────────────────────────────────────

/**
 * Given a body of text, count how many times each canonical keyword appears.
 * Uses simple substring matching with regex so word boundaries and hyphens
 * both work. Returns an array sorted by frequency desc, filtering out 0 hits.
 *
 * @param {string} text
 * @returns {{ skill: string, frequency: number }[]}
 */
function extractKeywords(text) {
  const lower = text.toLowerCase();
  const results = [];

  for (const { canonical, variants, excludePattern, wordBoundary = true } of KEYWORDS) {
    let freq = 0;

    for (const variant of variants) {
      // Build a regex: escape special regex chars, then count all occurrences
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = wordBoundary
        ? `(?<![a-z0-9])${escaped}(?![a-z0-9])`
        : escaped;
      const re = new RegExp(pattern, "gi");
      const matches = lower.match(re);
      if (matches) freq += matches.length;
    }

    // Apply exclusion: subtract matches that are part of a compound phrase
    // e.g. "full stack" or "tech stack" should not count toward the DSA "stack" tag
    if (freq > 0 && excludePattern) {
      const excludeMatches = lower.match(new RegExp(excludePattern.source, "gi"));
      if (excludeMatches) freq = Math.max(0, freq - excludeMatches.length);
    }

    if (freq > 0) {
      results.push({ skill: canonical, frequency: freq });
    }
  }

  // Sort by frequency descending, then alphabetically for ties
  results.sort((a, b) => b.frequency - a.frequency || a.skill.localeCompare(b.skill));
  return results;
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post("/", upload.single("jd"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Use field name 'jd'." });
  }

  let text = "";

  try {
    if (
      req.file.mimetype === "application/pdf" ||
      req.file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text;
    } else {
      // Plain text — just decode the buffer
      text = req.file.buffer.toString("utf8");
    }
  } catch (err) {
    console.error("[upload-jd] text extraction error:", err.message);
    return res.status(422).json({ error: "Could not extract text from file.", detail: err.message });
  }

  if (!text.trim()) {
    return res.status(422).json({ error: "File appears to be empty or unreadable." });
  }

  const skills = extractKeywords(text);

  return res.json({
    filename: req.file.originalname,
    size_bytes: req.file.size,
    text_length: text.length,
    text,           // included for position scoring in /rank-priorities
    skills_found: skills.length,
    skills,
  });
});

// ── Multer error handler (file-type / size rejections) ────────────────────────
router.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum size is 5 MB." });
  }
  return res.status(400).json({ error: err.message });
});

module.exports = router;
module.exports.extractKeywords = extractKeywords;
