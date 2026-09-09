/**
 * TestView — full test-taking UI.
 *
 * Props:
 *   testData   — response from /api/generate-test
 *   onSubmit   — async fn({ test_id, answers }) → called when user submits
 *   submitting — boolean, disables submit while request is in flight
 */

import { useState } from "react";
import TestQuestion from "./TestQuestion";

export default function TestView({ testData, onSubmit, submitting }) {
  const { test_id, questions } = testData;

  // answers: Map<question_id, user_answer_string>
  const [answers, setAnswers] = useState(new Map());

  function handleAnswer(questionId, value) {
    setAnswers((prev) => new Map(prev).set(questionId, value));
  }

  const answeredCount = answers.size;
  const totalCount    = questions.length;
  const allAnswered   = answeredCount === totalCount;
  const progressPct   = Math.round((answeredCount / totalCount) * 100);

  function handleSubmit() {
    const payload = questions.map((q) => ({
      question_id: q.id,
      user_answer: answers.get(q.id) ?? "",
    }));
    onSubmit({ test_id, answers: payload });
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{answeredCount} / {totalCount} answered</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Questions — scrollable list */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <TestQuestion
            key={q.id}
            question={q}
            index={i}
            total={totalCount}
            selected={answers.get(q.id) ?? null}
            onAnswer={handleAnswer}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="sticky bottom-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={[
            "w-full py-3 rounded-2xl font-semibold text-sm transition-all",
            submitting
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : allAnswered
              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40"
              : "bg-indigo-800/60 hover:bg-indigo-700/60 text-indigo-300",
          ].join(" ")}
          aria-label={
            allAnswered
              ? "Submit test"
              : `Submit test — ${totalCount - answeredCount} question${totalCount - answeredCount !== 1 ? "s" : ""} unanswered`
          }
        >
          {submitting
            ? "Submitting…"
            : allAnswered
            ? "Submit Test"
            : `Submit (${totalCount - answeredCount} unanswered)`}
        </button>
      </div>
    </div>
  );
}
