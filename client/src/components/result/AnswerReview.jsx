import "./AnswerReview.css";

const AnswerReview = ({ questions = [], answers = {} }) => {

  const allQuestions = questions.flatMap(
    (section, sectionIndex) =>
      section.questions.map((q, i) => ({
        ...q,
        sectionIndex,
        index: i,
        section: section.name
      }))
  );

  return (
    <div className="answer-review">

      <h3>📝 Answer Review</h3>

      {allQuestions.map((q, i) => {

        const key = `${q.sectionIndex}-${q.index}`;
        const userAns = answers[key];

        return (
          <div key={i} className="review-item">

            <p>
              <b>Q{i + 1}:</b> {q.q}
            </p>

            <p>
              Your Answer:
              {" "}
              {userAns || "Not Attempted"}
            </p>

            <p>
              Correct Answer:
              {" "}
              {q.correct}
            </p>

          </div>
        );
      })}

    </div>
  );
};

export default AnswerReview;