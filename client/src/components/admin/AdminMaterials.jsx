import React, { useEffect, useState } from "react";
import API from "../../services/api";
import "./AdminMaterials.css";

const AdminMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    description: "",
    fileUrl: "",
    type: "document"
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, fileUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.fileUrl || !formData.type) {
      alert("Please fill all required fields (Title, Type, File/URL)");
      return;
    }
    try {
      setIsUploading(true);
      await API.post("/materials", formData);
      alert("Material uploaded successfully ✅");
      setFormData({ title: "", category: "General", description: "", fileUrl: "", type: "document" });
      fetchMaterials();
    } catch (err) {
      console.error(err);
      alert("Failed to upload material ❌");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material? ❌")) return;
    try {
      await API.delete(`/materials/${id}`);
      alert("Material deleted ✅");
      fetchMaterials();
    } catch (err) {
      console.error(err);
      alert("Delete failed ❌");
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

  return (
    <div className="materials-page">
      <div className="page-header">
        <h2>📚 Study Materials & Results</h2>
        <p>Upload videos, documents, and results for students</p>
      </div>

      <div className="materials-container">
        {/* UPLOAD FORM */}
        <div className="card upload-card">
          <div className="card-header">
            <h3>Upload New Material</h3>
          </div>
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-group2">
              <label>Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Enter title" required />
            </div>

            <div className="form-group2">
              <label>Category (e.g. SSC, Bank)</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Enter category" />
            </div>

            <div className="form-group2">
              <label>Type *</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="document">Document (PDF/Doc)</option>
                <option value="video">Video Link (YouTube etc.)</option>
                <option value="result">Result File</option>
                <option value="image">Image / Poster</option>
              </select>
            </div>

            <div className="form-group2">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter short description" rows="3"></textarea>
            </div>

            <div className="form-group2">
              <label>File / URL *</label>
              {formData.type === "video" ? (
                <input type="text" name="fileUrl" value={formData.fileUrl} onChange={handleChange} placeholder="Enter Video URL (e.g. YouTube link)" required />
              ) : (
                <div style={{ display: "flex", gap: "10px" }}>
                  <input type="text" value={formData.fileUrl?.startsWith("data:") ? "📄 File Uploaded (Base64)" : formData.fileUrl} readOnly placeholder="Upload a file ->" style={{ flex: 1, backgroundColor: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} required />
                  <input type="file" id="material-upload" style={{ display: "none" }} onChange={handleFileUpload} />
                  <button type="button" className="btn-sm btn-outline" onClick={() => document.getElementById("material-upload").click()} style={{ whiteSpace: "nowrap" }}>📂 Upload File</button>
                </div>
              )}
            </div>

            <button type="submit" className="btn-green" disabled={isUploading} style={{ marginTop: "15px", width: "100%", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
              {isUploading ? "Uploading..." : "🚀 Publish Material"}
            </button>
          </form>
        </div>

        {/* MATERIALS LIST */}
        <div className="card list-card">
          <div className="card-header">
            <h3>Uploaded Materials</h3>
          </div>
          {loading ? (
            <p style={{ padding: "20px" }}>Loading materials...</p>
          ) : materials.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📂</div>
              <h3>No materials uploaded</h3>
            </div>
          ) : (
            <div className="materials-grid">
              {materials.map((mat) => (
                <div key={mat._id} className="material-item">
                  <div className="mat-icon">
                    {mat.type === "video" ? "🎥" : mat.type === "result" ? "📊" : mat.type === "image" ? "🖼️" : "📄"}
                  </div>
                  <div className="mat-info">
                    <h4>{mat.title}</h4>
                    <span className="mat-badge">{mat.type}</span>
                    <span className="mat-badge" style={{ marginLeft: "5px", backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
                      🏷️ {mat.category || "General"}
                    </span>
                    <p>{mat.description}</p>
                    <small>{new Date(mat.createdAt).toLocaleDateString()}</small>
                  </div>
                  <div className="mat-actions">
                    <button onClick={(e) => handleView(e, mat)} className="btn-sm btn-blue" style={{ textDecoration: "none", textAlign: "center", border: "none", cursor: "pointer" }}>View / Download</button>
                    <button onClick={() => handleDelete(mat._id)} className="btn-sm btn-red">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMaterials;