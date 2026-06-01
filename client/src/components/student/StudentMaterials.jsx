import React, { useEffect, useState } from "react";
import API from "../../services/api";

const StudentMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await API.get("/materials");
        setMaterials(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

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

  return (
    <div className="student-results">
      <h2>📚 Study Materials & Results</h2>
      <p style={{ color: "#64748b", marginBottom: "20px" }}>Access all uploaded videos, documents, and results here.</p>

      {loading ? (
        <p>Loading materials...</p>
      ) : materials.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px", textAlign: "center", background: "white", borderRadius: "12px", border: "1px solid #eef1f8" }}>
          <div className="icon" style={{ fontSize: "40px", marginBottom: "10px" }}>📂</div>
          <h3 style={{ color: "#0f1b3d" }}>No materials available right now.</h3>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "50px" }}>
          {Object.entries(
            materials.reduce((acc, mat) => {
              const cat = mat.category || "General";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(mat);
              return acc;
            }, {})
          ).map(([category, catMaterials]) => (
            <div key={category} className="material-category-section" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "20px", color: "#1e293b", margin: 0, borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>{category}</h3>
              <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                {catMaterials.map((mat) => (
            <div key={mat._id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", height: "100%", justifyContent: "space-between" }}>
              
              <div>
                {mat.type === "image" && (
                  <div style={{ width: "100%", height: "150px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "15px" }}>
                    <img src={mat.fileUrl} alt={mat.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                )}

                <div style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "32px" }}>{mat.type === "video" ? "🎥" : mat.type === "result" ? "📊" : mat.type === "image" ? "🖼️" : "📄"}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 5px 0", color: "#0f1b3d", fontSize: "16px" }}>{mat.title}</h4>
                    <span style={{ display: "inline-block", background: "#eef1f8", color: "#475569", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold", marginBottom: "5px" }}>{mat.type}</span>
                    <p style={{ margin: "0 0 5px 0", color: "#64748b", fontSize: "13px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{mat.description || "No description provided."}</p>
                    <small style={{ color: "#94a3b8", fontSize: "12px", display: "block", marginTop: "5px" }}>Uploaded on {new Date(mat.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "auto" }}>
                <button onClick={(e) => handleView(e, mat)} style={{ display: "block", textAlign: "center", padding: "10px 16px", background: "#2563eb", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "600", width: "100%", boxSizing: "border-box", border: "none", cursor: "pointer" }}>
                  View/Download {mat.type === "video" ? "Video 🎥" : mat.type === "result" ? "Result 📊" : mat.type === "image" ? "Image 🖼️" : "Document 📄"} →
                </button>
              </div>
            </div>
          ))}
        </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMaterials;