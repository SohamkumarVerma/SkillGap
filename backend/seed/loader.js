const fs = require("fs");
const path = require("path");

const SEED_DIR = __dirname;

function getSeedFiles() {
  return fs
    .readdirSync(SEED_DIR)
    .filter((fileName) => fileName.toLowerCase().endsWith(".json"))
    .sort()
    .map((fileName) => path.join(SEED_DIR, fileName));
}

function extractUrl(raw) {
  if (!raw) return null;
  const match = raw.match(/\(([^)]+)\)\s*$/);
  return match ? match[1] : raw;
}

function normalise(question) {
  return {
    topic: question.topic,
    difficulty: question.difficulty,
    question_text: question.question_text,
    options: Array.isArray(question.options) ? JSON.stringify(question.options) : null,
    correct_answer: question.correct_answer,
    resource_link: extractUrl(question.resource_link),
    tags: Array.isArray(question.tags) ? JSON.stringify(question.tags) : null,
    seed_file: question.seed_file,
  };
}

function readSeedQuestions({ warn = true } = {}) {
  const questions = [];
  const tags = new Set();

  for (const filePath of getSeedFiles()) {
    const fileName = path.basename(filePath);
    let raw;

    try {
      raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      console.warn(`[seed] WARN: ${fileName} could not be parsed — ${error.message}`);
      continue;
    }

    if (!Array.isArray(raw)) {
      console.warn(`[seed] WARN: ${fileName} is not a JSON array — skipping.`);
      continue;
    }

    for (const question of raw) {
      if (
        !question ||
        typeof question !== "object" ||
        !question.topic ||
        !question.question_text ||
        !question.correct_answer
      ) {
        if (warn) console.warn(`[seed] WARN: invalid question in ${fileName} — skipping.`);
        continue;
      }
      questions.push({ ...question, seed_file: fileName });
      if (Array.isArray(question.tags)) {
        question.tags
          .filter((tag) => typeof tag === "string" && tag.trim())
          .forEach((tag) => tags.add(tag.trim()));
      }
    }
  }

  return { questions, tags };
}

function seedDatabase(db, { log = false } = {}) {
  const { questions } = readSeedQuestions();
  const insert = db.prepare(`
    INSERT INTO questions
      (topic, difficulty, question_text, options, correct_answer, resource_link, tags, seed_file)
    VALUES
      (@topic, @difficulty, @question_text, @options, @correct_answer, @resource_link, @tags, @seed_file)
    ON CONFLICT(topic, question_text) DO UPDATE SET seed_file = excluded.seed_file
  `);
  const insertMany = db.transaction((records) => {
    let inserted = 0;
    for (const question of records) inserted += insert.run(normalise(question)).changes;
    return inserted;
  });

  const changed = insertMany(questions);
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM questions").get();
  if (log) {
    console.log(`[seed] ${questions.length} questions processed, ${changed} rows inserted or updated.`);
    console.log(`[seed] Total questions in DB: ${count}`);
  }
  return { loaded: questions.length, changed, total: count };
}

function getSeedKeywords() {
  return [...readSeedQuestions({ warn: false }).tags];
}

module.exports = { getSeedFiles, getSeedKeywords, readSeedQuestions, seedDatabase };
