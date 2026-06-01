import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Results.css";
import API from "../../services/api";
import { Link } from "react-router-dom";

const Results = () => {

  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [selectedTest, setSelectedTest] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= DELETE RESULT =================
  const deleteResult = async (id) => {

    if (!window.confirm("Delete this result? ❌")) return;

    try {

      await API.delete(`/results/${id}`);

      alert("Deleted successfully ✅");

      // ✅ remove from UI instantly
      setResults(prev => prev.filter(r => r._id !== id));

    } catch (err) {

      console.error(err);
      alert("Delete failed ❌");

    }
  };

  // ================= FETCH RESULTS =================
  useEffect(() => {

    const fetchData = async () => {

      try {

        const res = await API.get("/results");

        const data = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setResults(data);

      } catch (err) {

        console.error("Results error:", err);
        setError("Failed to load results ❌");

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  }, []);

  // ================= UNIQUE TEST LIST =================
 const tests = useMemo(() => {

  return [
    ...new Set(
      results.map(
        r => r.testId?.title || r.testName || "Untitled Test"
      )
    )
  ];

}, [results]);

  // ================= FILTER RESULTS =================
  const filtered = useMemo(() => {

    if (selectedTest === "all") return results;

    return results.filter(
  r =>
    (r.testId?.title || r.testName) === selectedTest
);

  }, [results, selectedTest]);

  // ================= SCORE COLOR =================
  const getClass = (pct) => {

    if (pct >= 70) return "score-high";
    if (pct >= 40) return "score-mid";
    return "score-low";

  };

  // ================= EXPORT HANDLER =================
  const handleExport = async (type) => {
    try {
      const response = await API.get(`/results/export/${type}?test=${selectedTest}`, {
        responseType: 'blob', // Important for downloading files securely
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results_${selectedTest}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed ❌");
    }
  };

  return (

    <div className="results-page">

      {/* HEADER */}
      <div className="page-header">
        <h2>Student Results</h2>
        <p>All submissions from students</p>
      </div>

      {/* CARD */}
      <div className="results-card">

        <div className="card-top">
          <h3>All Results</h3>

          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
          >
            <option value="all">All Tests</option>

            {tests.map((t, i) => (
              <option key={i} value={t}>
                {t}
              </option>
            ))}

          </select>
          <div className="export-buttons">

            <button
              className="btn-export"
              onClick={() => handleExport('pdf')}
            >
              Export PDF
            </button>

            <button
              className="btn-export excel"
              onClick={() => handleExport('excel')}
            >
              Export Excel
            </button>
            <button 
  onClick={async () => {
    try {
      const confirmSend = window.confirm("Are you sure you want to Publish and Email ALL students in this list?");
      if (!confirmSend) return;
      
      // If you are filtering by a specific test using a state variable (e.g., 'selectedTest' or 'testFilter'), pass it here.
      // Otherwise, an empty payload will send emails for all visible results.
      const payload = selectedTest && selectedTest !== "all" ? { testName: selectedTest } : {};
      
      const res = await API.post('/results/email-all', payload);
      alert(res.data.msg);
    } catch(err) {
      console.error(err);
      alert(err.response?.data?.msg || err.response?.data?.message || err.message || "Failed to send bulk emails ❌");
    }
  }}
  onMouseEnter={(e) => {
    e.target.style.background = "#d97706";
    e.target.style.transform = "translateY(-2px)";
    e.target.style.boxShadow = "0 4px 10px rgba(245, 158, 11, 0.3)";
  }}
  onMouseLeave={(e) => {
    e.target.style.background = "#f59e0b";
    e.target.style.transform = "translateY(0)";
    e.target.style.boxShadow = "none";
  }}
  style={{ 
    background: "#f59e0b", 
    color: "white", 
    padding: "10px 15px", 
    borderRadius: "8px", 
    border: "none", 
    cursor: "pointer", 
    fontWeight: "bold", 
    marginLeft: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease-in-out"
  }}
>
  📢 Publish & Email All Results
</button>


          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="empty-state">
            <h3>Loading results...</h3>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="empty-state">
            <h3>{error}</h3>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">📊</div>
            <h3>No results yet</h3>
            <p>Students haven’t attempted tests</p>
          </div>
        )}

        {/* TABLE */}
        {!loading && !error && filtered.length > 0 && (

          <div className="table-wrapper" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: "1px solid #e2e8f0", borderRadius: "8px", width: "100%", maxWidth: "100%" }}>

            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>

              <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>

                <tr>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Name</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Email</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Roll</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Phone</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Test</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Score</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Percentage</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Date</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Reason</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Email Status</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #e2e8f0" }}>Action</th>
                </tr>

              </thead>

              <tbody>

                {filtered.map((r) => {

                  

                  return (

                    <tr key={r._id}>

                      {/* NAME */}
                       <td>
                        <Link
                          className="student-link"
                          to={`/admin/result/${r._id}`}
                        >
                          <div className="student-cell">
                            <div className="avatar">
                              {r.studentName?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <span>
                              {
                              r.studentName ||
                              r.studentFields?.name ||
                              "Student"
                            }
                          </span>
                          </div>
                        </Link>
                      </td>

                      <td style={{ padding: "12px" }}>
                          {
                            r.studentEmail ||
                            r.studentFields?.email ||
                            "-"
                          }
                        </td>
                      <td>
                        {
                          r.studentRoll || // Direct field
                          r.studentFields?.roll || // Common variation in studentFields
                          r.studentFields?.rollno || // Another common variation
                          "-" // Fallback if all are empty
                        }
                      </td>
                      <td>
                          {
                            r.studentPhone || // Direct field
                            r.studentFields?.phone || // Common variation in studentFields
                            r.studentFields?.phoneno || // Another common variation
                            "-" // Fallback if all are empty
                          }
                        </td>
                  <td style={{ whiteSpace: "normal", wordBreak: "break-word", minWidth: "150px", maxWidth: "250px" }}>
                        {r.testId?.title || r.testName || "Untitled Test"}
                      </td>

                      <td className="score-text">
                        {r.score}/{r.total}
                      </td>

                      <td>
                        <span className={`pill ${getClass(r.percentage)}`}>
                          {r.percentage}%
                        </span>
                      </td>

                      <td>
                       <div>
                        {new Date(r.createdAt).toLocaleDateString()}
                        <br />
                        <small>
                          {new Date(r.createdAt).toLocaleTimeString()}
                        </small>
                      </div>
                      </td>

                      {/* ✅ REASON */}
                      <td style={{ whiteSpace: "normal", wordBreak: "break-word", minWidth: "150px", maxWidth: "250px", padding: "12px" }}>
                        <span style={{ color: r.violations?.reason?.includes("Auto-Submit") ? "red" : "green", fontSize: "12px", fontWeight: "bold", display: "block", lineHeight: "1.4" }}>
                          {r.violations?.reason || "Normal Submission"}
                        </span>
                      </td>

                      {/* ✅ EMAIL STATUS */}
                      <td style={{ padding: "12px" }}>
                        {r.emailStatus === 'Sent' ? (
                          <span style={{ color: 'green', fontSize: '12px', fontWeight: 'bold' }}>
                            ✅ Sent<br/>
                            <small style={{ color: "gray" }}>{new Date(r.emailSentAt).toLocaleDateString()}</small>
                          </span>
                        ) : r.emailStatus === 'Failed' ? (
                          <span style={{ color: 'red', fontSize: '12px', fontWeight: 'bold' }} title={r.emailError}>
                            ❌ Failed
                          </span>
                        ) : (
                          <span style={{ color: 'gray', fontSize: '12px' }}>Not Sent</span>
                        )}
                      </td>

                      {/* ✅ ACTION BUTTONS */}
                      <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          style={{ background: "#2563eb", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                          onClick={async () => {
                            try {
                              if (!window.confirm("Publish & Email this result to the student?")) return;
                              const res = await API.post(`/results/email-single/${r._id}`);
                              alert(res.data.msg);
                              // Automatically update UI to show "Sent"
                              setResults(prev => prev.map(item => item._id === r._id ? { ...item, emailStatus: 'Sent', isPublished: true } : item));
                            } catch (err) {
                              alert(err.response?.data?.msg || err.response?.data?.message || err.message || "Failed to send email ❌");
                            }
                          }}
                        >
                          📧 Email
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => deleteResult(r._id)}
                        >
                          Delete
                        </button>
                        </div>
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );

};

export default Results;