import "./ResultCard.css";

const ResultCard = ({ result }) => {
  if (!result) return null;

  const pct = result.percentage;

  const getEmoji = () => {
    if (pct >= 80) return "🏆";
    if (pct >= 60) return "🎉";
    if (pct >= 40) return "👍";
    return "💪";
  };

  const getTitle = () => {
    if (pct >= 80) return "Outstanding!";
    if (pct >= 60) return "Great Job!";
    if (pct >= 40) return "Good Effort!";
    return "Keep Practicing!";
  };

  return (
    <div className="result-card">

      {/* HEADER */}
      <div className="rc-head">
        <div className="rc-icon">{getEmoji()}</div>
        <h2>{getTitle()}</h2>
        <p className="rc-sub">{result.testTitle}</p>
      </div>

      {/* SCORE */}
      <div className="rc-score">
        <div className="rc-main">{result.score}</div>
        <div className="rc-total">/ {result.total}</div>
        <div className="rc-percent">{pct}% Accuracy</div>
      </div>

      {/* SECTION SCORES */}
      <div className="rc-sections">

        <div className="rc-box verbal">
          <span>Verbal</span>
          <h3>{result.verbal}</h3>
          <p>/ {result.verbalTotal}</p>
        </div>

        <div className="rc-box numerical">
          <span>Numerical</span>
          <h3>{result.numerical}</h3>
          <p>/ {result.numericalTotal}</p>
        </div>

        <div className="rc-box reasoning">
          <span>Reasoning</span>
          <h3>{result.reasoning}</h3>
          <p>/ {result.reasoningTotal}</p>
        </div>

      </div>

    </div>
  );
};

export default ResultCard;