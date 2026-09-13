/**
 * RoadmapConfig — step between Score and roadmap generation.
 *
 * Props:
 *   onGenerate  — ({ days, tasks_per_day }) => void
 *   disabled    — boolean (while loading)
 *   ollamaReady — boolean (changes CTA label)
 */

import { useState } from "react";

const RIGOR_OPTIONS = [
  {
    id:    "light",
    tpd:   1,
    label: "Light",
    hint:  "1 task / day — quick refreshers, good for revision",
    icon:  "🌱",
  },
  {
    id:    "standard",
    tpd:   2,
    label: "Standard",
    hint:  "2 tasks / day — solid daily practice",
    icon:  "⚡",
  },
  {
    id:    "intense",
    tpd:   3,
    label: "Intense",
    hint:  "3 tasks / day — deep focus, interview-prep pace",
    icon:  "🔥",
  },
];

const DAY_PRESETS = [3, 5, 7, 14, 21, 30];

export default function RoadmapConfig({ onGenerate, disabled = false, ollamaReady = false }) {
  const [days,  setDays]  = useState(7);
  const [rigor, setRigor] = useState("standard");
  const [customDays, setCustomDays] = useState("");

  const activeDays = customDays !== "" ? Number(customDays) : days;
  const tpd = RIGOR_OPTIONS.find((r) => r.id === rigor)?.tpd ?? 2;

  function handleCustomDays(val) {
    const n = parseInt(val, 10);
    setCustomDays(val);
    if (!isNaN(n) && n >= 1 && n <= 30) setDays(n);
  }

  function handlePreset(d) {
    setDays(d);
    setCustomDays("");
  }

  const finalDays = Math.min(30, Math.max(1, activeDays || days));
  const valid = finalDays >= 1 && finalDays <= 30;

  return (
    <div className="space-y-6">
      {/* ── Duration ── */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-300">
          How many days?
        </label>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-2">
          {DAY_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handlePreset(d)}
              className={[
                "px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors",
                days === d && customDays === ""
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-indigo-300",
              ].join(" ")}
            >
              {d}d
            </button>
          ))}

          {/* Custom input */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={30}
              placeholder="Custom"
              value={customDays}
              onChange={(e) => handleCustomDays(e.target.value)}
              className={[
                "w-24 bg-gray-800 border rounded-xl px-3 py-1.5 text-sm text-gray-200",
                "placeholder-gray-600 focus:outline-none transition-colors",
                customDays !== ""
                  ? "border-indigo-500"
                  : "border-gray-700 focus:border-indigo-500",
              ].join(" ")}
              aria-label="Custom number of days"
            />
            <span className="text-xs text-gray-600">days (1–30)</span>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Your roadmap will span{" "}
          <span className="text-indigo-400 font-semibold">{finalDays} day{finalDays !== 1 ? "s" : ""}</span>
          {" "}with{" "}
          <span className="text-indigo-400 font-semibold">
            {tpd} task{tpd !== 1 ? "s" : ""}
          </span>{" "}
          per day — that's{" "}
          <span className="text-gray-300 font-semibold">{finalDays * tpd} total tasks</span>.
        </p>
      </div>

      {/* ── Rigor ── */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-300">
          Daily intensity
        </label>
        <div className="grid grid-cols-3 gap-2">
          {RIGOR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRigor(opt.id)}
              className={[
                "flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors text-center",
                rigor === opt.id
                  ? "bg-indigo-950 border-indigo-500 text-indigo-200"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500",
              ].join(" ")}
              aria-pressed={rigor === opt.id}
            >
              <span className="text-xl" aria-hidden>{opt.icon}</span>
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-xs leading-tight text-gray-500">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Generate CTA ── */}
      <button
        onClick={() => valid && onGenerate({ days: finalDays, tasks_per_day: tpd })}
        disabled={disabled || !valid}
        className={[
          "w-full py-3 rounded-2xl font-semibold text-sm transition-colors",
          disabled || !valid
            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30",
        ].join(" ")}
      >
        {disabled
          ? (ollamaReady ? "Generating AI roadmap…" : "Building roadmap…")
          : (ollamaReady ? "Generate AI Roadmap →" : "Generate Roadmap →")}
      </button>
    </div>
  );
}
