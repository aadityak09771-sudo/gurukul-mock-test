import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { forgotPasswordAPI, resetPasswordAPI } from "../services/authService";
import "./AuthPage.css";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ================= LOGIN =================
  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email & password ❌");
      return;
    }

    try {
      setLoading(true);

      const user = await login(email, password);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= REGISTER =================
  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert("Fill all fields ❌");
      return;
    }

    try {
      setLoading(true);

      await register(name, email, password, "student");

      navigate("/student");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= FORGOT PASSWORD =================
  const handleSendOtp = async () => {
    if (!email) return alert("Please enter your registered email ❌");
    try {
      setLoading(true);
      const res = await forgotPasswordAPI(email);
      alert(res.msg);
      setForgotMode(false);
      setOtpMode(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) return alert("Please fill both OTP and New Password ❌");
    try {
      setLoading(true);
      const res = await resetPasswordAPI(email, otp, newPassword);
      alert(res.msg);
      setOtpMode(false);
      setPassword("");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* LEFT SIDE */}
        <div className="auth-left">
         <div className="brand">

          <img
            src="/logo.jpeg"
            alt="logo"
            className="logo-img"
          />

          <div className="brand-text">

            <h3 className="brand-title">
              Gurukul Success Classes
            </h3>

            <p className="brand-tagline" style={{ color: "#1e3a8a", fontWeight: "bold" }}>
              Aptitude Today, Success Tomorrow
            </p>

          </div>

        </div>

          <h1>Your Smart Mock Test Platform</h1>

          <p className="hero-desc">
            Practice with real exam-style questions. Track your
            performance across Verbal, Numerical, and Reasoning sections.
          </p>

          <div className="features">
            <div className="feature-card">
              <span className="feature-icon">📚</span>
              <div className="feature-info">
                <h3>50+ Tests</h3>
                <p>Mock Exams</p>
              </div>
            </div>

            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <div className="feature-info">
                <h3>Live Exams</h3>
                <p>Real-Time</p>
              </div>
            </div>

            <div className="feature-card">
              <span className="feature-icon">🤖</span>
              <div className="feature-info">
                <h3>AI Analytics</h3>
                <p>Smart Reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-right">

          {forgotMode ? (
            <>
              {/* PREMIUM HEADER UI (FORGOT PASSWORD) */}
              <div style={{ textAlign: "center", marginBottom: "30px", padding: "25px 20px", background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)", borderRadius: "16px", border: "1px solid #fde68a", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 15px rgba(245, 158, 11, 0.15)", transition: "all 0.3s ease", cursor: "default" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(255,255,255,0.5), 0 8px 20px rgba(245, 158, 11, 0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 15px rgba(245, 158, 11, 0.15)"; }}>
                <h2 style={{ margin: "0 0 8px 0", color: "#b45309", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                  Forgot Password?
                </h2>
                <p style={{ margin: 0, color: "#9a3412", fontSize: "15px", fontWeight: "500" }}>
                  Enter your email to receive an OTP
                </p>
              </div>
              
              <label>Registered Email</label>
              <input
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button className="login-btn" onClick={handleSendOtp} disabled={loading} style={{ marginTop: "20px" }}>
                {loading ? "Sending..." : "Send OTP ✉️"}
              </button>

              <p className="register-text">
                Remembered your password?{" "}
                <span onClick={() => setForgotMode(false)}>Login here</span>
              </p>
            </>
          ) : otpMode ? (
            <>
              {/* PREMIUM HEADER UI (OTP MODE) */}
              <div style={{ textAlign: "center", marginBottom: "30px", padding: "25px 20px", background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)", borderRadius: "16px", border: "1px solid #fde68a", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 15px rgba(245, 158, 11, 0.15)", transition: "all 0.3s ease", cursor: "default" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(255,255,255,0.5), 0 8px 20px rgba(245, 158, 11, 0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 15px rgba(245, 158, 11, 0.15)"; }}>
                <h2 style={{ margin: "0 0 8px 0", color: "#b45309", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                  Reset Password
                </h2>
                <p style={{ margin: 0, color: "#9a3412", fontSize: "15px", fontWeight: "500", wordBreak: "break-word" }}>
                  Enter the 6-digit OTP sent to {email}
                </p>
              </div>
              
              <label>OTP</label>
              <input
                placeholder="123456"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <button className="login-btn" onClick={handleResetPassword} disabled={loading} style={{ marginTop: "20px" }}>
                {loading ? "Resetting..." : "Reset Password ✅"}
              </button>

              <p className="register-text">
                <span onClick={() => { setOtpMode(false); setForgotMode(false); }}>Cancel & Login</span>
              </p>
            </>
          ) : (
            <>

        {/* PREMIUM HEADER UI */}
        <div style={{ textAlign: "center", marginBottom: "30px", padding: "25px 20px", background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)", borderRadius: "16px", border: "1px solid #fde68a", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 15px rgba(245, 158, 11, 0.15)", transition: "all 0.3s ease", cursor: "default" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(255,255,255,0.5), 0 8px 20px rgba(245, 158, 11, 0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 15px rgba(245, 158, 11, 0.15)"; }}>
          <h2 style={{ margin: "0 0 8px 0", color: "#b45309", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            {isRegister ? "Create Account" : "Welcome Back!"}
          </h2>
          <p style={{ margin: 0, color: "#9a3412", fontSize: "15px", fontWeight: "500" }}>
            {isRegister ? "Join us and accelerate your career" : "Login to continue your preparation journey"}
          </p>
        </div>

          {/* NAME FIELD */}
        {isRegister && (
            <>
              <label>Full Name</label>
              <input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}

          {/* EMAIL */}
          <label>Email Address</label>
          <input
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

        {!isRegister && (
            <div style={{ textAlign: "right", marginTop: "5px", marginBottom: "15px" }}>
              <span style={{ fontSize: "13px", color: "#2563eb", cursor: "pointer", fontWeight: "bold" }} onClick={() => { setForgotMode(true); setOtpMode(false); }}>Forgot Password?</span>
            </div>
          )}

          {/* BUTTON */}
          <button
            className="login-btn"
            onClick={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading
              ? isRegister
                ? "Creating..."
                : "Logging in..."
              : isRegister
              ? "Create Account →"
              : "Login →"}
          </button>

          {/* REGISTER LINK */}
        {!isRegister && (
            <p className="register-text">
            Don't have an account?

              <span onClick={() => setIsRegister(!isRegister)}>
              Register here
              </span>
            </p>
          )}
        {isRegister && (
          <p className="register-text">
            Already have an account?
            <span onClick={() => setIsRegister(!isRegister)}>
              Login here
            </span>
          </p>
        )}

            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;