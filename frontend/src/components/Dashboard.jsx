/**
 * Dashboard — shown at the `roadmapped` stage.
 * Combines the roadmap list with the activity heatmap.
 *
 * Props:
 *   roadmapData    — from /api/generate-roadmap
 *   completedDays  — Set<number>
 *   onMarkDone     — async (day) => void  (already calls /daily-activity in App)
 *   activity       — array from GET /api/daily-activity
 *   onReset        — () => void
 */

import RoadmapView     from "./RoadmapView";
import ActivityHeatmap from "./ActivityHeatmap";

export default function Dashboard({
  roadmapData,
  completedDays,
  onMarkDone,
  activity,
  onReset,
}) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-10">

      {/* ── Activity heatmap ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Activity
        </h2>
        <ActivityHeatmap activity={activity} />
      </section>

      {/* ── Roadmap list ── */}
      <section>
        <RoadmapView
          roadmapData={roadmapData}
          completedDays={completedDays}
          onMarkDone={onMarkDone}
        />
      </section>

      {/* ── Start New ── */}
      <button
        onClick={onReset}
        className="w-full py-3 rounded-2xl border border-gray-700 text-gray-400
                   hover:border-red-700 hover:text-red-400
                   transition-colors text-sm font-medium"
      >
        ✕ Start New Roadmap
      </button>

    </div>
  );
}
