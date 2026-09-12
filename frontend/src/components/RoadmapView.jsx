/**
 * RoadmapView — displays the generated day-by-day study roadmap.
 *
 * Props:
 *   roadmapData  — response from /api/generate-roadmap
 *   onMarkDone   — (day) => void  called when user ticks a day complete
 *   completedDays — Set<number>   days already marked done
 */

const SOURCE_BADGE = {
  ollama:   { label: "AI Generated",  cls: "bg-indigo-900 text-indigo-300" },
  fallback: { label: "DB Curated",    cls: "bg-gray-700   text-gray-400"   },
};

export default function RoadmapView({ roadmapData, onMarkDone, completedDays = new Set() }) {
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
        {roadmap.map((entry) => {
          const done = completedDays.has(entry.day);
          return (
            <li
              key={entry.day}
              className={[
                "rounded-xl border transition-colors p-4 flex gap-3 items-start",
                done
                  ? "border-green-800/60 bg-green-950/30"
                  : "border-gray-700/60 bg-gray-800/60",
              ].join(" ")}
            >
              {/* Day badge */}
              <div
                className={[
                  "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs",
                  done ? "bg-green-700 text-white" : "bg-gray-700 text-gray-400",
                ].join(" ")}
                aria-label={`Day ${entry.day}`}
              >
                {done ? "✓" : `D${entry.day}`}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <span className="font-mono text-sm text-indigo-300 font-semibold">
                  {entry.topic}
                </span>
                <p className="text-sm text-gray-300 leading-relaxed">{entry.description}</p>
                {entry.resource_link && (
                  <a
                    href={entry.resource_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline
                               break-all transition-colors"
                  >
                    {entry.resource_link}
                  </a>
                )}
              </div>

              {/* Mark done */}
              <button
                onClick={() => onMarkDone?.(entry.day, !done)}
                aria-label={done ? `Undo completion for day ${entry.day}` : `Mark day ${entry.day} as done`}
                className={[
                  "shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors",
                  done
                    ? "border-green-800/60 text-green-400 hover:border-yellow-600 hover:text-yellow-400"
                    : "border-gray-600 text-gray-500 hover:border-green-600 hover:text-green-400",
                ].join(" ")}
              >
                {done ? "Undo" : "Mark done"}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
