import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import AnswerReview from "./AnswerReview";
import "./ResultPage.css";

const ResultPage = () => {

  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= FETCH RESULT =================
  useEffect(() => {
    const fetchResult = async () => {
      try {
        const resultId = localStorage.getItem("resultId");

        console.log("Result ID:", resultId);

        if (!resultId) {
          setLoading(false);
          return;
        }

        const res = await API.get(`/results/${resultId}`);
        setResult(res.data);

      } catch (err) {
        console.error("Result fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, []);

  // ================= LOADING =================
  if (loading) {
    return <h2 style={{ padding: 40 }}>Loading...</h2>;
  }

  // ================= NO RESULT =================
  if (!result) {
    return (
      <div style={{ padding: 40 }}>
        <h2>No Result Found ❌</h2>
        <button onClick={() => navigate("/student")}>
          Go Back
        </button>
      </div>
    );
  }

  // ================= LOGIC =================
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
    <div className="result-page">

      <div className="result-card">

        {/* HEADER */}
        <div className="r-head">
          <div className="r-icon">{getEmoji()}</div>
          <h2>{getTitle()}</h2>
          <p className="r-sub">{result.testTitle}</p>
        </div>

        {/* SCORE */}
        <div className="overall-score">
          <div className="score-main">{result.score}</div>
          <div className="score-total">/ {result.total}</div>
          <div className="score-percent">{pct}% Accuracy</div>
        </div>

        {/* SECTION SCORES */}
        <div className="section-scores">

          <div className="ss-card verbal">
            <div className="ss-title">Verbal</div>
            <div className="ss-score">{result.verbal}</div>
            <div className="ss-total">/ {result.verbalTotal}</div>
          </div>

          <div className="ss-card numerical">
            <div className="ss-title">Numerical</div>
            <div className="ss-score">{result.numerical}</div>
            <div className="ss-total">/ {result.numericalTotal}</div>
          </div>

          <div className="ss-card reasoning">
            <div className="ss-title">Reasoning</div>
            <div className="ss-score">{result.reasoning}</div>
            <div className="ss-total">/ {result.reasoningTotal}</div>
          </div>

        </div>

        {/* ANSWER REVIEW */}
        <AnswerReview
          questions={test.sections || []}
          answers={result.answers || {}}
        />

        {/* ACTIONS */}
        <div className="result-actions">

          <button
            className="btn primary"
            onClick={() => navigate(`/student/${result.student}`)}
          >
            View Profile
          </button>

          <button
            className="btn secondary"
            onClick={() => {
              localStorage.removeItem("resultId");
              navigate("/student");
            }}
          >
            Back
          </button>

        </div>

      </div>

    </div>
  );
};

export default ResultPage;