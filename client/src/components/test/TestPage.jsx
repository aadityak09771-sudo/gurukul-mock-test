import { useState } from "react";
import SidebarGrid from "./SidebarGrid";
import QuestionBox from "./QuestionBox";
import Timer from "./Timer";
import "./TestPage.css";

const TestPage = () => {
  // 🔥 DEMO DATA (Replace with API later)
  const questions = [
    {
      q: "2 + 2 = ?",
      options: { A: "3", B: "4", C: "5", D: "6" },
      correct: "B",
    },
    {
      q: "5 × 3 = ?",
      options: { A: "10", B: "12", C: "15", D: "20" },
      correct: "C",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});

  // ================= ANSWER SELECT =================
  const handleSelect = (opt) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: opt,
    }));
  };

  // ================= NAVIGATION =================
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // ================= MARK =================
  const markQuestion = () => {
    setMarked((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = () => {
    const total = questions.length;
    const attempted = Object.keys(answers).length;

    if (attempted < total) {
      const confirmSubmit = window.confirm(
        `You have ${total - attempted} unattempted questions. Submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    console.log("Answers:", answers);
    alert("Test Submitted ✅");
  };

  return (
    <div className="test-page">

      {/* ================= NAVBAR ================= */}
      <div className="test-nav">
        <div className="test-title">Mock Test</div>

        {/* ✅ REAL TIMER COMPONENT */}
        <Timer duration={300} onTimeUp={handleSubmit} />

        <button className="btn-submit" onClick={handleSubmit}>
          Submit Test
        </button>
      </div>

      {/* ================= BODY ================= */}
      <div className="test-body">

        {/* ================= SIDEBAR ================= */}
        <SidebarGrid
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          marked={marked}
          onJump={(i) => setCurrentIndex(i)}
        />

        {/* ================= MAIN ================= */}
        <div className="test-main">
          <QuestionBox
            question={questions[currentIndex]}
            index={currentIndex}
            total={questions.length}
            selected={answers[currentIndex]}
            onSelect={handleSelect}
            onNext={nextQuestion}
            onPrev={prevQuestion}
            onMark={markQuestion}
          />
        </div>

      </div>
    </div>
  );
};

export default TestPage;