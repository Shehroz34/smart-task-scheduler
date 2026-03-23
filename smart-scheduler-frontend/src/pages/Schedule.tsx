import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
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
  const [success, setSuccess] = useState("");

  const [availableFrom, setAvailableFrom] = useState("09:00");
  const [availableTo, setAvailableTo] = useState("18:00");
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("14:00");

  async function fetchSchedule() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/schedule/plan");
      const data = response.data;

      setSchedule(data);

      if (data.availability) {
        setAvailableFrom(data.availability.availableFrom);
        setAvailableTo(data.availability.availableTo);
        setBreakStart(data.availability.breakStart);
        setBreakEnd(data.availability.breakEnd);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  async function handleReplan() {
    try {
      setError("");
      setSuccess("");

      const response = await api.get("/schedule/replan");
      const data = response.data;

      setSchedule(data);
      setSuccess("Schedule replanned successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to replan schedule");
    }
  }

  async function handleUpdateAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      await api.put("/users/availability", {
        availableFrom,
        availableTo,
        breakStart,
        breakEnd,
      });

      const response = await api.get("/schedule/plan");
      const data = response.data;

      setSchedule(data);
      setSuccess("Availability updated successfully");
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0]?.message || "Validation failed");
      } else {
        setError(err.response?.data?.message || "Failed to update availability");
      }
    }
  }

  useEffect(() => {
    fetchSchedule();
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <p style={{ padding: "20px" }}>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div>
    <Navbar />
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Schedule</h1>

      <form
        onSubmit={handleUpdateAvailability}
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <h2>Availability</h2>

        <div style={{ marginBottom: "10px" }}>
          <label>Available From</label>
          <input
            type="time"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            style={{ display: "block", padding: "8px", width: "100%", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Available To</label>
          <input
            type="time"
            value={availableTo}
            onChange={(e) => setAvailableTo(e.target.value)}
            style={{ display: "block", padding: "8px", width: "100%", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Break Start</label>
          <input
            type="time"
            value={breakStart}
            onChange={(e) => setBreakStart(e.target.value)}
            style={{ display: "block", padding: "8px", width: "100%", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Break End</label>
          <input
            type="time"
            value={breakEnd}
            onChange={(e) => setBreakEnd(e.target.value)}
            style={{ display: "block", padding: "8px", width: "100%", marginTop: "4px" }}
          />
        </div>

        <button type="submit">Update Availability</button>
        <button
          type="button"
          onClick={handleReplan}
          style={{ marginLeft: "10px" }}
        >
          Replan Schedule
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {schedule && (
        <>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <h2>Stats</h2>
            <p>Total Tasks: {schedule.totalTasks}</p>
            <p>Total Blocks: {schedule.totalBlocks}</p>
            <p>Scheduled: {schedule.stats.scheduled}</p>
            <p>Split Across Days: {schedule.stats.splitAcrossDays}</p>
            <p>At Risk: {schedule.stats.atRisk}</p>
            <p>Missed Deadline: {schedule.stats.missedDeadline}</p>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h2>Planned Blocks</h2>

            {schedule.plan.length === 0 ? (
              <p>No planned blocks found.</p>
            ) : (
              schedule.plan.map((block, index) => (
                <div
                  key={`${block.taskId}-${index}`}
                  style={{
                    border: "1px solid #ccc",
                    padding: "16px",
                    marginBottom: "12px",
                    borderRadius: "8px",
                  }}
                >
                  <h3>{block.title}</h3>
                  <p>Date: {block.date}</p>
                  <p>
                    Time: {block.start} - {block.end}
                  </p>
                  <p>Duration: {block.duration} minutes</p>
                  <p>Priority: {block.priority}</p>
                  <p>Status: {block.status}</p>
                </div>
              ))
            )}
          </div>

          <div>
            <h2>Task Summaries</h2>

            {schedule.summaries.length === 0 ? (
              <p>No summaries found.</p>
            ) : (
              schedule.summaries.map((item) => (
                <div
                  key={item.taskId}
                  style={{
                    border: "1px solid #aaa",
                    padding: "16px",
                    marginBottom: "12px",
                    borderRadius: "8px",
                  }}
                >
                  <h3>{item.title}</h3>
                  <p>Status: {item.status}</p>
                  <p>Total Duration: {item.totalDuration} minutes</p>
                  <p>Scheduled Duration: {item.scheduledDuration} minutes</p>
                  <p>Remaining Duration: {item.remainingDuration} minutes</p>
                  <p>Priority: {item.priority}</p>
                  <p>Deadline: {new Date(item.deadline).toLocaleString()}</p>
                  {item.reason && <p>Reason: {item.reason}</p>}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
    </div>
  );
}

export default Schedule;