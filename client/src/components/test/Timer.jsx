import { useEffect, useState } from "react";
import "./Timer.css";

const Timer = ({ duration = 300, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  // ⏱ TIMER LOGIC
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ⏱ FORMAT TIME
  const formatTime = () => {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <div className={`timer-box ${timeLeft <= 300 ? "urgent" : ""}`}>
      <div className="t-label">Time Remaining</div>
      <div className="t-time">{formatTime()}</div>
    </div>
  );
};

export default Timer;