/**
 * ActivityHeatmap — GitHub-style contribution grid backed by /api/daily-activity.
 *
 * Props:
 *   activity  — array of { date: 'YYYY-MM-DD', tasks_completed: number }
 *               as returned by GET /api/daily-activity
 */

import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip }     from "react-tooltip";
import "../heatmap.css";

/** Shift a Date by N days, returns a new Date */
function shiftDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Format a Date as 'YYYY-MM-DD' */
function fmt(date) {
  return date.toISOString().slice(0, 10);
}

/** Map tasks_completed → colour scale class (1-4) */
function scaleClass(value) {
  if (!value || value.count === 0) return "color-empty";
  if (value.count >= 5) return "color-scale-4";
  if (value.count >= 3) return "color-scale-3";
  if (value.count >= 2) return "color-scale-2";
  return "color-scale-1";
}

export default function ActivityHeatmap({ activity = [] }) {
  const today    = new Date();
  const endDate  = today;
  const startDate = shiftDays(today, -364); // rolling 52 weeks

  // Shape data for the heatmap: { date, count }
  const values = activity.map(({ date, tasks_completed }) => ({
    date,
    count: tasks_completed ?? 0,
  }));

  // Summary stats
  const activeDays  = activity.filter((a) => a.active).length;
  const totalTasks  = activity.reduce((s, a) => s + (a.tasks_completed ?? 0), 0);

  // Current streak — count consecutive active days ending today
  const dateSet    = new Set(activity.filter((a) => a.active).map((a) => a.date));
  let streak       = 0;
  let cursor       = new Date(today);
  while (dateSet.has(fmt(cursor))) {
    streak++;
    cursor = shiftDays(cursor, -1);
  }

  return (
    <div className="w-full space-y-3">
      {/* Stats row */}
      <div className="activity-stats flex gap-6 text-sm">
        <div className="stat-tile text-center">
          <p className="text-2xl font-bold text-indigo-400">{streak}</p>
          <p className="text-xs text-gray-500">day streak</p>
        </div>
        <div className="stat-tile text-center">
          <p className="text-2xl font-bold text-gray-300">{activeDays}</p>
          <p className="text-xs text-gray-500">active days</p>
        </div>
        <div className="stat-tile text-center">
          <p className="text-2xl font-bold text-gray-300">{totalTasks}</p>
          <p className="text-xs text-gray-500">tasks done</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div
        className="overflow-x-auto rounded-xl bg-gray-900 p-4"
        role="img"
        aria-label="Daily activity heatmap for the past year"
      >
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={values}
          classForValue={scaleClass}
          tooltipDataAttrs={(value) => ({
            "data-tooltip-id":      "heatmap-tip",
            "data-tooltip-content": value?.date
              ? `${value.date}: ${value.count ?? 0} task${value.count !== 1 ? "s" : ""}`
              : "No activity",
          })}
          showWeekdayLabels
          gutterSize={2}
        />
        <Tooltip id="heatmap-tip" />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-600 justify-end">
        <span>Less</span>
        {["color-empty", "color-scale-1", "color-scale-2", "color-scale-3", "color-scale-4"].map((cls) => (
          <svg key={cls} width="11" height="11" aria-hidden>
            <rect
              width="11" height="11" rx="2"
              className={cls}
            />
          </svg>
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
