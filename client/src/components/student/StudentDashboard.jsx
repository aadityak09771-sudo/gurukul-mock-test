import React, { useEffect, useState } from "react";
import "./StudentDashboard.css";
import { useNavigate } from "react-router-dom";
import { getTests } from "../../services/testService";
import API from "../../services/api";

const StudentDashboard = ({ user }) => {

  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  


  // ================= FETCH TESTS =================
  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const [data, matRes, resData] = await Promise.all([
        getTests(),
        API.get("/materials").catch(() => ({ data: [] })),
        API.get("/results/my-results").catch(() => ({ data: [] }))
      ]);
      setTests(data || []);
      setMaterials(matRes.data || []);
      setResults(resData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (e, mat) => {
    e.preventDefault();
    if (mat.fileUrl?.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = mat.fileUrl;
      link.download = mat.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(mat.fileUrl, "_blank");
    }
  };

 
  // ================= START TEST =================
  const startTest = (id) => {
    navigate(`/start/${id}`);
  };

  return (

    <div className="student-dashboard">

      {/* ================= HEADER WITH BUTTON ================= */}
      <div className="welcome-banner hero-header">

        <div>
          <h2>Ready to Practice 🎯</h2>
             <p>Hello {user?.name}!</p>
        </div>


      </div>

      {/* ================= LOADING ================= */}

{loading ? (
  <p>Loading tests...</p>
) : (
  <>
    
    {/* ================= MY RECENT RESULTS ================= */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: "20px", marginBottom: "15px" }}>
      <h3 className="section-title" style={{ margin: 0 }}>
        📊 My Recent Results
      </h3>
      <button 
        onClick={() => navigate("/student/my-results")}
        style={{ background: "transparent", color: "#2563eb", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}
      >
        View All Results →
      </button>
    </div>

    {results.length === 0 ? (
      <p className="empty-text">
        You haven't completed any tests yet.
      </p>
    ) : (
      <div className="tests-row" style={{ marginBottom: "40px" }}>
        {results.slice(0, 4).map((res) => (
          <div key={res._id} className="modern-test-card" style={{ borderLeft: `4px solid ${res.percentage >= 50 ? '#16a34a' : '#dc2626'}`, display: "flex", flexDirection: "column" }}>
            <div className="test-top" style={{ marginBottom: "5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h4>{res.testName || res.testId?.title || "Test"}</h4>
                <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", backgroundColor: res.percentage >= 50 ? '#dcfce7' : '#fee2e2', color: res.percentage >= 50 ? '#16a34a' : '#dc2626' }}>
                  {res.percentage >= 50 ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
            <div className="test-meta" style={{ marginBottom: "15px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: "bold", color: "#334155" }}>🎯 Score: {res.score}/{res.total}</span>
              <span style={{ fontWeight: "bold", color: res.percentage >= 50 ? '#16a34a' : '#dc2626' }}>📈 {res.percentage}%</span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "15px" }}>
              📅 Taken on: {new Date(res.createdAt).toLocaleDateString()}
            </div>
            <button className="start-btn" style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6", color: "white", marginTop: "auto" }} onClick={() => navigate(`/result/${res._id}`)}>
              👁 View Detailed Result →
            </button>
          </div>
        ))}
      </div>
    )}

    {/* ================= FREE TESTS ================= */}

    <h3 className="section-title">
      🔥 Free Tests
    </h3>

    {tests.filter(test => !test.isPaid).length === 0 ? (
      <p className="empty-text">
        No free tests available
      </p>
    ) : (
      Object.entries(
        tests.filter(test => !test.isPaid).reduce((acc, test) => {
          const cat = test.category || "General";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(test);
          return acc;
        }, {})
      ).map(([category, catTests]) => (
        <div key={category} className="category-section" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "50px" }}>
          <h4 style={{ fontSize: "18px", color: "#1e293b", margin: 0, borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>{category}</h4>
          <div className="tests-row">
            {catTests.map((test) => {
            const now = new Date();
            const start = test.startTime ? new Date(test.startTime) : null;
            const end = test.endTime ? new Date(test.endTime) : null;
            let testState = "live";
            if (test.status === "draft") testState = "draft";
            else if (start && now < start) testState = "upcoming";
            else if (end && now > end) testState = "expired";

            // Students should not see draft tests at all, but just in case:
            if (testState === "draft") return null;

            return (
            <div
              key={test._id || test.id}
              className="modern-test-card"
            >

              <div className="test-top" style={{ marginBottom: "5px" }}>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h4>{test.title}</h4>
                  <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", backgroundColor: testState === 'live' ? '#dcfce7' : testState === 'upcoming' ? '#dbeafe' : '#fee2e2', color: testState === 'live' ? '#16a34a' : testState === 'upcoming' ? '#2563eb' : '#dc2626' }}>
                    {testState === 'live' ? '🟢 LIVE' : testState === 'upcoming' ? '⏳ UPCOMING' : '🔴 EXPIRED'}
                  </span>
                </div>

                <span className="free-badge">
                  FREE
                </span>

              </div>

              <div style={{ marginBottom: "12px" }}>
                <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", backgroundColor: test.timerMode === 'question' ? '#fef3c7' : test.timerMode === 'section' ? '#e0e7ff' : '#dcfce7', color: test.timerMode === 'question' ? '#d97706' : test.timerMode === 'section' ? '#4f46e5' : '#16a34a' }}>
                  {test.timerMode === 'question' ? '⌛ Question Timer' : test.timerMode === 'section' ? '📚 Section Timer' : '⏱ Total Timer'}
                </span>
              </div>

              <div className="test-meta">

                <span>
                  ⏱ {test.totalTime || 0} mins
                </span>

                <span>
                  📊 {
                    test.sections?.reduce(
                      (acc, sec) =>
                        acc + sec.questions.length,
                      0
                    ) || 0
                  } Questions
                </span>

              </div>

              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "15px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span>🟢 Start: {test.startTime ? new Date(test.startTime).toLocaleString() : "Not Set"}</span>
                <span>🔴 End: {test.endTime ? new Date(test.endTime).toLocaleString() : "Not Set"}</span>
              </div>

              <button
                className="start-btn"
                style={{ 
                  opacity: testState !== 'live' ? 0.6 : 1, 
                  cursor: testState !== 'live' ? 'not-allowed' : 'pointer',
                  backgroundColor: testState === 'expired' ? '#dc2626' : undefined
                }}
                disabled={testState !== 'live'}
                onClick={() =>
                  startTest(test._id || test.id)
                }
              >
                {testState === 'live' ? 'Start Test →' : testState === 'upcoming' ? `Starts at ${start?.toLocaleTimeString()}` : 'Test Expired'}
              </button>

            </div>

          )})}
      </div>
      </div>
      ))
    )}

    {/* ================= PAID TESTS ================= */}

    <h3 className="section-title paid-title">
      💎 Premium Tests
    </h3>

    {tests.filter(test => test.isPaid).length === 0 ? (
      <p className="empty-text">
        No premium tests available
      </p>
    ) : (
      Object.entries(
        tests.filter(test => test.isPaid).reduce((acc, test) => {
          const cat = test.category || "General";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(test);
          return acc;
        }, {})
      ).map(([category, catTests]) => (
        <div key={category} className="category-section" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "50px" }}>
          <h4 style={{ fontSize: "18px", color: "#1e293b", margin: 0, borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>{category}</h4>
          <div className="tests-row">
            {catTests.map((test) => {
            const now = new Date();
            const start = test.startTime ? new Date(test.startTime) : null;
            const end = test.endTime ? new Date(test.endTime) : null;
            let testState = "live";
            if (test.status === "draft") testState = "draft";
            else if (start && now < start) testState = "upcoming";
            else if (end && now > end) testState = "expired";

            if (testState === "draft") return null;

            return (
            <div
              key={test._id || test.id}
              className="modern-test-card paid-card"
            >

              <div className="test-top" style={{ marginBottom: "5px" }}>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h4>{test.title}</h4>
                  <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", backgroundColor: testState === 'live' ? '#dcfce7' : testState === 'upcoming' ? '#dbeafe' : '#fee2e2', color: testState === 'live' ? '#16a34a' : testState === 'upcoming' ? '#2563eb' : '#dc2626' }}>
                    {testState === 'live' ? '🟢 LIVE' : testState === 'upcoming' ? '⏳ UPCOMING' : '🔴 EXPIRED'}
                  </span>
                </div>

                <span className="paid-badge">
                  PREMIUM
                </span>

              </div>

              <div style={{ marginBottom: "12px" }}>
                <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", backgroundColor: test.timerMode === 'question' ? '#fef3c7' : test.timerMode === 'section' ? '#e0e7ff' : '#dcfce7', color: test.timerMode === 'question' ? '#d97706' : test.timerMode === 'section' ? '#4f46e5' : '#16a34a' }}>
                  {test.timerMode === 'question' ? '⌛ Question Timer' : test.timerMode === 'section' ? '📚 Section Timer' : '⏱ Total Timer'}
                </span>
              </div>

              <div className="test-meta">

                <span>
                  ⏱ {test.totalTime || 0} mins
                </span>

                <span>
                  📊 {
                    test.sections?.reduce(
                      (acc, sec) =>
                        acc + sec.questions.length,
                      0
                    ) || 0
                  } Questions
                </span>

              </div>

              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "15px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span>🟢 Start: {test.startTime ? new Date(test.startTime).toLocaleString() : "Not Set"}</span>
                <span>🔴 End: {test.endTime ? new Date(test.endTime).toLocaleString() : "Not Set"}</span>
              </div>

              <button
                className="start-btn premium-btn"
                style={{ 
                  opacity: testState !== 'live' ? 0.6 : 1, 
                  cursor: testState !== 'live' ? 'not-allowed' : 'pointer',
                  backgroundColor: testState === 'expired' ? '#dc2626' : undefined
                }}
                disabled={testState !== 'live'}
                onClick={() =>
                  startTest(test._id || test.id)
                }
              >
                {testState === 'live' ? 'Unlock Test →' : testState === 'upcoming' ? `Starts at ${start?.toLocaleTimeString()}` : 'Test Expired'}
              </button>

            </div>

          )})}
      </div>
      </div>
      ))
    )}

    {/* ================= STUDY MATERIALS ================= */}
    
    <h3 className="section-title" style={{ marginTop: "40px" }}>
      📚 Study Materials & Results
    </h3>

    {materials.length === 0 ? (
      <p className="empty-text">
        No materials uploaded yet
      </p>
    ) : (
      Object.entries(
        materials.reduce((acc, mat) => {
          const cat = mat.category || "General";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(mat);
          return acc;
        }, {})
      ).map(([category, catMaterials]) => (
        <div key={category} className="category-section" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "50px" }}>
          <h4 style={{ fontSize: "18px", color: "#1e293b", margin: 0, borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>{category}</h4>
          <div className="tests-row">
            {catMaterials.map((mat) => (

          <div key={mat._id} className="modern-test-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {mat.type === "image" && (
              <div style={{ width: "100%", height: "140px", marginBottom: "15px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <img src={mat.fileUrl} alt={mat.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }} />
              </div>
            )}

            <div className="test-top">
              <h4>{mat.title}</h4>
              <span className="free-badge" style={{ backgroundColor: "#eef1f8", color: "#475569" }}>
                {mat.type.toUpperCase()}
              </span>
            </div>

            <div className="test-meta" style={{ display: "block", marginBottom: "15px" }}>
              <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {mat.description || "No description provided."}
              </p>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                📅 {new Date(mat.createdAt).toLocaleDateString()}
              </span>
            </div>

            <button
              className="start-btn"
              style={{ backgroundColor: "#2563eb", color: "white", borderColor: "#2563eb", marginTop: "auto" }}
              onClick={(e) => handleView(e, mat)}
            >
              View/Download {mat.type === "video" ? "Video 🎥" : mat.type === "result" ? "Result 📊" : mat.type === "image" ? "Image 🖼️" : "Document 📄"} →
            </button>

          </div>

        ))}

      </div>
      </div>
      ))
    )}
  </>
)}

    </div>

  );
};

export default StudentDashboard;