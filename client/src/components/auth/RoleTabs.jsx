import "./RoleTabs.css";

const RoleTabs = ({ role, setRole }) => {
  return (
    <div className="role-tabs">
      <button
        className={`role-tab ${role === "student" ? "active" : ""}`}
        onClick={() => setRole("student")}
      >
        👨‍🎓 Student
      </button>

      <button
        className={`role-tab ${role === "admin" ? "active" : ""}`}
        onClick={() => setRole("admin")}
      >
        👨‍💼 Admin
      </button>
    </div>
  );
};

export default RoleTabs;