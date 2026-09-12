/**
 * App.jsx — top-level state machine
 *
 * Stages:
 *   idle       → upload screen
 *   ranked     → skills extracted & ranked, ready to test
 *   testing    → answering questions
 *   scored     → score breakdown + roadmap CTA
 *   roadmapped → dashboard (heatmap + roadmap)
 */

import { useEffect, useReducer, useCallback } from "react";
import JDUpload       from "./components/JDUpload";
import SkillsResult   from "./components/SkillsResult";
import PriorityList   from "./components/PriorityList";
import TestView       from "./components/TestView";
import ScoreBreakdown from "./components/ScoreBreakdown";
import Dashboard      from "./components/Dashboard";
import Spinner        from "./components/Spinner";

// ── Reducer ───────────────────────────────────────────────────────────────────

const INIT = {
  stage:         "idle",
  health:        null,
  uploadData:    null,
  rankData:      null,
  testData:      null,
  scoreData:     null,
  roadmapData:   null,
  completedDays: new Set(),
  activity:      [],
  loading:       false,
  loadingMsg:    "",
  error:         null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_HEALTH":    return { ...state, health: action.payload };
    case "LOADING":       return { ...state, loading: true,  error: null, loadingMsg: action.msg ?? "" };
    case "ERROR":         return { ...state, loading: false, error: action.payload };
    case "RANKED":        return { ...state, loading: false, loadingMsg: "", stage: "ranked",
                                   uploadData: action.upload, rankData: action.rank };
    case "TEST_READY":    return { ...state, loading: false, loadingMsg: "", stage: "testing",
                                   testData: action.payload };
    case "SCORED":        return { ...state, loading: false, loadingMsg: "", stage: "scored",
                                   scoreData: action.payload };
    case "ROADMAPPED":    return { ...state, loading: false, loadingMsg: "", stage: "roadmapped",
                     roadmapData: action.payload,
                     completedDays: action.completedDays ?? new Set() };
    case "SET_ACTIVITY":  return { ...state, activity: action.payload };
    case "SET_DAY_COMPLETED": {
      const completedDays = new Set(state.completedDays);
      if (action.completed) completedDays.add(action.day);
      else completedDays.delete(action.day);
      return { ...state, completedDays };
    }
    case "RESET":         return { ...INIT, health: state.health, activity: state.activity };
    default:              return state;
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_LABELS = ["Priorities", "Test", "Score", "Dashboard"];
const STAGE_KEYS   = ["ranked", "testing", "scored", "roadmapped"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const {
    stage, health, uploadData, rankData, testData,
    scoreData, roadmapData, completedDays, activity,
    loading, loadingMsg, error,
  } = state;

  // ── Fetch activity history ────────────────────────────────────────────────
  const fetchActivity = useCallback(() => {
    fetch("/api/daily-activity")
      .then((r) => r.json())
      .then((d) => dispatch({ type: "SET_ACTIVITY", payload: d.activity ?? [] }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/health")
      .then((r) => r.json())
      .then((d) => dispatch({ type: "SET_HEALTH", payload: d }))
      .catch(() => dispatch({ type: "SET_HEALTH", payload: { status: "unreachable" } }));
    fetchActivity();

    // ── Restore roadmap from DB on load ──────────────────────────────────────
    // If a roadmap was previously generated, skip straight to the dashboard
    // without requiring the user to re-upload their JD.
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((data) => {
        if (data.roadmap && data.roadmap.length > 0) {
          const completedDays = new Set(
            data.roadmap.filter((entry) => entry.completed).map((entry) => entry.day)
          );
          dispatch({ type: "ROADMAPPED", payload: data, completedDays });
        }
      })
      .catch(() => {}); // non-fatal — just stay on idle
  }, [fetchActivity]);

  // ── Step 1: upload → rank ─────────────────────────────────────────────────
  const handleUpload = useCallback(async (uploadResult) => {
    if (!uploadResult.skills || uploadResult.skills.length === 0) {
      dispatch({
        type: "ERROR",
        payload: "No recognisable skill keywords found in this file. Try a more detailed job description.",
      });
      return;
    }
    dispatch({ type: "LOADING", msg: "Ranking skill priorities…" });
    try {
      const res = await fetch("/api/rank-priorities", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ skills: uploadResult.skills, text: uploadResult.text || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ranking failed");
      if (!data.ranked || data.ranked.length === 0) {
        throw new Error("No topics from this JD matched our question bank. Try a software engineering JD.");
      }
      dispatch({ type: "RANKED", upload: uploadResult, rank: data });
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, []);

  // ── Step 2: generate test ─────────────────────────────────────────────────
  const handleGenerateTest = useCallback(async () => {
    dispatch({ type: "LOADING", msg: "Building your test…" });
    try {
      const res = await fetch("/api/generate-test", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ranked: rankData.ranked, total_questions: 15 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test generation failed");
      dispatch({ type: "TEST_READY", payload: data });
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, [rankData]);

  // ── Step 3: submit answers ────────────────────────────────────────────────
  const handleSubmit = useCallback(async ({ test_id, answers }) => {
    dispatch({ type: "LOADING", msg: "Scoring your answers…" });
    try {
      const res = await fetch("/api/submit-test", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ test_id, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      dispatch({ type: "SCORED", payload: data });
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, []);

  // ── Step 4: generate roadmap ──────────────────────────────────────────────
  const handleGenerateRoadmap = useCallback(async () => {
    const ollamaRunning = health?.ollama === "running";
    dispatch({
      type: "LOADING",
      msg: ollamaRunning
        ? "Generating AI roadmap via Ollama… (this can take 30–60 s)"
        : "Building your roadmap from the question bank…",
    });
    try {
      const res = await fetch("/api/generate-roadmap", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topics: scoreData.topics, ranked: rankData?.ranked ?? [], days: 7 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Roadmap generation failed");
      dispatch({ type: "ROADMAPPED", payload: data });
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, [scoreData, rankData, health]);

  // ── Step 5: mark day done → /daily-activity ───────────────────────────────
  const handleMarkDone = useCallback(async (day, completed) => {
    try {
      const roadmapRes = await fetch(`/api/roadmap/${day}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ completed }),
      });
      const roadmapData = await roadmapRes.json();
      if (!roadmapRes.ok) throw new Error(roadmapData.error || "Could not save roadmap progress");

      const activityRes = await fetch("/api/daily-activity", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tasks_delta: completed ? 1 : -1 }),
      });
      if (!activityRes.ok) throw new Error("Could not save activity progress");

      dispatch({ type: "SET_DAY_COMPLETED", day, completed });
      fetchActivity();
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, [fetchActivity]);

  // ── "Start New Roadmap" — clears DB roadmap then resets UI ───────────────
  const handleStartNew = useCallback(async () => {
    try {
      await fetch("/api/roadmap", { method: "DELETE" });
    } catch { /* non-fatal */ }
    dispatch({ type: "RESET" });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <div className="app-container">

        {/* ── Header ── */}
        <header className="app-header">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden>SG</div>
            <div>
              <h1 className="brand-title">SkillGap <span>Prep</span></h1>
              <p className="brand-subtitle">Turn a job description into a focused study plan.</p>
            </div>
          </div>
          <div className="system-status">
            <span className={health?.ollama === "running" ? "status-dot is-online" : "status-dot"} />
            {health?.ollama === "running" ? "Local AI ready" : "Curated mode"}
          </div>
        </header>

        {/* ── Stage breadcrumb ── */}
        {stage !== "idle" && (
          <nav aria-label="Progress" className="stage-nav">
            {STAGE_LABELS.map((label, i) => {
              const currentIdx = STAGE_KEYS.indexOf(stage);
              const done   = currentIdx > i;
              const active = currentIdx === i;
              return (
                <span key={label} className={`stage-item ${active ? "is-active" : done ? "is-done" : ""}`}>
                  <span className="stage-number">{done ? "✓" : i + 1}</span>
                    {label}
                </span>
              );
            })}
          </nav>
        )}

        {/* ── Global error ── */}
        {error && (
          <div role="alert" className="error-banner px-4 py-3 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">✗</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Global loading overlay ── */}
        {loading && (
          <div className="surface flex flex-col items-center gap-3 py-8">
            <Spinner />
            {loadingMsg && (
              <p className="text-blue-700 text-sm text-center">{loadingMsg}</p>
            )}
          </div>
        )}

        {/* ════ STAGE: idle / ranked ════ */}
        {!loading && (stage === "idle" || stage === "ranked") && (
          <div className="content-stack">
            <section className="surface p-6 sm:p-8">
              <p className="section-kicker">Step 01 · Diagnose</p>
              <h2 className="section-heading">Start with the role you want.</h2>
              <JDUpload
                onResult={handleUpload}
                onClear={() => dispatch({ type: "RESET" })}
              />
            </section>

            {uploadData && <SkillsResult result={uploadData} />}

            {rankData && (
              <>
                <section className="surface p-6 sm:p-8">
                  <p className="section-kicker">Step 02 · Focus</p>
                  <h2 className="section-heading">Your highest-impact topics.</h2>
                  <PriorityList data={rankData} />
                </section>

                <button
                  onClick={handleGenerateTest}
                  className="primary-action"
                >
                  Continue to knowledge test <span aria-hidden>→</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* ════ STAGE: testing ════ */}
        {!loading && stage === "testing" && testData && (
          <section>
            <p className="section-kicker">Step 03 · Measure</p>
            <h2 className="section-heading">Find the gaps worth closing.</h2>
            <TestView
              testData={testData}
              onSubmit={handleSubmit}
              submitting={false}
            />
          </section>
        )}

        {/* ════ STAGE: scored ════ */}
        {!loading && stage === "scored" && scoreData && (
          <section className="space-y-5">
            <p className="section-kicker">Step 04 · Build</p>
            <h2 className="section-heading">Your learning priorities are ready.</h2>
            <ScoreBreakdown
              scoreData={scoreData}
              onRetake={() => dispatch({ type: "RESET" })}
            />
            <button
              onClick={handleGenerateRoadmap}
              className="primary-action"
            >
              {health?.ollama === "running"
                ? "Generate AI Study Roadmap →"
                : "Generate Study Roadmap →"}
            </button>
          </section>
        )}

        {/* ════ STAGE: roadmapped / dashboard ════ */}
        {!loading && stage === "roadmapped" && roadmapData && (
          <Dashboard
            roadmapData={roadmapData}
            completedDays={completedDays}
            onMarkDone={handleMarkDone}
            activity={activity}
            onReset={handleStartNew}
          />
        )}

      </div>
    </div>
  );
}
