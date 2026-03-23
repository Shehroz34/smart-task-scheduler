import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <nav
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
      }}
    >
      <div>
        <Link to="/" style={{ marginRight: "16px" }}>
          Dashboard
        </Link>
        <Link to="/tasks" style={{ marginRight: "16px" }}>
          Tasks
        </Link>
        <Link to="/schedule">Schedule</Link>
      </div>

      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;