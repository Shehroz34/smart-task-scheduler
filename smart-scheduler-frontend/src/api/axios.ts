import axios from "axios";
import { logger } from "@/lib/logger";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  logger.debug("API request", {
    method: config.method,
    url: `${config.baseURL || ""}${config.url || ""}`,
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    logger.debug("API response", {
      status: response.status,
      url: response.config.url,
    });

    return response;
  },
  (error) => {
    logger.error("API response error", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;
