/**
 * RoadmapView — day-by-day roadmap with per-task checkboxes.
 *
 * Props:
 *   roadmapData   — response from /api/generate-roadmap (or restored)
 *   completedDays — Set<number>   days already marked done (persisted)
 *   onTaskToggle — (day, taskIndex, completed) => void
 */

import { useState, useEffect } from "react";

const SOURCE_BADGE = {
  ollama:   { label: "AI Generated", cls: "bg-indigo-900/80 text-indigo-300" },
  fallback: { label: "DB Curated",   cls: "bg-gray-700     text-gray-400"   },
  restored: { label: "Restored",     cls: "bg-gray-700     text-gray-500"   },
};

const DIFF_DOT = {
  easy:   "bg-green-500",
  medium: "bg-yellow-500",
  hard:   "bg-red-500",
};

export default function RoadmapView({ roadmapData, onTaskToggle, completedDays = new Set() }) {
  if (!roadmapData) return null;
  const { source, days, roadmap } = roadmapData;
  const badge = SOURCE_BADGE[source] ?? SOURCE_BADGE.fallback;

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
          {days}-Day Study Roadmap
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Day cards */}
      <ol className="space-y-2">
        {roadmap.map((entry) => (
          <DayCard
            key={entry.day}
            entry={entry}
            isDayDone={completedDays.has(entry.day)}
            onTaskToggle={onTaskToggle}
          />
        ))}
      </ol>
    </div>
  );
}

// ── DayCard ───────────────────────────────────────────────────────────────────

function DayCard({ entry, isDayDone, onTaskToggle }) {
  const tasks = normaliseTasks(entry);

  const [checked, setChecked] = useState(() =>
    new Set(tasks.map((task, i) => task.completed_at || (isDayDone && !tasks.some((item) => item.completed_at)) ? i : null).filter((i) => i !== null))
  );
  const [completionTimes, setCompletionTimes] = useState(() =>
    Object.fromEntries(tasks.map((task, i) => [i, task.completed_at]).filter(([, value]) => value))
  );

  // If the parent marks the day done externally (e.g. restored from DB), sync
  useEffect(() => {
    if (isDayDone) {
      setChecked(new Set(tasks.map((task, i) => task.completed_at || !tasks.some((item) => item.completed_at) ? i : null).filter((i) => i !== null)));
    }
    // We intentionally don't clear checked when isDayDone goes false (undo)
    // because the user may have partially checked tasks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDayDone]);

  function toggleTask(idx) {
    const willBeChecked = !checked.has(idx);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);

      onTaskToggle?.(entry.day, idx, willBeChecked);

      return next;
    });
    setCompletionTimes((prev) => ({
      ...prev,
      [idx]: willBeChecked ? new Date().toISOString() : null,
    }));
  }

  const allChecked  = checked.size === tasks.length;
  const someChecked = checked.size > 0 && !allChecked;

  return (
    <li
      className={[
        "rounded-xl border transition-colors overflow-hidden",
        isDayDone
          ? "border-green-800/50 bg-green-950/30"
          : "border-gray-700/60 bg-gray-800/60",
      ].join(" ")}
    >
      {/* Day header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Day badge */}
        <div
          className={[
            "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs",
            isDayDone ? "bg-green-700 text-white" : "bg-gray-700 text-gray-400",
          ].join(" ")}
          aria-label={`Day ${entry.day}`}
        >
          {isDayDone ? "✓" : `D${entry.day}`}
        </div>

        {/* Topic + progress */}
        <div className="flex-1 min-w-0">
          <span className="font-mono text-sm text-indigo-300 font-semibold">
            {entry.topic}
          </span>
          {tasks.length > 1 && (
            <span className="ml-2 text-xs text-gray-600">
              {checked.size}/{tasks.length} tasks
            </span>
          )}
        </div>

        {/* Day-level undo button (only when day is fully done) */}
        {isDayDone && (
          <button
            onClick={() => {
              setChecked(new Set());
              setCompletionTimes({});
              tasks.forEach((_, idx) => onTaskToggle?.(entry.day, idx, false));
            }}
            className="shrink-0 text-xs px-3 py-1 rounded-lg border
                       border-green-800/60 text-green-500
                       hover:border-yellow-600 hover:text-yellow-400 transition-colors"
            aria-label={`Undo completion for day ${entry.day}`}
          >
            Undo
          </button>
        )}
      </div>

      {/* Task list */}
      <ul className="border-t border-gray-700/40 divide-y divide-gray-700/30">
        {tasks.map((task, idx) => {
          const isChecked = checked.has(idx);
          return (
            <li key={idx} className="px-4 py-3 flex items-start gap-3">
              {/* Checkbox */}
              <button
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggleTask(idx)}
                className={[
                  "shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                  isChecked
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-gray-600 hover:border-indigo-400",
                ].join(" ")}
                aria-label={`Task ${idx + 1}: ${task.description}`}
              >
                {isChecked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Task content */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className={[
                  "text-sm leading-relaxed transition-colors",
                  isChecked ? "text-gray-500 line-through" : "text-gray-300",
                ].join(" ")}>
                  {task.description}
                </p>
                {task.resource_link && (
                  <a
                    href={task.resource_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline
                               break-all transition-colors"
                    tabIndex={isChecked ? -1 : 0}
                  >
                    {task.resource_link}
                  </a>
                )}
                {isChecked && completionTimes[idx] && (
                  <p className="text-xs text-gray-600">
                    Completed {formatCompletionTime(completionTimes[idx])}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Progress bar for multi-task days */}
      {tasks.length > 1 && (
        <div className="h-1 bg-gray-700/40">
          <div
            className={[
              "h-full transition-all duration-300",
              allChecked ? "bg-green-500" : someChecked ? "bg-indigo-500" : "bg-transparent",
            ].join(" ")}
            style={{ width: `${(checked.size / tasks.length) * 100}%` }}
            role="presentation"
          />
        </div>
      )}
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalise a roadmap entry's task list.
 * Handles: new format (tasks array), legacy format (flat resource_link),
 * and restored rows that may have either.
 */
function normaliseTasks(entry) {
  if (Array.isArray(entry.tasks) && entry.tasks.length > 0) {
    return entry.tasks;
  }
  // Legacy / single-task fallback
  return [{
    description:   entry.description ?? "",
    resource_link: entry.resource_link ?? "",
  }];
}

function formatCompletionTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
