# SkillGap — JD Prep Roadmap

Turn a job description into a focused, personalized study plan — fully offline, powered by a local AI model.

Upload a job description, and SkillGap identifies the skills that actually matter, tests you on them, and generates a day-by-day study roadmap with real resources — all running on your own machine, with no internet required after setup.

## How it works

1. **Upload a JD** (PDF or `.txt`) — the app extracts real skill/technology keywords from the text.
2. **Priority ranking** — extracted skills are scored by frequency and position in the JD, so the most important requirements rise to the top.
3. **Adaptive test** — a curated, human-written question bank generates a test weighted toward your highest-priority skills.
4. **Score breakdown** — see exactly which topics you're strong or weak in, not just an overall percentage.
5. **Customize your roadmap** — choose how many days it should span (3–30) and how intense it should be (Light / Standard / Intense tasks per day).
6. **AI-generated roadmap** — a local LLM (via [Ollama](https://ollama.com)) turns your weak topics into a structured study plan, using only real, verified resources from the question bank. If the AI is unavailable or times out, a deterministic fallback still produces a valid plan.
7. **Dashboard & streak tracking** — a GitHub-style contribution heatmap tracks daily study activity, alongside your day-by-day roadmap with resource links.

Everything — the question bank, your progress, and the AI itself — runs locally. No data ever leaves your machine.

## Tech stack

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`) — a single local file, no server required
- **AI:** [Ollama](https://ollama.com), running locally at `http://localhost:11434`

## Supported domains

The curated question bank currently covers:

- Web Development
- Data Structures & Algorithms
- CS Fundamentals
- CPU Design
- VLSI
- Electrical Engineering
- Aerospace Engineering
- Chemical Engineering
- Machine Learning Engineering
- Game Development (Unity & Unreal)
- GPU Design
- Microprocessors & Controllers

## Setup

### Prerequisites

- [Node.js](https://nodejs.org)
- [Ollama](https://ollama.com/download)

### 1. Pull a local model

```bash
ollama pull llama3.2
```

This is a one-time step requiring internet. Once downloaded, the model runs fully offline.

> If you use a different model, update `OLLAMA_MODEL` in `backend/server.js` to match, or run with:
> ```bash
> OLLAMA_MODEL=your-model-name ./start.sh
> ```

### 2. Start Ollama

Open the Ollama app, or run:

```bash
ollama serve
```

Verify it's running:

```bash
curl http://localhost:11434/api/tags
```

### 3. Launch SkillGap

**Windows:**
```bash
start.bat
```

**macOS / Linux:**
```bash
./start.sh
```

This installs dependencies (first run only), seeds the question bank database (first run only), starts the backend and frontend, and opens the app in your browser.

## Project structure

```
/project-root
  /frontend                React + Tailwind frontend
    src/
      components/          RoadmapConfig, RoadmapView, Dashboard, etc.
  /backend
    /db                     SQLite database file + schema/init logic
    /routes                 upload-jd, rank-priorities, generate-test,
                             submit-test, generate-roadmap, daily-activity
    /seed                   Seed script + curated question bank (JSON)
    server.js
  start.bat
  start.sh
  README.md
```

## Notes

- The question bank is human-curated, not AI-generated — this keeps test accuracy and scoring trustworthy.
- Every AI-generated roadmap entry is validated against real database content before being shown; nothing invented by the model is ever displayed.
- Larger roadmaps (many days × high task density) require more from the local model and may take longer to generate or fall back to the deterministic plan on slower hardware — this is expected behavior, not a bug.
