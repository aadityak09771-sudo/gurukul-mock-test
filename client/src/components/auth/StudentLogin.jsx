import { useState } from "react";
import { loginStudent, forgotPasswordAPI, resetPasswordAPI } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import "./StudentLogin.css";
export default function StudentLogin({ setIsRegister }) {
  const [form, setForm] = useState({});
  const [view, setView] = useState("login"); // 'login', 'forgot', 'otp'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await loginStudent(form.email, form.password);
      localStorage.setItem("auth", JSON.stringify(res.data));
      navigate("/student");
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!form.email) return alert("Please enter your registered email ❌");
    try {
      setLoading(true);
      const res = await forgotPasswordAPI(form.email);
      alert(res.msg);
      setView("otp");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!form.otp || !form.newPassword) return alert("Please fill both OTP and New Password ❌");
    try {
      setLoading(true);
      const res = await resetPasswordAPI(form.email, form.otp, form.newPassword);
      alert(res.msg);
      setView("login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (view === "forgot") {
    return (
      <>
        <h2>Forgot Password?</h2>
        <p className="welcome-subtext">Enter your email to receive an OTP</p>
        <div className="form-group">
          <label>Registered Email</label>
          <input type="email" placeholder="student@example.com" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={handleSendOtp} disabled={loading}>
          {loading ? "Sending..." : "Send OTP ✉️"}
        </button>
        <p className="auth-hint">
          Remembered your password? <span onClick={() => setView("login")} style={{cursor: "pointer", color: "#2563eb", fontWeight: "bold"}}>Login here</span>
        </p>
      </>
    );
  }

  if (view === "otp") {
    return (
      <>
        <h2>Reset Password</h2>
        <p className="welcome-subtext">Enter the 6-digit OTP sent to {form.email}</p>
        <div className="form-group">
          <label>OTP</label>
          <input type="text" placeholder="123456" maxLength="6" onChange={(e) => setForm({ ...form, otp: e.target.value })} />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input type="password" placeholder="Enter new password" onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={handleResetPassword} disabled={loading}>
          {loading ? "Resetting..." : "Reset Password ✅"}
        </button>
        <p className="auth-hint">
          <span onClick={() => setView("login")} style={{cursor: "pointer", color: "#2563eb", fontWeight: "bold"}}>Cancel & Login</span>
        </p>
      </>
    );
  }

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

      <div style={{ textAlign: "right", marginTop: "-10px", marginBottom: "15px" }}>
        <span style={{ fontSize: "13px", color: "#2563eb", cursor: "pointer", fontWeight: "bold" }} onClick={() => setView("forgot")}>Forgot Password?</span>
      </div>

      <button className="btn-primary" onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login →"}
      </button>

      <p className="auth-hint">
        Don't have account?{" "}
        <span onClick={() => setIsRegister(true)}>Register</span>
      </p>
    </>
  );
}