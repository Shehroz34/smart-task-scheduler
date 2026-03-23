import { useEffect, useState } from "react";
import api from "../api/axios";

interface PlannedTaskBlock {
  taskId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  duration: number;
  priority: string;
  deadline: string;
  status: "scheduled" | "splitAcrossDays" | "atRisk";
}

interface TaskPlanningSummary {
  taskId: string;
  title: string;
  totalDuration: number;
  scheduledDuration: number;
  remainingDuration: number;
  deadline: string;
  priority: string;
  status: "scheduled" | "splitAcrossDays" | "atRisk" | "missedDeadline";
  reason?: string;
}

interface ScheduleResponse {
  availability: {
    availableFrom: string;
    availableTo: string;
    breakStart: string;
    breakEnd: string;
  };
  totalTasks: number;
  totalBlocks: number;
  stats: {
    scheduled: number;
    splitAcrossDays: number;
    atRisk: number;
    missedDeadline: number;
  };
  plan: PlannedTaskBlock[];
  summaries: TaskPlanningSummary[];
}

function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchSchedule() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/schedule/plan");
      setSchedule(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  async function handleReplan() {
    try {
      setError("");
      const response = await api.get("/schedule/replan");
      setSchedule(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to replan schedule");
    }
  }

  useEffect(() => {
    fetchSchedule();
  }, []);

  if (loading) {
    return <p>Loading schedule...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Schedule</h1>

      <button onClick={handleReplan}>Replan Schedule</button>

      {error && <p>{error}</p>}

      {schedule && (
        <>
          <h2>Stats</h2>
          <p>Total Tasks: {schedule.totalTasks}</p>
          <p>Total Blocks: {schedule.totalBlocks}</p>
          <p>Scheduled: {schedule.stats.scheduled}</p>
          <p>Split Across Days: {schedule.stats.splitAcrossDays}</p>
          <p>At Risk: {schedule.stats.atRisk}</p>
          <p>Missed Deadline: {schedule.stats.missedDeadline}</p>

          <h2>Plan</h2>
          {schedule.plan.map((block, index) => (
            <div
              key={`${block.taskId}-${index}`}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
              }}
            >
              <h3>{block.title}</h3>
              <p>Date: {block.date}</p>
              <p>
                Time: {block.start} - {block.end}
              </p>
              <p>Duration: {block.duration} minutes</p>
              <p>Status: {block.status}</p>
              <p>Priority: {block.priority}</p>
            </div>
          ))}

          <h2>Summaries</h2>
          {schedule.summaries.map((item) => (
            <div
              key={item.taskId}
              style={{
                border: "1px solid #aaa",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
              }}
            >
              <h3>{item.title}</h3>
              <p>Status: {item.status}</p>
              <p>Total Duration: {item.totalDuration}</p>
              <p>Scheduled Duration: {item.scheduledDuration}</p>
              <p>Remaining Duration: {item.remainingDuration}</p>
              {item.reason && <p>Reason: {item.reason}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Schedule;