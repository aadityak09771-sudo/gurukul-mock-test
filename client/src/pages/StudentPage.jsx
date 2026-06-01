import React, { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/common/Navbar";
import StudentDashboard from "../components/student/StudentDashboard";
import StudentProfile from "./StudentProfile";
import StudentResults from "./StudentResults";
import StudentMaterials from "../components/student/StudentMaterials";

import "./StudentPage.css";

const StudentPage = () => {

  const { user } = useAuth();
  const navigate = useNavigate();

  // 🔐 Protect route (IMPROVED)
  useEffect(() => {
    if (!user) {
      navigate("/");
    } 
    else if (user.role !== "student") {
      navigate("/admin"); // redirect admin properly
    }
  }, [user, navigate]);

  // ⛔ Prevent render until auth check
  if (!user || user.role !== "student") {
    return null;
  }

  return (
    <div className="student-screen">

      {/* ✅ Navbar */}
      <Navbar />

      {/* ✅ Content */}
      <div className="student-content">
        <Routes>
          <Route path="/" element={<StudentDashboard user={user} />} />
          <Route path="profile/:id" element={<StudentProfile />} />
          <Route path="my-results" element={<StudentResults />} />
          <Route path="materials" element={<StudentMaterials />} />
        </Routes>
      </div>

    </div>
  );
};

export default StudentPage;