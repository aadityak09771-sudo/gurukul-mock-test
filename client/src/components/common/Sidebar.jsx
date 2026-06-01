import "./sidebar.css";

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="sidebar">

      <div
        className={activeTab === "dashboard" ? "active" : ""}
        onClick={() => setActiveTab("dashboard")}
      >
        📊 Dashboard
      </div>

      <div
        className={activeTab === "create" ? "active" : ""}
        onClick={() => setActiveTab("create")}
      >
        ➕ Create Test
      </div>

      <div
        className={activeTab === "tests" ? "active" : ""}
        onClick={() => setActiveTab("tests")}
      >
        📄 Manage Tests
      </div>

      <div
        className={activeTab === "results" ? "active" : ""}
        onClick={() => setActiveTab("results")}
      >
        📈 Student Results
      </div>

      <div
        className={activeTab === "students" ? "active" : ""}
        onClick={() => setActiveTab("students")}
      >
        👥 Students
      </div>

      {/* ✅ PAYMENT OPTION */}
      <div
        className={activeTab === "payments" ? "active" : ""}
        onClick={() => {
          console.log("clicked payments"); // debug
          setActiveTab("payments");
        }}
      >
        💳 Payments
      </div>

    </div>
  );
};

export default Sidebar;