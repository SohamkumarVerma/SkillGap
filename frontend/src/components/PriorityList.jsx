/**
 * PriorityList — displays the ranked topic list returned by /api/rank-priorities
 */

const BAR_COLOR = (weight) => {
  if (weight >= 0.75) return "bg-red-500";
  if (weight >= 0.50) return "bg-yellow-500";
  return "bg-green-500";
};

const WEIGHT_LABEL = (weight) => {
  if (weight >= 0.75) return { text: "High",   cls: "bg-red-900 text-red-300" };
  if (weight >= 0.50) return { text: "Medium", cls: "bg-yellow-900 text-yellow-300" };
  return                       { text: "Low",    cls: "bg-green-900 text-green-300" };
};

export default function PriorityList({ data }) {
  if (!data) return null;
  const { ranked, uncovered, total_input } = data;

  return (
    <div className="w-full max-w-xl mx-auto mt-6 space-y-4">
      {/* Summary */}
      <div className="flex justify-between text-sm text-gray-400">
        <span>
          <span className="text-indigo-400 font-semibold">{ranked.length}</span> topics ranked
        </span>
        <span>
          from{" "}
          <span className="text-gray-300 font-semibold">{total_input}</span> detected skills
        </span>
      </div>

      {/* Ranked list */}
      <ol className="space-y-2">
        {ranked.map(({ topic, weight, frequency, position_bonus, question_count }, i) => {
          const label = WEIGHT_LABEL(weight);
          return (
            <li
              key={topic}
              className="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              {/* rank number */}
              <span className="text-gray-600 text-xs w-5 shrink-0 text-right">{i + 1}</span>

              {/* topic name */}
              <span className="font-mono text-sm text-gray-100 flex-1 truncate">{topic}</span>

              {/* weight bar */}
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full ${BAR_COLOR(weight)}`}
                  style={{ width: `${Math.round(weight * 100)}%` }}
                  role="presentation"
                />
              </div>

              {/* weight badge */}
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${label.cls}`}
                title={`weight: ${weight} | freq: ×${frequency} | pos bonus: +${position_bonus} | ${question_count} questions`}
              >
                {label.text}
              </span>

              {/* weight number */}
              <span className="text-gray-500 text-xs w-8 text-right shrink-0">
                {weight.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Uncovered skills */}
      {uncovered.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
            {uncovered.length} skill{uncovered.length !== 1 ? "s" : ""} not covered by question bank
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {uncovered.map((s) => (
              <span
                key={s}
                className="font-mono text-xs bg-gray-800 text-gray-500 px-2 py-1 rounded"
              >
                {s}
              </span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
