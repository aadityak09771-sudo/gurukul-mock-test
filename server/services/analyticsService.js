const Result = require("../models/Result");
const Test = require("../models/Test");
const User = require("../models/User");

// ================= ADMIN DASHBOARD STATS =================
exports.getDashboardStats = async () => {
  const totalTests = await Test.countDocuments();
  const liveTests = await Test.countDocuments({ status: "live" });
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalSubmissions = await Result.countDocuments();

  return {
    totalTests,
    liveTests,
    totalStudents,
    totalSubmissions,
  };
};


// ================= RECENT TESTS =================
exports.getRecentTests = async () => {
  const tests = await Test.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title duration status createdAt");

  return tests;
};


// ================= RECENT SUBMISSIONS =================
exports.getRecentSubmissions = async () => {
  const results = await Result.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("studentName testTitle percentage createdAt");

  return results;
};


// ================= STUDENT PERFORMANCE =================
exports.getStudentAnalytics = async (studentId) => {
  const results = await Result.find({ studentId });

  if (!results.length) {
    return {
      totalTests: 0,
      avgScore: 0,
      bestScore: 0,
      latestScore: 0,
    };
  }

  const totalTests = results.length;

  const avgScore =
    results.reduce((acc, r) => acc + r.percentage, 0) / totalTests;

  const bestScore = Math.max(...results.map((r) => r.percentage));

  const latestScore = results[results.length - 1].percentage;

  return {
    totalTests,
    avgScore: Math.round(avgScore),
    bestScore,
    latestScore,
  };
};


// ================= TEST ANALYTICS =================
exports.getTestAnalytics = async (testId) => {
  const results = await Result.find({ testId });

  if (!results.length) {
    return {
      attempts: 0,
      avgScore: 0,
      highest: 0,
      lowest: 0,
    };
  }

  const attempts = results.length;

  const scores = results.map((r) => r.percentage);

  const avgScore =
    scores.reduce((a, b) => a + b, 0) / attempts;

  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);

  return {
    attempts,
    avgScore: Math.round(avgScore),
    highest,
    lowest,
  };
};