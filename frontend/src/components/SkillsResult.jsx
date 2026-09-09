import { useState } from "react";

const FREQ_BADGE = {
  high:   "bg-red-900/70 text-red-300",
  medium: "bg-yellow-900/70 text-yellow-300",
  low:    "bg-gray-700 text-gray-400",
};

function freqLevel(freq) {
  if (freq >= 5) return "high";
  if (freq >= 2) return "medium";
  return "low";
}

const PREVIEW_COUNT = 8;

export default function SkillsResult({ result }) {
  const [expanded, setExpanded] = useState(false);
  if (!result) return null;

  const { filename, text_length, skills_found, skills } = result;
  const visible = expanded ? skills : skills.slice(0, PREVIEW_COUNT);
  const hasMore = skills.length > PREVIEW_COUNT;

  return (
    <div className="space-y-2">
      {/* Summary row */}
      <div className="flex justify-between items-center text-sm text-gray-400 px-1">
        <span className="font-mono text-xs truncate max-w-[55%]" title={filename}>
          {filename}
        </span>
        <span>
          <span className="text-indigo-400 font-semibold">{skills_found}</span>{" "}
          skill{skills_found !== 1 ? "s" : ""} detected
          <span className="ml-2 text-gray-600 text-xs">
            ({text_length.toLocaleString()} chars)
          </span>
        </span>
      </div>

      {skills_found === 0 ? (
        <p className="text-gray-500 text-center py-6 text-sm">
          No recognised skill keywords found in this file.
        </p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {visible.map(({ skill, frequency }) => {
              const level = freqLevel(frequency);
              return (
                <li key={skill}
                    className="flex items-center justify-between bg-gray-800/80
                               rounded-xl px-4 py-2 gap-3">
                  <span className="font-mono text-sm text-gray-200 truncate">{skill}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, frequency * 12)}%` }}
                        role="presentation"
                      />
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FREQ_BADGE[level]}`}>
                      ×{frequency}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full text-xs text-gray-500 hover:text-gray-300
                         py-2 transition-colors"
            >
              {expanded
                ? "Show less ▲"
                : `Show ${skills.length - PREVIEW_COUNT} more skills ▼`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
