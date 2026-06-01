export const calculateScore = (answers, questions) => {
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correct) score += 4;
    else if (answers[i]) score -= 1;
  });
  return score;
};