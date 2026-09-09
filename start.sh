#!/usr/bin/env bash
set -euo pipefail

echo ""
echo " ============================================="
echo "  SkillGap Prep Roadmap — Starting up"
echo " ============================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Check Node ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo " [ERROR] Node.js not found. Install it from https://nodejs.org then retry."
  exit 1
fi
echo " [ok] Node.js $(node --version)"

# ── Check Ollama (non-fatal) ──────────────────────────────────────────────────
if curl -sf --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo " [ok] Ollama is running"
else
  echo " [warn] Ollama not detected on port 11434."
  echo "        Roadmap generation will use the DB-curated fallback."
  echo "        To enable AI roadmaps: install Ollama, run 'ollama serve',"
  echo "        then pull a model e.g. 'ollama pull llama3.1:8b'"
fi

echo ""

# ── Install backend deps ──────────────────────────────────────────────────────
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
  echo " [backend] Installing dependencies (first run)..."
  (cd "$SCRIPT_DIR/backend" && npm install --prefer-offline)
else
  echo " [ok] Backend dependencies present"
fi

# ── Seed DB on first run ──────────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/backend/db/skillgap.sqlite" ]; then
  echo " [db] First run — seeding question bank..."
  (cd "$SCRIPT_DIR/backend" && node seed/seed.js)
  echo " [ok] DB seeded"
else
  echo " [ok] Database exists"
fi

# ── Install frontend deps ─────────────────────────────────────────────────────
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
  echo " [frontend] Installing dependencies (first run)..."
  (cd "$SCRIPT_DIR/frontend" && npm install --prefer-offline)
else
  echo " [ok] Frontend dependencies present"
fi

echo ""
echo " Starting servers..."
echo ""

# ── Start backend ─────────────────────────────────────────────────────────────
(cd "$SCRIPT_DIR/backend" && node server.js) &
BACKEND_PID=$!

# ── Wait for backend to be healthy ───────────────────────────────────────────
echo " [backend] Waiting for server on port 5000..."
TRIES=0
until curl -sf --max-time 1 http://localhost:5000/health >/dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -gt 15 ]; then
    echo " [ERROR] Backend did not start within 15s."
    kill "$BACKEND_PID" 2>/dev/null
    exit 1
  fi
  sleep 1
done
echo " [ok] Backend healthy on http://localhost:5000"

# ── Start frontend ────────────────────────────────────────────────────────────
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

# ── Open browser (best-effort) ────────────────────────────────────────────────
sleep 2
if command -v open &>/dev/null; then
  open http://localhost:3000
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:3000
fi

echo ""
echo " ============================================="
echo "  App is running"
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:5000/health"
echo " ============================================="
echo ""
echo " Press Ctrl+C to stop both servers."
echo ""

# ── Clean shutdown on Ctrl+C ──────────────────────────────────────────────────
trap 'echo ""; echo " Stopping servers..."; kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null; exit 0' INT TERM
wait
