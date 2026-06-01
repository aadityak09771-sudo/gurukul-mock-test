import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

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

            <p className="brand-tagline">
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

          {/* ROLE SWITCH */}
          <div className="role-switch">
            <button
              className={role === "student" ? "active" : ""}
              onClick={() => {
                setRole("student");
                setIsRegister(false);
              }}
            >
              👨‍🎓 Student
            </button>

            <button
              className={role === "admin" ? "active" : ""}
              onClick={() => {
                setRole("admin");
                setIsRegister(false);
              }}
            >
              👨‍💼 Admin
            </button>
          </div>

          <h2>{isRegister ? "Create Account" : "Welcome Back!"}</h2>
          <p className="welcome-subtext">
            Login to continue your preparation journey
          </p>

          {/* NAME FIELD */}
          {isRegister && role === "student" && (
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
          {role === "student" && (
            <p className="register-text">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}

              <span onClick={() => setIsRegister(!isRegister)}>
                {isRegister ? " Login here" : " Register here"}
              </span>
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;