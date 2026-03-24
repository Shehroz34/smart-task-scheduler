import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

interface Task {
  _id: string;
  status: "pending" | "completed";
}

interface ScheduleResponse {
  stats: {
    scheduled: number;
    splitAcrossDays: number;
    atRisk: number;
    missedDeadline: number;
  };
}

function Dashboard() {
  const [totalTasks, setTotalTasks] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [scheduledTasks, setScheduledTasks] = useState(0);
  const [splitTasks, setSplitTasks] = useState(0);
  const [atRiskTasks, setAtRiskTasks] = useState(0);
  const [missedTasks, setMissedTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [tasksResponse, scheduleResponse] = await Promise.all([
        api.get("/tasks"),
        api.get("/schedule/plan"),
      ]);

      const tasks: Task[] = tasksResponse.data.tasks || [];
      const schedule: ScheduleResponse = scheduleResponse.data;

      setTotalTasks(tasks.length);
      setPendingTasks(tasks.filter((task) => task.status === "pending").length);
      setCompletedTasks(tasks.filter((task) => task.status === "completed").length);

      setScheduledTasks(schedule.stats.scheduled || 0);
      setSplitTasks(schedule.stats.splitAcrossDays || 0);
      setAtRiskTasks(schedule.stats.atRisk || 0);
      setMissedTasks(schedule.stats.missedDeadline || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <p style={{ padding: "20px" }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
        <h1>Smart Scheduler Dashboard</h1>
        <p>Welcome to your productivity app.</p>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <div style={cardStyle}>
            <h3>Total Tasks</h3>
            <p style={numberStyle}>{totalTasks}</p>
          </div>

          <div style={cardStyle}>
            <h3>Pending Tasks</h3>
            <p style={numberStyle}>{pendingTasks}</p>
          </div>

          <div style={cardStyle}>
            <h3>Completed Tasks</h3>
            <p style={numberStyle}>{completedTasks}</p>
          </div>

          <div style={cardStyle}>
            <h3>Scheduled</h3>
            <p style={numberStyle}>{scheduledTasks}</p>
          </div>

          <div style={cardStyle}>
            <h3>Split Across Days</h3>
            <p style={numberStyle}>{splitTasks}</p>
          </div>

          <div style={cardStyle}>
            <h3>At Risk</h3>
            <p style={numberStyle}>{atRiskTasks}</p>
          </div>

          <div style={cardStyle}>
            <h3>Missed Deadline</h3>
            <p style={numberStyle}>{missedTasks}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: "10px",
  padding: "20px",
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};

const numberStyle: CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  marginTop: "10px",
};

export default Dashboard;