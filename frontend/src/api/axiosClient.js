import axios from "axios";
import { adminActionMessages, emitAdminStatus } from "../utils/adminStatus.js";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("travel_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (window.location.pathname.startsWith("/admin")) {
    const messages = adminActionMessages(config);
    if (messages) {
      config.adminActionMessages = messages;
      emitAdminStatus({ type: "loading", message: messages[0] });
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    const messages = response.config.adminActionMessages;
    if (messages) emitAdminStatus({ type: "success", message: messages[1] });
    return response;
  },
  (error) => {
    const messages = error.config?.adminActionMessages;
    if (messages) {
      const detail = error.response?.data?.detail;
      emitAdminStatus({
        type: "error",
        message: messages[2],
        detail: typeof detail === "string" ? detail : "Vui lòng kiểm tra dữ liệu và thử lại.",
      });
    }
    return Promise.reject(error);
  },
);
