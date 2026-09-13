# SkillGap — Offline JD Prep Roadmap

Upload a job description → get ranked skills → take a curated test → receive a personalized day-by-day study roadmap powered by a local LLM (Ollama). Fully offline, single-machine.

## Tech Stack

| Layer    | Choice                     |
|----------|----------------------------|
| Frontend | React 18 + Tailwind CSS 3  |
| Backend  | Node.js + Express          |
| Database | SQLite (via better-sqlite3)|
| LLM      | Ollama (localhost:11434)   |

## Quick Start

### Windows
```bat
start.bat
```

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

The script will:
1. Install `node_modules` in both `frontend/` and `backend/` if missing
2. Import every JSON question bank in `backend/seed/` into SQLite (safe to repeat)
3. Start the Express backend on **port 5000**
4. Start the Vite dev server on **port 3000** and open your browser

Question banks are data-driven: each JSON file contributes its questions and
tags automatically. Tags become job-description keywords, and matching tags
are then used by the existing test and roadmap generation routes. The backend
also imports newly added banks when it starts, even if the database file already
exists.

## Project Structure

```
/project-root
  /frontend          React + Tailwind
  /backend
    /db              SQLite file + schema/init script
    /routes          API route handlers
    /seed            Seed script + question bank
    server.js
  start.sh
  start.bat
  README.md
```

## API Endpoints (Phase 1 — stub only)

| Method | Path                    | Description                  |
|--------|-------------------------|------------------------------|
| GET    | /health                 | Backend liveness check       |
| POST   | /api/upload-jd          | Upload & parse job description |
| GET    | /api/rank-priorities    | Ranked skill list from JD    |
| GET    | /api/generate-test      | Curated question set         |
| POST   | /api/submit-test        | Submit answers, store results|
| POST   | /api/generate-roadmap   | Trigger Ollama roadmap gen   |
| GET    | /api/daily-activity     | Streak / activity data       |

## Prerequisites

- Node.js ≥ 18
- [Ollama](https://ollama.ai) installed and running locally (required for roadmap generation in later phases)
