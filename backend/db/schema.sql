-- SkillGap Prep Roadmap — canonical schema
-- This file is the source of truth. db/init.js runs this on startup.

CREATE TABLE IF NOT EXISTS questions (
  id              INTEGER PRIMARY KEY,
  topic           TEXT    NOT NULL,
  difficulty      TEXT    NOT NULL,   -- 'easy' | 'medium' | 'hard'
  question_text   TEXT    NOT NULL,
  options         TEXT,               -- JSON array, NULL if subjective
  correct_answer  TEXT    NOT NULL,
  resource_link   TEXT,
  tags            TEXT,               -- JSON array of keywords for JD matching
  seed_file       TEXT,               -- source JSON bank for domain isolation
  UNIQUE (topic, question_text)       -- prevents duplicate seeding
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id             INTEGER  PRIMARY KEY,
  question_id    INTEGER,
  user_answer    TEXT,
  is_correct     BOOLEAN,
  attempted_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS roadmap (
  id             INTEGER  PRIMARY KEY,
  day_number     INTEGER,
  topic          TEXT,
  description    TEXT,
  resource_link  TEXT,
  tasks          TEXT,    -- JSON array of { description, resource_link }
  completed      BOOLEAN  DEFAULT 0,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_activity (
  date             TEXT    PRIMARY KEY,  -- 'YYYY-MM-DD'
  active           BOOLEAN DEFAULT 0,
  tasks_completed  INTEGER DEFAULT 0
);
