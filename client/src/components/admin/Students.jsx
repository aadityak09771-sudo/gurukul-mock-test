import React, { useEffect, useState } from "react";
import API from "../../services/api";
import "./Students.css";

const Students = () => {

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= DELETE STUDENT =================
  const deleteStudent = async (id) => {

    if (!window.confirm("Delete this student? ❌")) return;

    try {

      await API.delete(`/auth/students/${id}`);

      alert("Deleted successfully ✅");

      // ✅ remove from UI instantly
      setStudents(prev => prev.filter(s => s._id !== id));

    } catch (err) {

      console.error(err);
      alert(err.response?.data?.msg || "Delete failed ❌");

    }
  };

  // ================= DELETE ALL STUDENTS =================
  const deleteAllStudents = async () => {
    if (!window.confirm("⚠️ Are you absolutely sure you want to delete ALL students and their results? This action CANNOT be undone! ❌")) return;
    
    try {
      setLoading(true);
      // Execute all delete requests concurrently safely processing the loop
      await Promise.all(students.map(s => API.delete(`/auth/students/${s._id}`)));
      alert("All students and their results deleted successfully ✅");
      setStudents([]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to delete some or all students ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= EXPORT HANDLER =================
  const handleExport = async (type) => {
    try {
      const btn = document.getElementById(`export-${type}-btn`);
      const originalText = btn ? btn.innerText : "";
      if (btn) btn.innerText = "⏳ Processing...";

      const response = await API.get(`/auth/students?export=${type}`, {
        responseType: 'blob', // Secure blob download
      });
      
      const mimeType = type === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_list.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      if (btn) btn.innerText = originalText;
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed! Ensure the server is online. ❌");
      const btn = document.getElementById(`export-${type}-btn`);
      if (btn) btn.innerText = type === 'pdf' ? "📄 Download PDF" : "📊 Download Excel";
    }
  };

  // ================= FETCH =================
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await API.get("/auth/students");
        setStudents(res.data || []);
      } catch (err) {
        console.error("Students fetch error:", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // ================= SCORE COLOR =================
  const getClass = (avg) => {
    if (avg >= 70) return "score-high";
    if (avg >= 40) return "score-mid";
    return "score-low";
  };

  return (
    <div className="students-page">

      {/* HEADER */}
      <div className="page-header">
        <h2>Registered Students</h2>
        <p>Track performance and activity</p>
      </div>

      {/* CARD */}
      <div className="students-card">

        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", paddingBottom: "15px" }}>
          <h3 style={{ margin: 0 }}>All Students</h3>
          
          <div className="export-buttons" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button 
              id="export-pdf-btn" 
              onClick={() => handleExport('pdf')}
              style={{ background: "#f43f5e", color: "white", padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px", flex: "1 1 auto", textAlign: "center" }}
            >
              📄 Download PDF
            </button>
            <button 
              id="export-excel-btn" 
              onClick={() => handleExport('excel')}
              style={{ background: "#10b981", color: "white", padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px", flex: "1 1 auto", textAlign: "center" }}
            >
              📊 Download Excel
            </button>
            <button 
              onClick={deleteAllStudents}
              style={{ background: "#dc2626", color: "white", padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px", flex: "1 1 auto", textAlign: "center" }}
            >
              🗑 Delete All Students
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="empty-state">
            <h3>Loading students...</h3>
          </div>
        ) : students.length === 0 ? (

          <div className="empty-state">
            <div className="icon">👥</div>
            <h3>No students registered</h3>
            <p>Students will appear here after registration</p>
          </div>

        ) : (

          <div className="table-wrapper" style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch", borderRadius: "8px", border: "1px solid #e2e8f0" }}>

            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>

              <thead style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "12px 15px" }}>Student</th>
                  <th style={{ padding: "12px 15px" }}>Email</th>
                  <th style={{ padding: "12px 15px" }}>Tests</th>
                  <th style={{ padding: "12px 15px" }}>Average Score</th>
                  <th style={{ padding: "12px 15px" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id || i} style={{ borderBottom: "1px solid #e2e8f0" }}>

                    <td style={{ padding: "12px 15px" }}>
                      <div className="student-cell" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="avatar" style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                          {s.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ color: "#1e293b" }}>{s.name}</strong>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px 15px", color: "#475569" }}>{s.email}</td>

                    <td className="tests-count" style={{ padding: "12px 15px", color: "#475569", fontWeight: "bold" }}>
                      {s.tests || 0}
                    </td>

                    <td style={{ padding: "12px 15px" }}>
                      <span className={`pill ${getClass(s.avg || 0)}`} style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", 
                        backgroundColor: s.avg >= 70 ? "#dcfce7" : s.avg >= 40 ? "#fef9c3" : "#fee2e2",
                        color: s.avg >= 70 ? "#16a34a" : s.avg >= 40 ? "#ca8a04" : "#dc2626"
                      }}>
                        {s.avg || 0}%
                      </span>
                    </td>

                    {/* ✅ DELETE BUTTON */}
                    <td style={{ padding: "12px 15px" }}>
                      <button
                        className="btn-delete"
                        onClick={() => deleteStudent(s._id)}
                        style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                      >
                        🗑 Delete
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

export default Students;