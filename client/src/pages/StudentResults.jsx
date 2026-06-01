import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./StudentResults.css";

const StudentResults = () => {

  const authData = JSON.parse(localStorage.getItem("auth") || "{}");
  const currentUserEmail = authData?.user?.email;

  const [selectedTest, setSelectedTest] = useState("all");
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("my-results");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const navigate = useNavigate();

  // ================= FETCH TESTS =================
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await API.get("/results/tests");
        setTests(res.data || []);
      } catch (err) {
        console.error("TEST FETCH ERROR:", err);
      }
    };

    fetchTests();
  }, []);

  // ================= FETCH RESULTS =================
  useEffect(() => {
    const fetchResults = async () => {
      try {
        // ✅ Fix: Securely fetch ONLY the logged-in student's results
        const res = await API.get("/results/my-results");
        let data = res.data || [];
        
        if (selectedTest !== "all") {
          data = data.filter(r => (r.testId?._id || r.testId) === selectedTest);
        }
        setResults(data);
      } catch (err) {
        console.error("RESULT FETCH ERROR:", err);
      }
    };

    fetchResults();
  }, [selectedTest]);

  // ================= DELETE =================
  const deleteResult = async (id) => {

    if (!window.confirm("Delete this result? ❌")) return;

    try {
      await API.delete(`/results/${id}`);
      setResults(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert("Delete failed ❌");
    }
  };

  // ================= VIEW LEADERBOARD =================
  const fetchLeaderboard = async (testId, testName) => {
    try {
      setLeaderboardLoading(true);
      const res = await API.get(`/results/leaderboard/${testId}`);
      setLeaderboard({ testName, data: res.data });
    } catch (err) {
      console.error(err);
      alert("Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const viewLeaderboard = (testId, testName) => {
    setShowLeaderboard(true);
    fetchLeaderboard(testId, testName);
  };

  // ================= EXPORT HANDLER =================
  const handleExport = async (id, type) => {
    try {
      const btn = document.getElementById(`export-${type}-${id}`);
      const originalText = btn ? btn.innerText : "";
      if (btn) btn.innerText = "⏳...";

      // ✅ Uses the safe query parameter to bypass protected admin routes
      const response = await API.get(`/results/${id}?export=${type}`, {
        responseType: 'blob', // Secure blob download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my_result_${id}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      if (btn) btn.innerText = originalText;
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed ❌");
      const btn = document.getElementById(`export-${type}-${id}`);
      if (btn) btn.innerText = type === 'pdf' ? "📄 PDF" : "📊 Excel";
    }
  };

  useEffect(() => {
    if (activeTab === "leaderboard" && selectedTest !== "all") {
      const testObj = tests.find((t) => t._id === selectedTest);
      fetchLeaderboard(selectedTest, testObj?.title || "Test");
    }
  }, [activeTab, selectedTest, tests]);

  // ✅ Fix Blank Page Crash: Define missing variables
  const showCourse = results.some(r => r.studentFields?.course || r.studentFields?.Course);
  const showBranch = results.some(r => r.studentFields?.branch || r.studentFields?.Branch);
  const showSection = results.some(r => r.studentFields?.section || r.studentFields?.Section);

  return (

    <div className="student-results">

      <h2>Student Results</h2>

      {/* ✅ TWO TABS FOR MOBILE CLARITY */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexDirection: 'row' }}>
        <button 
          onClick={() => setActiveTab("my-results")}
          style={{ flex: 1, padding: '12px 10px', background: activeTab === 'my-results' ? '#3b82f6' : '#e2e8f0', color: activeTab === 'my-results' ? 'white' : '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
        >
          👤 My Results
        </button>
        <button 
          onClick={() => setActiveTab("leaderboard")}
          style={{ flex: 1, padding: '12px 10px', background: activeTab === 'leaderboard' ? '#3b82f6' : '#e2e8f0', color: activeTab === 'leaderboard' ? 'white' : '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
        >
          🏆 Top 10 Performers
        </button>
      </div>

      {/* ✅ FILTER DROPDOWN */}
      <div style={{ marginBottom: "20px" }}>
        <select
          value={selectedTest}
          onChange={(e) => setSelectedTest(e.target.value)}
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", background: "white" }}
        >
          <option value="all">All Tests</option>

          {tests.map(test => (
            <option key={test._id} value={test._id}>
  {test.title || test.name || "Test"}
</option>
          ))}
        </select>
      </div>

      {/* ✅ CONDITIONAL RENDERING BASED ON ACTIVE TAB */}
      {activeTab === "my-results" && (results.length === 0 ? (
        <p>No results found</p>
      ) : (

        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: "1px solid #cbd5e1", borderRadius: "8px", maxWidth: "100%" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>

          <thead style={{ position: "sticky", top: 0, background: "#f5f7fb", zIndex: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roll</th>
              <th>Phone</th>
              {showCourse && <th>Course</th>}
              {showBranch && <th>Branch</th>}
              {showSection && <th>Section</th>}
              <th>Test</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {results.map(r => (

              <tr key={r._id}>

                <td
                className="student-link"
                onClick={() => navigate(`/student/profile/${encodeURIComponent(r.studentEmail)}`)}
              >
                {r.studentName}
              </td>
                <td style={{ padding: "12px" }}>{r.studentEmail}</td>
                <td>{r.studentRoll || "-"}</td>
                <td>{r.studentPhone || "-"}</td>

                {/* ✅ TEST NAME */}
                <td style={{ whiteSpace: "normal", wordBreak: "break-word", minWidth: "150px", maxWidth: "250px" }}>{r.testId?.title || r.testName || "Test"}</td>

                <td>
                  {r.score}/{r.total}
                </td>

                <td>
                  <span className={
                    r.percentage >= 50 ? "green" : "red"
                  }>
                    {r.percentage}%
                  </span>
                </td>

                {/* ✅ FIXED DATE BUG */}
                <td>
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>

              <td style={{ padding: "12px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", maxWidth: "250px" }}>
                  <button
                    className="btn-leaderboard"
                    onClick={() => navigate(`/result/${r._id}`)}
                    style={{ background: "#8b5cf6", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                  >
                    👁 View
                  </button>
                  <button
                    id={`export-pdf-${r._id}`}
                    className="btn-leaderboard"
                    onClick={() => handleExport(r._id, 'pdf')}
                    style={{ background: "#f43f5e", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                  >
                    📄 PDF
                  </button>
                  <button
                    id={`export-excel-${r._id}`}
                    className="btn-leaderboard"
                    onClick={() => handleExport(r._id, 'excel')}
                    style={{ background: "#10b981", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                  >
                    📊 Excel
                  </button>
                  <button
                    className="btn-leaderboard"
                    onClick={() => viewLeaderboard(r.testId?._id || r.testId, r.testId?.title || r.testName || "Test")}
                    style={{ background: "#3b82f6", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                  >
                    🏆 Rank
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => deleteResult(r._id)}
                    style={{ background: "#dc2626", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }} 
                  >
                    🗑 Delete
                  </button>
                  </div>
                </td>

              </tr>

            ))}

          </tbody>

        </table></div>
      ))}

      {activeTab === "leaderboard" && (
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          {selectedTest === "all" ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>Please select a specific test from the dropdown to view its leaderboard.</p>
          ) : leaderboardLoading ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>Loading overall performance...</p>
          ) : leaderboard?.data?.length === 0 ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>Results have not been published yet.</p>
          ) : (
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                  <tr style={{ textAlign: "left", color: "#475569" }}>
                    <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Rank</th>
                    <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Student Name</th>
                    <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Score</th>
                    <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard?.data?.map((student, index) => {
                    const isMe = student.studentEmail === currentUserEmail;
                    const rankMedal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
                    return (
                      <tr key={index} style={{ background: isMe ? "#eff6ff" : "white", borderBottom: "1px solid #e2e8f0", transition: "background 0.2s" }}>
                        <td style={{ padding: "14px 12px", fontWeight: "bold", fontSize: "16px", color: isMe ? "#2563eb" : "#334155" }}>{rankMedal}</td>
                        <td style={{ padding: "14px 12px", fontWeight: isMe ? "bold" : "normal", color: isMe ? "#1e40af" : "#334155" }}>
                          {student.studentName} {isMe && <span style={{ background: "#3b82f6", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", marginLeft: "10px", fontWeight: "bold", textTransform: "uppercase" }}>You</span>}
                        </td>
                        <td style={{ padding: "14px 12px", fontWeight: isMe ? "bold" : "normal", color: "#334155" }}>{student.score} / {student.total}</td>
                        <td style={{ padding: "14px 12px", fontWeight: isMe ? "bold" : "normal", color: isMe ? "#16a34a" : "#334155" }}>{student.percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= LEADERBOARD MODAL ================= */}
      {showLeaderboard && (
        <div className="popup-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="popup-box" style={{ background: "white", padding: "25px", borderRadius: "12px", width: "90%", maxWidth: "650px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #eef1f8", paddingBottom: "15px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "20px" }}>🏆 Top 10 Performers: {leaderboard?.testName}</h3>
              <button onClick={() => setShowLeaderboard(false)} style={{ background: "#f1f5f9", border: "none", fontSize: "18px", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>
            
            {leaderboardLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading overall performance...</div>
            ) : leaderboard?.data?.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Results have not been published yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                    <tr style={{ textAlign: "left", color: "#475569" }}>
                      <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Rank</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Student Name</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Score</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard?.data?.map((student, index) => {
                      const isMe = student.studentEmail === currentUserEmail;
                      const rankMedal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
                      return (
                        <tr key={index} style={{ background: isMe ? "#eff6ff" : "white", borderBottom: "1px solid #e2e8f0", transition: "background 0.2s" }}>
                          <td style={{ padding: "14px 12px", fontWeight: "bold", fontSize: "16px", color: isMe ? "#2563eb" : "#334155" }}>{rankMedal}</td>
                          <td style={{ padding: "14px 12px", fontWeight: isMe ? "bold" : "normal", color: isMe ? "#1e40af" : "#334155" }}>
                            {student.studentName} {isMe && <span style={{ background: "#3b82f6", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", marginLeft: "10px", fontWeight: "bold", textTransform: "uppercase" }}>You</span>}
                          </td>
                          <td style={{ padding: "14px 12px", fontWeight: isMe ? "bold" : "normal", color: "#334155" }}>{student.score} / {student.total}</td>
                          <td style={{ padding: "14px 12px", fontWeight: isMe ? "bold" : "normal", color: isMe ? "#16a34a" : "#334155" }}>{student.percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentResults;