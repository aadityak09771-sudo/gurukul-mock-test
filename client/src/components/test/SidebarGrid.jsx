import "./SidebarGrid.css";

const SidebarGrid = ({
  questions = [],
  currentIndex = 0,
  answers = {},
  marked = {},
  onJump,
}) => {
  return (
    <div className="sidebar-grid">

      <div className="section-title">Questions</div>

      <div className="q-grid">
        {questions.map((_, i) => {
          const key = i;

          let status = "unattempted";

          if (answers[key]) status = "attempted";
          if (marked[key]) status = "marked";

          return (
            <button
              key={i}
              className={`q-btn ${status} ${
                currentIndex === i ? "current" : ""
              }`}
              onClick={() => onJump(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default SidebarGrid;