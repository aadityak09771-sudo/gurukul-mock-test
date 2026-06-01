import { useState } from "react";
import { loginStudent } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import "./StudentLogin.css";
export default function StudentLogin({ setIsRegister }) {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await loginStudent(form);
      localStorage.setItem("auth", JSON.stringify(res.data));
      navigate("/student");
    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <>
      <h2>Welcome Back!</h2>

      <div className="form-group">
        <label>Email</label>
        <input
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>

      <button className="btn-primary" onClick={handleLogin}>
        Login →
      </button>

      <p className="auth-hint">
        Don't have account?{" "}
        <span onClick={() => setIsRegister(true)}>Register</span>
      </p>
    </>
  );
}