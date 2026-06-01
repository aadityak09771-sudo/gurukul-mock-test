import { useState } from "react";
import { loginAdmin } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
export default function AdminLogin() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await loginAdmin(form);
      localStorage.setItem("auth", JSON.stringify(res.data));
      navigate("/admin");
    } catch {
      alert("Invalid admin");
    }
  };

  return (
    <>
      <h2>Admin Login</h2>

      <input
        className="auth-input"
        placeholder="Username"
        onChange={(e)=>setForm({...form,username:e.target.value})}
      />

      <input
        className="auth-input"
        type="password"
        placeholder="Password"
        onChange={(e)=>setForm({...form,password:e.target.value})}
      />
      <button className="btn-primary" onClick={handleLogin}>
        Login →
      </button>
    </>
  );
}