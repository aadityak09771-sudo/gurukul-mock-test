import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./ManageTests.css";
import {
  getAdminTests,
} from "../../services/testService";
import API from "../../services/api";

const ManageTests = () => {

  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH TESTS =================
  const fetchTests = async () => {
    try {
      const data = await getAdminTests();
      setTests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this test?")) return;

    try {
      await API.delete(`/tests/${id}`);
      fetchTests();
    } catch (err) {
      console.error(err);
      alert("Delete failed ❌");
    }
  };

  // ================= TOGGLE =================
  const handleToggle = async (test) => {
    try {
      const res = await API.put(`/tests/${test._id}/toggle`);
      const updatedTest = res.data;
      
      // 🔥 Send emails automatically if a private test is made LIVE
      if (updatedTest.status === "live" && updatedTest.isPrivate) {
        const confirmSend = window.confirm("This is a private test. Do you want to automatically email the secure test link to all allowed students now?");
        if (confirmSend) {
          const inviteRes = await API.post('/tests/send-invites', { testId: updatedTest._id });
          alert(inviteRes.data.msg);
        }
      }
      
      fetchTests();
    } catch (err) {
      console.error(err);
      alert("Update failed ❌");
    }
  };

  // ================= COPY LINK =================
  const handleCopy = (id) => {
    const link = `${window.location.origin}/test/${id}`;

    navigator.clipboard.writeText(link);

    alert("Link copied ✅");
  };

  // ================= OPEN LINK =================
  const handleOpen = (id) => {
    window.open(`/test/${id}`, "_blank");
  };

  return (
    <div className="manage-tests">

      {/* HEADER */}
      <div className="page-header">
        <h2>Manage Tests</h2>
        <p>View, edit, and control your mock tests</p>
      </div>

      {/* LOADING */}
      {loading ? (
        <p>Loading tests...</p>
      ) : tests.length === 0 ? (

        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No tests created</h3>
          <p>Create your first test</p>
        </div>

      ) : (

        <div className="tests-grid">

          {tests.map((test) => {
            const now = new Date();

            const start = test.startTime
              ? new Date(test.startTime)
              : null;

            const end = test.endTime
              ? new Date(test.endTime)
              : null;

            let testState = "draft";

            if (test.status === "draft") {

              testState = "draft";

            } else if (
              start &&
              now < start
            ) {

              testState = "upcoming";

            } else if (
              end &&
              now > end
            ) {

              testState = "expired";

            } else {

              testState = "live";

            }
            const totalQuestions =
              test.sections?.reduce(
               (acc, sec) => acc + sec.questions.length,
                0
              ) || 0;

            const link = `${window.location.origin}/test/${test._id}`;

            return (

              <div className="test-card" key={test._id}>

                {/* HEADER */}
                <div className="tc-head">
                  <div className="tc-title">{test.title}</div>
                 <span className={`status-badge ${testState}`}>
                    {testState.toUpperCase()}
                  </span>
                </div>

                {/* CATEGORY BADGE */}
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", backgroundColor: "#f8fafc", color: "#475569", fontSize: "12px", fontWeight: "600", border: "1px solid #e2e8f0" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    {test.category || "General"}
                  </span>
                </div>

                {/* TIMER MODE BADGE */}
                <div style={{ marginBottom: "12px" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    backgroundColor: test.timerMode === 'question' ? '#fef3c7' : test.timerMode === 'section' ? '#e0e7ff' : '#dcfce7',
                    color: test.timerMode === 'question' ? '#d97706' : test.timerMode === 'section' ? '#4f46e5' : '#16a34a'
                  }}>
                    {test.timerMode === 'question' ? '⌛ Question Timer' :
                     test.timerMode === 'section' ? '📚 Section Timer' :
                     '⏱ Total Timer'}
                  </span>
                </div>

                {/* META */}
                <div className="tc-meta">
                  <span>
                    ⏱ {test.totalTime || 0} min
                  </span>
                  <span>📝 {totalQuestions} Qs</span>
                  {test.sections?.map((sec, i) => (
                    <span key={i}>
                      📚 {sec.name} ({sec.questions.length})
                    </span>
                  ))}
                </div>

                {/* DATE */}
                <div className="tc-date">
                  Created: {new Date(test.createdAt).toLocaleDateString()}
                </div>
                  <div className="test-dates">

                  <span>
                    🟢 Start:
                    {
                      test.startTime
                        ? new Date(
                            test.startTime
                          ).toLocaleString()
                        : "Not Set"
                    }
                  </span>

                  <span>
                    🔴 End:
                    {
                      test.endTime
                        ? new Date(
                            test.endTime
                          ).toLocaleString()
                        : "Not Set"
                    }
                  </span>

                </div>
                {/* 🔥 SHARE LINK */}
                <div className="tc-link">
                  <input value={link} readOnly />
                  <button onClick={() => handleCopy(test._id)}>Copy</button>
                </div>

                {/* ACTIONS */}
                <div className="tc-actions">

                  {testState === "draft" ? (

                    <button
                      className="btn-green"
                      onClick={() => handleToggle(test)}
                    >
                      🚀 Go Live
                    </button>

                  ) : testState === "live" ? (

                    <button
                      className="btn-outline"
                      onClick={() => handleToggle(test)}
                    >
                      ⏸ Unpublish
                    </button>

                  ) : testState === "expired" ? (

                    <button className="btn-red disabled-btn">
                      ⛔ Expired
                    </button>

                  ) : (

                    <button className="btn-blue disabled-btn">
                      ⏳ Upcoming
                    </button>

                  )}

                  <button
                    className="btn-blue"
                    onClick={() => handleOpen(test._id)}
                  >
                    🔗 Open
                  </button>

                  <button
                    className="btn-red"
                    onClick={() => handleDelete(test._id)}
                  >
                    🗑 Delete
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => navigate(`/admin/edit-test/${test._id}`)}
                  >
                    ✏️ Edit
                  </button>

                </div>

              </div>
            );
          })}

        </div>

      )}

    </div>
  );
};

export default ManageTests;