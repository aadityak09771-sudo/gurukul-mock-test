import React, { useState, useEffect } from "react";
import { changeMyPasswordAPI, getAdminCredentialsAPI, getAdminsAPI, updateAdminPasswordAPI } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const ChangePasswordSettings = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.email === "superadmin@gmail.com";

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creds, setCreds] = useState({ email: "Loading...", password: "..." });

  const [adminList, setAdminList] = useState([]);
  const [adminNewPasswords, setAdminNewPasswords] = useState({});

  const fetchCreds = async () => {
    try {
      const data = await getAdminCredentialsAPI();
      setCreds(data);
    } catch (err) {
      console.error(err);
      const errMsg = err.message || "API Network Error";
      setCreds({ email: `❌ Error: ${errMsg}`, password: "Not Available" });
    }

    if (isSuperAdmin) {
      try {
        const admins = await getAdminsAPI();
        if (Array.isArray(admins)) {
          setAdminList(admins);
        }
      } catch (err) {
        console.error("SuperAdmin API Error:", err);
        alert("Super Admin Fetch Error: " + err.message);
      }
    }
  };

  useEffect(() => {
    fetchCreds();
  }, [isSuperAdmin]);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return alert("Fill all fields");
    try {
      const res = await changeMyPasswordAPI(oldPassword, newPassword);
      alert(res.msg); // Password changed successfully
      setOldPassword("");
      setNewPassword("");
      fetchCreds(); // Refresh the visible password immediately
    } catch (err) {
      alert(err.message); // Incorrect password error
    }
  };

  const handleForceUpdate = async (adminId) => {
    const pass = adminNewPasswords[adminId];
    if (!pass) return alert("Enter new password");
    try {
      await updateAdminPasswordAPI(adminId, pass);
      alert("Client Admin Password forcefully changed! ✅");
      setAdminNewPasswords({ ...adminNewPasswords, [adminId]: "" });
      fetchCreds();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "600px", marginTop: "20px" }}>
      
      {/* MY CREDENTIALS BLOCK */}
      <div style={{ padding: "20px", background: "white", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#1e293b" }}>🔒 My Credentials</h3>

        <div style={{ marginBottom: "20px", padding: "12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
          <p style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#475569" }}><strong>Login Email:</strong> {creds.email}</p>
          <p style={{ margin: "0", fontSize: "14px", color: "#475569" }}><strong>Current Password:</strong> <span style={{ color: "#2563eb", fontWeight: "bold" }}>{creds.password}</span></p>
        </div>

        {creds.email && creds.email.includes("❌") && (
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = "/";
            }} 
            style={{ background: "#dc2626", color: "white", padding: "10px", width: "100%", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "15px" }}>
            ⚠️ FACTORY RESET LOGIN (CLICK HERE) ⚠️
          </button>
        )}

        <input 
          type="password" placeholder="Old Password" value={oldPassword} 
          onChange={(e) => setOldPassword(e.target.value)} 
          style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
        />
        <input 
          type="text" placeholder="New Password" value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
          style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
        />
        <button onClick={handleChangePassword} style={{ background: "#2563eb", color: "white", padding: "10px", width: "100%", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          Update My Password
        </button>
      </div>

      {/* SUPER ADMIN CONTROLS BLOCK */}
      {isSuperAdmin && (
        <div style={{ padding: "20px", background: "white", borderRadius: "10px", border: "2px solid #f43f5e" }}>
          <h3 style={{ marginTop: 0, marginBottom: "10px", color: "#e11d48" }}>🛡️ Super Admin Controls</h3>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "15px", marginTop: 0 }}>Manage client admin passwords directly below.</p>
          
          {Array.isArray(adminList) && adminList.map(adm => (
            <div key={adm._id} style={{ background: "#fff1f2", padding: "15px", borderRadius: "8px", border: "1px solid #fda4af", marginBottom: "15px", textAlign: "left" }}>
              <p style={{ margin: "0 0 5px 0", color: "#881337", fontSize: "14px" }}><strong>Name:</strong> {adm.name}</p>
              <p style={{ margin: "0 0 5px 0", color: "#881337", fontSize: "14px" }}><strong>Client Email:</strong> {adm.email}</p>
              <p style={{ margin: "0 0 10px 0", color: "#881337", fontSize: "14px" }}><strong>Current Password:</strong> <span style={{ color: "#e11d48", fontWeight: "bold", fontSize: "16px" }}>{adm.visiblePassword || "Hidden (Update to see)"}</span></p>
              <input type="text" placeholder="Type New Password for this Client" value={adminNewPasswords[adm._id] || ""} onChange={e => setAdminNewPasswords({...adminNewPasswords, [adm._id]: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #fda4af", marginBottom: "10px", boxSizing: "border-box" }} />
              <button onClick={() => handleForceUpdate(adm._id)} style={{ background: "#e11d48", color: "white", padding: "10px", width: "100%", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Force Update Client Password</button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ChangePasswordSettings;