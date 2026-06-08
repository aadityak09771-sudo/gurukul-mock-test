import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "../components/admin/ResultDetails.css"; // Reuse the beautiful styling from Admin panel!

// ✅ GOVT EXAM HELPER: Safely fallback to English if Hindi translation is blank
const getLangText = (textEng, textHin, language) => {
  const isHinEmpty = !textHin || textHin === '<p><br></p>' || textHin.trim() === '';
  return language === 'hindi' && !isHinEmpty ? textHin : (textEng || "");
};

const getLangOptions = (optEng, optHin, language) => {
  const isHinEmpty = !optHin || !optHin.A || optHin.A === '<p><br></p>' || optHin.A.trim() === '';
  return language === 'hindi' && !isHinEmpty ? optHin : (optEng || null);
};

const ResultPage = ({ result: propResult }) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();

  const [result, setResult] = useState(propResult || null);
  const [loading, setLoading] = useState(!propResult);

  // ================= FETCH RESULT =================
  useEffect(() => {
    if (propResult) {
      setResult(propResult);
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const resultId = paramId || localStorage.getItem("resultId");

        if (!resultId) {
          alert("No result found ❌");
          return;
        }

        const res = await API.get(`/results/${resultId}`);
        setResult(res.data);
      } catch (err) {
        console.error("FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [paramId, propResult]);

  // ================= EXPORT HANDLER =================
  const handleExport = async (type) => {
    try {
      const exportId = result?._id || paramId || localStorage.getItem("resultId");
      if (!exportId) {
        alert("No result ID found to export ❌");
        return;
      }

      const btn = document.getElementById(`export-${type}-btn`);
      const originalText = btn ? btn.innerText : "";
      if (btn) btn.innerText = "⏳ Processing...";

      // ✅ Uses the safe query parameter to bypass protected admin routes
      const response = await API.get(`/results/${exportId}?export=${type}`, {
        responseType: 'blob', // Secure blob download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my_result_${exportId}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
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

  // ================= SAFE BACK NAVIGATION =================
  const handleBack = () => {
    if (window.history.length > 2) { navigate(-1); } else { navigate("/student-dashboard"); }
  };

  // ================= SAFE LOAD =================
  if (loading) return <h2 style={{ padding: 40 }}>Loading...</h2>;
  if (!result) return <h2 style={{ padding: 40 }}>Result not found ❌</h2>;

  // ================= PIE CHART CALCULATION =================
  const totalCorrect = result.sectionResults?.reduce((acc, sec) => acc + (sec.correct || 0), 0) || 0;
  const totalWrong = result.sectionResults?.reduce((acc, sec) => acc + (sec.wrong || 0), 0) || 0;
  const totalMCQs = result.sectionResults?.reduce((acc, sec) => acc + (sec.total || 0), 0) || 0;
  const totalUnattempted = Math.max(0, totalMCQs - totalCorrect - totalWrong);
  const totalWritten = result.sectionResults?.reduce((acc, sec) => acc + (sec.written || 0), 0) || 0;
  const totalQuestions = totalMCQs + totalWritten;
  
  const pctCorrect = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const pctWrong = totalQuestions > 0 ? (totalWrong / totalQuestions) * 100 : 0;
  const pctUnattempted = totalQuestions > 0 ? (totalUnattempted / totalQuestions) * 100 : 0;
  const pctWritten = totalQuestions > 0 ? (totalWritten / totalQuestions) * 100 : 0;
  const pieGradient = `conic-gradient(#16a34a 0% ${pctCorrect}%, #dc2626 ${pctCorrect}% ${pctCorrect + pctWrong}%, #cbd5e1 ${pctCorrect + pctWrong}% ${pctCorrect + pctWrong + pctUnattempted}%, #f59e0b ${pctCorrect + pctWrong + pctUnattempted}% 100%)`;

  return (
    <div className="result-details-page" style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* HEADER */}
      <div className="result-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>My Detailed Result</h2>
        <div className="export-buttons" style={{ display: "flex", gap: "10px", flexWrap: "wrap", zIndex: 10, position: "relative" }}>
          <button id="export-pdf-btn" className="pdf-btn" onClick={() => handleExport('pdf')} style={{ background: "#f43f5e", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600", zIndex: 10 }}>
            📄 Download PDF
          </button>
          <button id="export-excel-btn" className="excel-btn" onClick={() => handleExport('excel')} style={{ background: "#10b981", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600", zIndex: 10 }}>
            📊 Download Excel
          </button>
          <button onClick={handleBack} style={{ background: "#334155", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600", zIndex: 10 }}>
            🔙 Back
          </button>
        </div>
      </div>

      {/* STUDENT INFO */}
      <div className="info-card">
        <h3>Student Information</h3>
        <div className="info-grid">
          <div>
            <span>Name</span>
            <p style={{ wordBreak: "break-word" }}>{result.studentName || result.studentFields?.name || "-"}</p>
          </div>
          <div>
            <span>Email</span>
            <p style={{ wordBreak: "break-word" }}>{result.studentEmail || result.studentFields?.email || "-"}</p>
          </div>
          <div>
            <span>Roll No</span>
            <p style={{ wordBreak: "break-word" }}>{result.studentRoll || result.studentFields?.roll || result.studentFields?.rollno || result.studentFields?.["Roll No"] || "-"}</p>
          </div>
          <div>
            <span>Phone</span>
            <p style={{ wordBreak: "break-word" }}>{result.studentPhone || result.studentFields?.phone || result.studentFields?.Phone || result.studentFields?.phoneno || "-"}</p>
          </div>
          {(result.studentFields?.course || result.studentFields?.Course) && (
            <div>
              <span>Course</span>
              <p style={{ wordBreak: "break-word" }}>{result.studentFields?.course || result.studentFields?.Course}</p>
            </div>
          )}
          {(result.studentFields?.branch || result.studentFields?.Branch) && (
            <div>
              <span>Branch</span>
              <p style={{ wordBreak: "break-word" }}>{result.studentFields?.branch || result.studentFields?.Branch}</p>
            </div>
          )}
          {(result.studentFields?.section || result.studentFields?.Section) && (
            <div>
              <span>Section</span>
              <p style={{ wordBreak: "break-word" }}>{result.studentFields?.section || result.studentFields?.Section}</p>
            </div>
          )}
        </div>
      </div>

      {/* TEST INFO */}
      <div className="info-card">
        <h3>Test Information</h3>
        
        {/* PERFORMANCE OVERVIEW & PIE CHART */}
        <div style={{ display: "flex", gap: "30px", alignItems: "center", marginBottom: "25px", padding: "15px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: pieGradient, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}></div>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#334155" }}>Performance Overview</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "12px", height: "12px", background: "#16a34a", borderRadius: "50%" }}></span>
                <span style={{ fontSize: "14px", color: "#475569" }}>Correct: <strong>{totalCorrect} ({pctCorrect.toFixed(1)}%)</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "12px", height: "12px", background: "#dc2626", borderRadius: "50%" }}></span>
                <span style={{ fontSize: "14px", color: "#475569" }}>Wrong: <strong>{totalWrong} ({pctWrong.toFixed(1)}%)</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "12px", height: "12px", background: "#cbd5e1", borderRadius: "50%" }}></span>
                <span style={{ fontSize: "14px", color: "#475569" }}>Unattempted: <strong>{totalUnattempted} ({pctUnattempted.toFixed(1)}%)</strong></span>
              </div>
              {totalWritten > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", background: "#f59e0b", borderRadius: "50%" }}></span>
                  <span style={{ fontSize: "14px", color: "#475569" }}>Written: <strong>{totalWritten} ({pctWritten.toFixed(1)}%)</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="info-grid">
          <div>
            <span>Test Name</span>
            <p>{result.testName}</p>
          </div>
          <div>
            <span>Score</span>
            <p>{result.score}/{result.total}</p>
          </div>
          <div>
            <span>Percentage</span>
            <p>{result.percentage}%</p>
          </div>
          <div>
            <span>Percentile Rank 🏆</span>
            <p style={{ fontWeight: "bold", color: "#8b5cf6" }}>
              {result.percentileRank !== undefined ? `${result.percentileRank}% (Out of ${result.totalParticipants} Students)` : "N/A"}
            </p>
          </div>
          <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #eef1f8", paddingTop: "15px" }}>
            <span>Submission Reason</span>
            <p style={{ fontWeight: "bold", color: result.violations?.reason?.includes("Auto-Submit") ? "red" : "#2563eb" }}>
              {result.violations?.reason || "Normal Submission"}
            </p>
          </div>
        </div>
      </div>

      {/* SECURITY REPORT */}
      {result.violations && (
        <div className="info-card">
          <h3>Security & Monitoring Report 🛡️</h3>
          <div className="info-grid">
            <div>
              <span>Tab Switches Detected</span>
              <p style={{ color: result.violations.tabSwitches > 0 ? "red" : "green", fontWeight: "bold" }}>{result.violations.tabSwitches} Times</p>
            </div>
            <div>
              <span>Window Minimized (Alt+Tab)</span>
              <p style={{ color: result.violations.windowBlurs > 0 ? "red" : "green", fontWeight: "bold" }}>{result.violations.windowBlurs} Times</p>
            </div>
            <div>
              <span>Camera Violations (No Face / Multiple Faces)</span>
              <p style={{ color: result.violations.cameraViolations > 0 ? "red" : "green", fontWeight: "bold" }}>{result.violations.cameraViolations} Times</p>
            </div>
            <div>
              <span>Illegal Scrolls Attempted</span>
              <p style={{ color: result.violations.scrolls > 0 ? "red" : "green", fontWeight: "bold" }}>{result.violations.scrolls} Times</p>
            </div>
            {result.violations.noiseViolations !== undefined && (
              <div>
                <span>Mic / Noise Violations</span>
                <p style={{ color: result.violations.noiseViolations > 0 ? "red" : "green", fontWeight: "bold" }}>{result.violations.noiseViolations} Times</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADVANCED SECTION ANALYTICS 📊 */}
      {result.sectionResults?.length > 0 && (
        <div className="info-card">
          <h3>Section-wise Advanced Analytics 📊</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px', marginBottom: "25px" }}>
            {result.sectionResults.map((sec, index) => {
              const correctPct = sec.total > 0 ? (sec.correct / sec.total) * 100 : 0;
              const wrongPct = sec.total > 0 ? (sec.wrong / sec.total) * 100 : 0;
              const unattempted = Math.max(0, (sec.total || 0) - (sec.correct || 0) - (sec.wrong || 0));
              const secWritten = sec.written || 0;
              const secTotal = (sec.total || 0) + secWritten;
              const secCorrectPct = secTotal > 0 ? (sec.correct / secTotal) * 100 : 0;
              const secWrongPct = secTotal > 0 ? (sec.wrong / secTotal) * 100 : 0;
              const secUnattemptedPct = secTotal > 0 ? (unattempted / secTotal) * 100 : 0;
              const secWrittenPct = secTotal > 0 ? (secWritten / secTotal) * 100 : 0;
              
              return (
                <div key={index} style={{ padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ fontSize: "15px", color: "#1e293b" }}>{sec.sectionName}</strong>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#3b82f6" }}>Score: {sec.score} / {sec.totalMarks || (sec.total * (result.testId?.marksCorrect || 4))}</span>
                  </div>
                  <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "10px" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: `conic-gradient(#16a34a 0% ${secCorrectPct}%, #dc2626 ${secCorrectPct}% ${secCorrectPct + secWrongPct}%, #cbd5e1 ${secCorrectPct + secWrongPct}% ${secCorrectPct + secWrongPct + secUnattemptedPct}%, #f59e0b ${secCorrectPct + secWrongPct + secUnattemptedPct}% 100%)`, boxShadow: "0 2px 4px rgba(0,0,0,0.1)", flexShrink: 0 }}></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#64748b" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "10px", height: "10px", background: "#16a34a", borderRadius: "50%" }}></span><span style={{ fontWeight: "bold", color: "#334155" }}>Correct:</span> {sec.correct} ({secCorrectPct.toFixed(1)}%)</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "10px", height: "10px", background: "#dc2626", borderRadius: "50%" }}></span><span style={{ fontWeight: "bold", color: "#334155" }}>Wrong:</span> {sec.wrong} ({secWrongPct.toFixed(1)}%)</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "10px", height: "10px", background: "#cbd5e1", borderRadius: "50%" }}></span><span style={{ fontWeight: "bold", color: "#334155" }}>Unattempted:</span> {unattempted} ({secUnattemptedPct.toFixed(1)}%)</div>
                      {secWritten > 0 && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "10px", height: "10px", background: "#f59e0b", borderRadius: "50%" }}></span><span style={{ fontWeight: "bold", color: "#334155" }}>Written:</span> {secWritten} ({secWrittenPct.toFixed(1)}%)</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="section-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "10px", borderBottom: "2px solid #e2e8f0" }}>Section</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #e2e8f0" }}>Accuracy</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #e2e8f0" }}>Correct</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #e2e8f0" }}>Wrong</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #e2e8f0" }}>Unattempted</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #e2e8f0" }}>Score</th>
                  <th style={{ padding: "10px", borderBottom: "2px solid #e2e8f0" }}>Total MCQs</th>
                </tr>
              </thead>
              <tbody>
                {result.sectionResults.map((sec, index) => {
                  const secUnattempted = Math.max(0, (sec.total || 0) - (sec.correct || 0) - (sec.wrong || 0));
                  const secPct = sec.total > 0 ? ((sec.correct / sec.total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={index} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px" }}>{sec.sectionName}</td>
                      <td style={{ padding: "10px" }}><span style={{ fontWeight: "bold", color: secPct >= 50 ? "#16a34a" : "#dc2626" }}>{secPct}%</span></td>
                      <td style={{ padding: "10px" }}>{sec.correct}</td>
                      <td style={{ padding: "10px" }}>{sec.wrong}</td>
                      <td style={{ padding: "10px" }}>{secUnattempted}</td>
                      <td style={{ padding: "10px" }}>{sec.score} / {sec.totalMarks || (sec.total * (result.testId?.marksCorrect || 4))}</td>
                      <td style={{ padding: "10px" }}>{sec.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANSWERS */}
      <div className="answers-card info-card">
        <h3>Detailed Answers</h3>
        <style>{`
          .rich-text-content p {
            margin: 0;
            display: inline-block;
          }
          .rich-text-content img {
            max-width: 100%;
            height: auto;
          }
        `}</style>
        {result.testId && result.testId.sections ? (
          result.testId.sections.map((sec, secIndex) => (
            <div key={secIndex} style={{ marginBottom: "20px" }}>
              <h4 style={{ borderBottom: "2px solid #eef1f8", paddingBottom: "10px", color: "#1e293b", marginTop: "20px" }}>{sec.name}</h4>
              {sec.questions.map((q, qIndex) => {
                const key = `${secIndex}-${qIndex}`;
                const chosen = result.answers ? result.answers[key] : null;
                const qMarksCorrect = q.marksCorrect !== undefined && q.marksCorrect !== null ? q.marksCorrect : (result.testId?.marksCorrect || 4);
                const qMarksNegative = q.marksNegative !== undefined && q.marksNegative !== null ? q.marksNegative : (result.testId?.marksNegative || 1);
                
                const language = result.studentFields?.language || "english";
                  const qText = getLangText(q.q, q.qHindi, language);
                  const qOptions = getLangOptions(q.options, q.optionsHindi, language);

                if (q.type === "written") {
                  return (
                    <div key={qIndex} style={{ marginBottom: "15px", padding: "15px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
                      <div style={{ fontWeight: "bold", margin: "0 0 10px 0", fontSize: "15px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        Q (Written): <div dangerouslySetInnerHTML={{ __html: qText }} className="rich-text-content" /> <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>[+{qMarksCorrect}, -{qMarksNegative} Marks]</span>
                      </div>
                      {q.questionImage && (
                        <div style={{ margin: "10px 0" }}>
                          <img src={q.questionImage} alt="Question Figure" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                        </div>
                      )}
                      <p style={{ margin: "5px 0", color: "#475569", fontWeight: "600" }}>
                        Your Answer: {chosen || "Not Answered"}
                      </p>
                    </div>
                  );
                }

                const isCorrect = chosen === q.correct;
                return (
                  <div key={qIndex} style={{ marginBottom: "15px", padding: "15px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "bold", margin: "0 0 10px 0", fontSize: "15px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      Q: <div dangerouslySetInnerHTML={{ __html: qText }} className="rich-text-content" /> <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>[+{qMarksCorrect}, -{qMarksNegative} Marks]</span>
                    </div>
                    {q.questionImage && (
                      <div style={{ margin: "10px 0" }}>
                        <img src={q.questionImage} alt="Question Figure" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                      </div>
                    )}
                    
                    {qOptions && Object.entries(qOptions).map(([optKey, optVal]) => {
                      let bgColor = "transparent";
                      let color = "#334155";
                      let fw = "normal";
                      let border = "1px solid #e2e8f0";
                      if (optKey === q.correct) {
                        bgColor = "#dcfce7";
                        color = "#166534";
                        fw = "bold";
                        border = "1px solid #22c55e";
                      } else if (chosen === optKey && chosen !== q.correct) {
                        bgColor = "#fee2e2";
                        color = "#991b1b";
                        fw = "bold";
                        border = "1px solid #ef4444";
                      }
                      
                      return (
                        <div key={optKey} style={{ padding: "8px 12px", margin: "4px 0", borderRadius: "6px", backgroundColor: bgColor, color: color, fontWeight: fw, border: border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span>{optKey}.</span>
                            <span dangerouslySetInnerHTML={{ __html: optVal }} className="rich-text-content" />
                          </span>
                          <span>{optKey === q.correct ? "✅" : (chosen === optKey ? "❌" : "")}</span>
                        </div>
                      );
                    })}

                    <p style={{ marginTop: "10px", color: chosen ? (isCorrect ? "#16a34a" : "#dc2626") : "#64748b", fontWeight: "600" }}>
                      Your Answer: {chosen || "Not Attempted"}
                    </p>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <p>Detailed questions not available.</p>
        )}
      </div>

    </div>
  );
};

export default ResultPage;