import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Smart Scheduler Dashboard</h1>
      <p>Welcome to your productivity app.</p>

      <div style={{ marginTop: "20px" }}>
        <Link to="/tasks">
          <button>Go to Tasks</button>
        </Link>

        <Link to="/schedule" style={{ marginLeft: "10px" }}>
          <button>Go to Schedule</button>
        </Link>

        <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;