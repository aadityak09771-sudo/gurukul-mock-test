const calculateScore = (test, answers) => {
  let totalScore = 0;
  let totalMarks = 0;

  const sectionData = {
    verbal: { correct: 0, wrong: 0, total: 0, score: 0 },
    numerical: { correct: 0, wrong: 0, total: 0, score: 0 },
    reasoning: { correct: 0, wrong: 0, total: 0, score: 0 },
  };

  // ================= LOOP THROUGH SECTIONS =================
  ["verbal", "numerical", "reasoning"].forEach((section) => {
    const questions = test.questions[section] || [];

    questions.forEach((q, index) => {
      const key = `${section}-${index}`;
      const userAnswer = answers[key];

      sectionData[section].total += 1;
      totalMarks += test.marksCorrect;

      if (!userAnswer) return; // skipped

      if (userAnswer === q.correct) {
        totalScore += test.marksCorrect;
        sectionData[section].correct += 1;
        sectionData[section].score += test.marksCorrect;
      } else {
        totalScore -= test.marksNegative;
        sectionData[section].wrong += 1;
        sectionData[section].score -= test.marksNegative;
      }
    });

    // Prevent negative section score
    if (sectionData[section].score < 0) {
      sectionData[section].score = 0;
    }
  });

  // Prevent total negative score
  if (totalScore < 0) totalScore = 0;

  const percentage =
    totalMarks > 0
      ? Math.round((totalScore / totalMarks) * 100)
      : 0;

  return {
    totalScore,
    totalMarks,
    percentage,
    sectionData,
  };
};

module.exports = { calculateScore };