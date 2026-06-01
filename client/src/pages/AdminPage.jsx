import React, { useEffect } from "react";
import { useNavigate, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Dashboard from "../components/admin/Dashboard";
import CreateTest from "../components/admin/CreateTest";
import ManageTests from "../components/admin/ManageTests";
import Results from "../components/admin/Results";
import Students from "../components/admin/Students";
import AdminPayment from "../components/admin/AdminPayment";
import ResultDetails from "../components/admin/ResultDetails";
import AdminMaterials from "../components/admin/AdminMaterials";
import EditTest from "../components/admin/EditTest";
import "./AdminPage.css";

const AdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) navigate("/");
    else if (user.role !== "admin") navigate("/student");
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="admin-screen">

      {/* NAVBAR */}
      <nav className="admin-nav">
        <div className="brand">
          <div className="brand-icon">
            <img src="/logo.jpeg" alt="gurukul logo" />
          </div>
          <div className="brand-text">
            <h3 className="brand-title">Gurukul Success Classes</h3>
            <p className="brand-tagline">Aptitude Today, Success Tomorrow</p>
          </div>
        </div>

        <div className="nav-right">
          <div className="badge">Admin Panel</div>
          <div className="user-info">Logged in as Admin</div>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div className="admin-body">

        {/* SIDEBAR */}
        <div className="admin-sidebar">

          <button
            className={`sidebar-link ${isActive("dashboard") || location.pathname === "/admin" ? "active" : ""}`}
            onClick={() => navigate("/admin/dashboard")}
          >
            📊 Dashboard
          </button>

          <button
            className={`sidebar-link ${isActive("create-test") ? "active" : ""}`}
            onClick={() => navigate("/admin/create-test")}
          >
            ➕ Create Test
          </button>

          <button
            className={`sidebar-link ${isActive("manage-tests") ? "active" : ""}`}
            onClick={() => navigate("/admin/manage-tests")}
          >
            📋 Manage Tests
          </button>

          <div className="sidebar-sep"></div>

          <button
            className={`sidebar-link ${isActive("results") || isActive("result/") ? "active" : ""}`}
            onClick={() => navigate("/admin/results")}
          >
            📈 Student Results
          </button>

          <button
            className={`sidebar-link ${isActive("students") ? "active" : ""}`}
            onClick={() => navigate("/admin/students")}
          >
            👥 Students
          </button>

          <button
            className={`sidebar-link ${isActive("payment") ? "active" : ""}`}
            onClick={() => navigate("/admin/payment")}
          >
            💳 Payments
          </button>

          <button
            className={`sidebar-link ${isActive("materials") ? "active" : ""}`}
            onClick={() => navigate("/admin/materials")}
          >
            📚 Study Materials
          </button>

        </div>

        {/* CONTENT */}
        <div className="admin-content">

          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create-test" element={<CreateTest />} />
            <Route path="manage-tests" element={<ManageTests />} />
            <Route path="results" element={<Results />} />
            <Route path="students" element={<Students />} />
            <Route path="payment" element={<AdminPayment />} />
            <Route path="result/:id" element={<ResultDetails />} />
            <Route path="materials" element={<AdminMaterials />} />
            <Route path="edit-test/:id" element={<EditTest />} />
          </Routes>

        </div>

        {/* FOOTER */}
        <div className="app-footer">
          <div className="footer-content">
            © {new Date().getFullYear()} Gurukul success classes, Developed by{" "}
            <a
              href="https://brandmatedigital.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="brandmate-link"
            >
              Brandmate digital
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminPage;