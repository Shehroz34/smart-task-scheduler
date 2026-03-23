import Navbar from "../components/Navbar";

function Dashboard() {
  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h1>Smart Scheduler Dashboard</h1>
        <p>Welcome to your productivity app.</p>
      </div>
    </div>
  );
}

export default Dashboard;