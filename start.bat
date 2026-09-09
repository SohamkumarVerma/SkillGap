@echo off
setlocal EnableDelayedExpansion

echo.
echo  =============================================
echo   SkillGap Prep Roadmap — Starting up
echo  =============================================
echo.

REM ── Check Node is available ───────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install it from https://nodejs.org then retry.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [ok] Node.js %NODE_VER%

REM ── Check Ollama is reachable (non-fatal — fallback roadmap works without it) ──
curl -s --max-time 3 http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo  [warn] Ollama not detected on port 11434.
    echo         Roadmap generation will use the DB-curated fallback.
    echo         To enable AI roadmaps: install Ollama, run 'ollama serve',
    echo         then pull a model e.g. 'ollama pull llama3.1:8b'
) else (
    echo  [ok] Ollama is running
)

echo.

REM ── Install backend deps if missing ──────────────────────────────────────────
if not exist "%~dp0backend\node_modules" (
    echo  [backend] Installing dependencies ^(first run^)...
    pushd "%~dp0backend"
    call npm install --prefer-offline
    if errorlevel 1 ( echo  [ERROR] Backend npm install failed. & pause & exit /b 1 )
    popd
) else (
    echo  [ok] Backend dependencies present
)

REM ── Seed DB if it doesn't exist yet ─────────────────────────────────────────
if not exist "%~dp0backend\db\skillgap.sqlite" (
    echo  [db] First run — seeding question bank...
    pushd "%~dp0backend"
    node seed/seed.js
    if errorlevel 1 ( echo  [ERROR] Seeding failed. & pause & exit /b 1 )
    popd
    echo  [ok] DB seeded
) else (
    echo  [ok] Database exists
)

REM ── Install frontend deps if missing ─────────────────────────────────────────
if not exist "%~dp0frontend\node_modules" (
    echo  [frontend] Installing dependencies ^(first run^)...
    pushd "%~dp0frontend"
    call npm install --prefer-offline
    if errorlevel 1 ( echo  [ERROR] Frontend npm install failed. & pause & exit /b 1 )
    popd
) else (
    echo  [ok] Frontend dependencies present
)

echo.
echo  Starting servers...
echo.

REM ── Start backend ─────────────────────────────────────────────────────────────
start "SkillGap — Backend" cmd /k "title SkillGap Backend && cd /d "%~dp0backend" && node server.js"

REM ── Wait for backend to bind ──────────────────────────────────────────────────
echo  [backend] Waiting for server on port 5000...
set /a TRIES=0
:WAIT_BACKEND
set /a TRIES+=1
if %TRIES% gtr 15 (
    echo  [ERROR] Backend did not start within 15s. Check the Backend window for errors.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
curl -s --max-time 1 http://localhost:5000/health >nul 2>&1
if errorlevel 1 goto WAIT_BACKEND
echo  [ok] Backend healthy on http://localhost:5000

REM ── Start frontend ────────────────────────────────────────────────────────────
start "SkillGap — Frontend" cmd /k "title SkillGap Frontend && cd /d "%~dp0frontend" && npm run dev"

echo.
echo  =============================================
echo   App is starting — opening browser shortly
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:5000/health
echo  =============================================
echo.
echo  Close this window or press Ctrl+C to stop watching.
echo  (The server windows must stay open for the app to run.)
echo.

endlocal
