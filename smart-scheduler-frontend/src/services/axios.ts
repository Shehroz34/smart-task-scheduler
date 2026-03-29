import axios from "axios";

const apiClient = axios.create({
  // Keep the planner view pointed at the backend root so new endpoints can be added cleanly.
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5050",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    // Reuse the existing JWT auth flow for all timetable requests.
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
