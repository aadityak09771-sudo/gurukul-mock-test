import "./TestCard.css";

const TestCard = ({ test, onStart }) => {
  return (
    <div className="test-card">

      {/* TITLE */}
      <h3 className="tc-title">{test.title}</h3>

      {/* META */}
      <div className="tc-meta">
        <span>⏱ {test.duration} min</span>
        <span className="chip verbal">📖 {test.verbal} V</span>
        <span className="chip numerical">🔢 {test.numerical} N</span>
        <span className="chip reasoning">🧩 {test.reasoning} R</span>
      </div>

      {/* MARKING */}
      <div className="tc-marking">
        +{test.marksCorrect || 4} / -{test.marksNegative || 1} per question
      </div>

      {/* BUTTON */}
      <button className="btn-start" onClick={() => onStart(test)}>
        Start Test →
      </button>

    </div>
  );
};

export default TestCard;