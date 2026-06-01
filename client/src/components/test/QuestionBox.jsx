import "./QuestionBox.css";

const QuestionBox = ({
  question,
  index,
  total,
  selected,
  onSelect,
  onNext,
  onPrev,
  onMark,
}) => {
  if (!question) return <h3>No Question Found</h3>;

  return (
    <div className="question-box">

      {/* HEADER */}
      <div className="q-header">
        <div className="q-number">
          Q{index + 1} of {total}
        </div>

        <div className="q-marks">
          +{question.marks || 4} / -{question.negative || 1}
        </div>
      </div>

      {/* QUESTION TEXT */}
      <div className="q-text">
        {question.q}
      </div>

      {/* OPTIONS */}
      <div className="options">
        {["A", "B", "C", "D"].map((opt) => (
          <div
            key={opt}
            className={`option ${selected === opt ? "selected" : ""}`}
            onClick={() => onSelect(opt)}
          >
            <div className="option-label">{opt}</div>
            <div className="option-text">
              {question.options[opt]}
            </div>
          </div>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div className="q-actions">

        <button className="btn prev" onClick={onPrev}>
          ← Previous
        </button>

        <button className="btn mark" onClick={onMark}>
          🔖 Mark
        </button>

        <button className="btn next" onClick={onNext}>
          Next →
        </button>

        <button className="btn submit">
          Submit ✓
        </button>

      </div>

    </div>
  );
};

export default QuestionBox;