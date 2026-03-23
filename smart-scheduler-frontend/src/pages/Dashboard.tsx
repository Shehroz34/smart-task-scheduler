import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <nav>
        <Link to="/tasks">Tasks</Link> |{" "}
        <Link to="/schedule">Schedule</Link>
      </nav>
    </div>
  );
}

export default Dashboard;