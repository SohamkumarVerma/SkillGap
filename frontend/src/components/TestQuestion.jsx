/**
 * TestQuestion — renders one question with radio-button options.
 * Calls onAnswer(questionId, selectedOption) when user picks an answer.
 */

const DIFFICULTY_STYLE = {
  easy:   "bg-green-900 text-green-300",
  medium: "bg-yellow-900 text-yellow-300",
  hard:   "bg-red-900   text-red-300",
};

export default function TestQuestion({ question, index, total, selected, onAnswer }) {
  const { id, topic, difficulty, question_text, options } = question;

  return (
    <div className="question-card bg-gray-800 rounded-2xl p-6 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-gray-500">
          Q{index + 1} / {total}
        </span>
        <span className="text-xs font-mono text-indigo-300 truncate max-w-[60%]">
          {topic}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
            DIFFICULTY_STYLE[difficulty] ?? "bg-gray-700 text-gray-300"
          }`}
        >
          {difficulty}
        </span>
      </div>

      {/* Question text */}
      <p className="text-gray-100 font-medium leading-relaxed">{question_text}</p>

      {/* Options */}
      {options && options.length > 0 ? (
        <fieldset>
          <legend className="sr-only">Answer options for: {question_text}</legend>
          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = selected === opt;
              return (
                <label
                  key={opt}
                  className={[
                    "flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-colors border",
                    isSelected
                      ? "is-selected"
                      : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name={`q-${id}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => onAnswer(id, opt)}
                    className="accent-indigo-500 shrink-0"
                  />
                  <span className="text-sm font-mono">{opt}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        /* Subjective / free-text fallback */
        <textarea
          rows={3}
          placeholder="Type your answer…"
          value={selected ?? ""}
          onChange={(e) => onAnswer(id, e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3
                     text-sm text-gray-200 placeholder-gray-600
                     focus:outline-none focus:border-indigo-500 resize-none"
          aria-label={`Answer for: ${question_text}`}
        />
      )}
    </div>
  );
}
