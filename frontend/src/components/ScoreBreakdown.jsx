/**
 * ScoreBreakdown — displays the scored results from /api/submit-test.
 *
 * Props:
 *   scoreData  — response from /api/submit-test
 *   onRetake   — () => void, resets to start
 */

import { useState } from "react";

const pctColor = (pct) => {
  if (pct >= 75) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
};

const pctBarColor = (pct) => {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

function TopicRow({ topic, bucket }) {
  const [open, setOpen] = useState(false);
  const { total, correct, score_pct, questions } = bucket;

  return (
    <li className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Topic header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-mono text-sm text-gray-100 flex-1 truncate">{topic}</span>
        <span className="text-xs text-gray-500">{correct}/{total}</span>
        {/* mini bar */}
        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden shrink-0">
          <div
            className={`h-full rounded-full ${pctBarColor(score_pct)}`}
            style={{ width: `${score_pct}%` }}
            role="presentation"
          />
        </div>
        <span className={`text-sm font-bold w-10 text-right shrink-0 ${pctColor(score_pct)}`}>
          {score_pct}%
        </span>
        <span className="text-gray-600 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Expanded question-level detail */}
      {open && (
        <ul className="border-t border-gray-700 divide-y divide-gray-700/60">
          {questions.map((q) => (
            <li key={q.question_id} className="px-4 py-3 space-y-1">
              <p className="text-sm text-gray-300">{q.question_text}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className={q.is_correct ? "text-green-400" : "text-red-400"}>
                  {q.is_correct ? "✓ Correct" : "✗ Incorrect"}
                </span>
                {!q.is_correct && (
                  <>
                    <span className="text-gray-500">
                      Your answer:{" "}
                      <span className="text-red-300 font-mono">
                        {q.user_answer || "(blank)"}
                      </span>
                    </span>
                    <span className="text-gray-500">
                      Correct:{" "}
                      <span className="text-green-300 font-mono">{q.correct_answer}</span>
                    </span>
                  </>
                )}
                {q.resource_link && (
                  <a
                    href={q.resource_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Study →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ScoreBreakdown({ scoreData, onRetake }) {
  const { total, correct, score_pct, topics } = scoreData;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Overall score hero */}
      <div className="bg-gray-800 rounded-2xl px-8 py-6 text-center space-y-2">
        <p className="text-gray-400 text-sm uppercase tracking-widest">Your Score</p>
        <p className={`text-6xl font-black ${pctColor(score_pct)}`}>{score_pct}%</p>
        <p className="text-gray-400 text-sm">
          {correct} correct out of {total} questions
        </p>
        {/* Overall bar */}
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all ${pctBarColor(score_pct)}`}
            style={{ width: `${score_pct}%` }}
            role="progressbar"
            aria-valuenow={score_pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Per-topic breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Topic Breakdown
          <span className="text-gray-600 normal-case font-normal ml-2">
            (click a topic to review answers)
          </span>
        </h3>
        <ul className="space-y-2">
          {Object.entries(topics)
            .sort((a, b) => a[1].score_pct - b[1].score_pct) // weakest first
            .map(([topic, bucket]) => (
              <TopicRow key={topic} topic={topic} bucket={bucket} />
            ))}
        </ul>
      </div>

      {/* Retake / start over */}
      <button
        onClick={onRetake}
        className="w-full py-3 rounded-2xl border border-gray-700 text-gray-400
                   hover:border-indigo-500 hover:text-indigo-300 transition-colors text-sm font-medium"
      >
        ↩ Start Over with a New JD
      </button>
    </div>
  );
}
