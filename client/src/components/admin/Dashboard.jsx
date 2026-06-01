import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { getAdminTests } from "../../services/testService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const Dashboard = () => {

  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  // ================= PROTECT =================
  useEffect(() => {
    if (!user) navigate("/");
    else if (user.role !== "admin") navigate("/student");
  }, [user, navigate]);

  // ================= FETCH DATA =================
  useEffect(() => {

    if (!user || user.role !== "admin") return;

    fetchDashboard();

  }, [user]);

  const fetchDashboard = async () => {
    try {

      const [testRes, resultRes, studentRes] = await Promise.all([
        getAdminTests(),
        API.get("/results"),
        API.get("/auth/students")
      ]);

      const testsData = testRes || [];
      const resultsData = resultRes.data || [];
      const studentsData = studentRes.data || [];

      // 🔥 SORT LATEST FIRST
      const sortedTests = [...testsData].reverse();
      const sortedResults = [...resultsData].reverse();

      setTests(sortedTests);
      setResults(sortedResults);
      setStudents(studentsData);

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE TEST =================
  const deleteTest = async (id) => {

    if (!window.confirm("Delete this test? ❌")) return;

    try {

      await API.delete(`/tests/${id}`);

      alert("Deleted successfully ✅");

      // 🔥 refresh data
      fetchDashboard();

    } catch (err) {
      console.error(err);
      alert("Delete failed ❌");
    }
  };

  // ================= STATS =================
  const totalTests = tests.length;
  const liveTests = tests.filter(t => t.status === "live").length;
  const totalStudents = students.length;
  const totalSubmissions = results.length;

  // ================= RECENT =================
  const recentTests = tests.slice(0, 5);
  const recentResults = results.slice(0, 5);

  return (

    <div className="admin-dashboard">

      {/* HEADER */}
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your mock test platform</p>
      </div>

      {/* ================= STATS ================= */}
      <div className="stats-grid">

        <div className="stat-card orange">
          <div className="s-num">{loading ? "..." : totalTests}</div>
          <div className="s-lbl">TOTAL TESTS</div>
        </div>

        <div className="stat-card green">
          <div className="s-num">{loading ? "..." : liveTests}</div>
          <div className="s-lbl">LIVE TESTS</div>
        </div>

        <div
          className="stat-card blue clickable"
          onClick={() => navigate("/admin/students")}
        >
          <div className="s-num">{loading ? "..." : totalStudents}</div>
          <div className="s-lbl">STUDENTS</div>
        </div>

        <div
          className="stat-card purple clickable"
          onClick={() => navigate("/admin/results")}
        >
          <div className="s-num">{loading ? "..." : totalSubmissions}</div>
          <div className="s-lbl">SUBMISSIONS</div>
        </div>

      </div>

      {/* ================= GRID ================= */}
      <div className="dashboard-grid">

        {/* ================= RECENT TESTS ================= */}
        <div className="card">

          <div className="card-header">
            <h3>Recent Tests</h3>

            <button
              className="btn-gold"
              onClick={() => navigate("/admin/create-test")}
            >
              + New Test
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : recentTests.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No tests yet</h3>
              <p>Create your first mock test!</p>
            </div>
          ) : (
            recentTests.map((test) => (
              <div key={test._id} className="list-item">

                <div
                  className="clickable"
                  onClick={() => navigate(`/admin/edit-test/${test._id}`)}
                >
                  <strong>{test.title}</strong>
                  <p>{test.duration} min</p>
                </div>

                <div className="actions">

                  <span className={`status ${test.status}`}>
                    {test.status}
                  </span>

                  <button
                    className="btn-delete"
                    onClick={() => deleteTest(test._id)}
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))
          )}

        </div>

        {/* ================= RECENT SUBMISSIONS ================= */}
        <div className="card">

          <div className="card-header">
            <h3>Recent Submissions</h3>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : recentResults.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📊</div>
              <h3>No submissions yet</h3>
              <p>Students haven’t submitted tests yet</p>
            </div>
          ) : (
            recentResults.map((r) => (
              <div
                key={r._id}
                className="list-item clickable"
                onClick={() => navigate(`/admin/result/${r._id}`)}
              >
                <div>
                  <strong>{r.studentName || "Student"}</strong>
                  <p>{r.testTitle}</p>
                </div>

                <span className="score-badge">
                  {r.percentage}%
                </span>
              </div>
            ))
          )}

        </div>

      </div>

    </div>

  );
};

export default Dashboard;