import "./Navbar.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={`navbar ${user?.role === "admin" ? "admin-nav" : "student-nav"}`}>

      {/* LEFT */}
      <div className="nav-left">
        <div className="brand">
          <div className="brand-icon">
            <img src="/logo.jpeg" alt="gurukul logo" />
          </div>

          <div className="brand-text">
            <h3 className="brand-title">Gurukul Success Classes</h3>
            <p className="brand-tagline">Aptitude Today, Success Tomorrow</p>
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="nav-right">

        {/* 🔥 show only for admin */}
        {user?.role === "admin" && (
          <div className="badge">Admin Panel</div>
        )}

        {/* USER ICON */}
        <div className="user-icon">
          {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
        </div>

        {/* ROLE */}
        <div className="user-info">
          {user?.role === "admin" ? "Admin" : "Student"}
        </div>

        {/* LOGOUT */}
        <button
          className="btn-logout"
          onClick={() => {
            logout();
            navigate("/"); // ✅ clean redirect
          }}
        >
          Logout
        </button>

      </div>
    </div>
  );
};

export default Navbar;