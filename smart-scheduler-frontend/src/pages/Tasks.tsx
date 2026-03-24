import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

interface Task {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  deadline: string;
  priority: "low" | "medium" | "high";
  difficulty: "easy" | "medium" | "hard";
  status: "pending" | "completed";
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  async function fetchTasks() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/tasks");
      setTasks(response.data.tasks || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDuration("");
    setDeadline("");
    setPriority("medium");
    setDifficulty("medium");
    setEditingTaskId(null);
    setFormError("");
  }

  function handleEditTask(task: Task) {
    setEditingTaskId(task._id);
    setTitle(task.title);
    setDescription(task.description || "");
    setDuration(String(task.duration));

    const localDate = new Date(task.deadline);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");

    setDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    setPriority(task.priority);
    setDifficulty(task.difficulty);
    setFormError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    try {
      const payload = {
        title,
        description,
        duration: Number(duration),
        deadline: new Date(deadline).toISOString(),
        priority,
        difficulty,
      };

      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
      } else {
        await api.post("/tasks", payload);
      }

      resetForm();
      fetchTasks();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const firstError = err.response.data.errors[0]?.message;
        setFormError(firstError || "Failed to save task");
      } else {
        setFormError(err.response?.data?.message || "Failed to save task");
      }
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await api.patch(`/tasks/${taskId}/complete`);
      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete task");
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await api.delete(`/tasks/${taskId}`);

      if (editingTaskId === taskId) {
        resetForm();
      }

      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <p style={{ padding: "20px" }}>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
        <h1>Tasks</h1>

        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid #ccc",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <h2>{editingTaskId ? "Edit Task" : "Create Task"}</h2>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "10px", minHeight: "80px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="number"
              placeholder="Duration in minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              style={{ width: "100%", padding: "10px" }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              style={{ width: "100%", padding: "10px" }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button type="submit">
            {editingTaskId ? "Update Task" : "Create Task"}
          </button>

          {editingTaskId && (
            <button
              type="button"
              onClick={resetForm}
              style={{ marginLeft: "10px" }}
            >
              Cancel Edit
            </button>
          )}

          {formError && <p style={{ color: "red" }}>{formError}</p>}
        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              style={{
                border: "1px solid #ccc",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "8px",
              }}
            >
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <p>Duration: {task.duration} minutes</p>
              <p>Deadline: {new Date(task.deadline).toLocaleString()}</p>
              <p>Priority: {task.priority}</p>
              <p>Difficulty: {task.difficulty}</p>
              <p>Status: {task.status}</p>

              <div style={{ marginTop: "10px" }}>
                <button onClick={() => handleEditTask(task)}>Edit</button>

                {task.status === "pending" && (
                  <button
                    onClick={() => handleCompleteTask(task._id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Mark Complete
                  </button>
                )}

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Tasks;