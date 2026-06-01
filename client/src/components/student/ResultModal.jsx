import "./ResultModal.css";

const ResultModal = ({ isOpen, onClose, result }) => {
  if (!isOpen || !result) return null;

  return (
    <div className="rm-overlay" onClick={onClose}>
      
      <div className="rm-box" onClick={(e) => e.stopPropagation()}>

        {/* CLOSE */}
        <button className="rm-close" onClick={onClose}>
          ✕
        </button>

        {/* TITLE */}
        <h3 className="rm-title">
          {result.testTitle} – Result
        </h3>

        {/* SCORE */}
        <div className="rm-score">
          <div className="rm-main">{result.score}</div>
          <div className="rm-total">/ {result.total}</div>
          <div className="rm-percent">{result.percentage}% Accuracy</div>
        </div>

        {/* SECTIONS */}
        <div className="rm-sections">

          <div className="rm-box-item verbal">
            <span>Verbal</span>
            <h4>{result.verbal}/{result.verbalTotal}</h4>
          </div>

          <div className="rm-box-item numerical">
            <span>Numerical</span>
            <h4>{result.numerical}/{result.numericalTotal}</h4>
          </div>

          <div className="rm-box-item reasoning">
            <span>Reasoning</span>
            <h4>{result.reasoning}/{result.reasoningTotal}</h4>
          </div>

        </div>

        {/* DATE */}
        <p className="rm-date">
          Date: {result.date}
        </p>

      </div>
    </div>
  );
};

export default ResultModal;