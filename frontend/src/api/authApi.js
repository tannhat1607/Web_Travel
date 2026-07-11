import { axiosClient } from "./axiosClient";

export const authApi = {
  register: (payload) => axiosClient.post("/auth/register", payload),
  login: (payload) => axiosClient.post("/auth/login", payload),
  forgotPassword: (payload) => axiosClient.post("/auth/forgot-password", payload),
  resetPassword: (payload) => axiosClient.post("/auth/reset-password", payload),
  me: () => axiosClient.get("/auth/me"),
  updateProfile: (payload) => axiosClient.patch("/auth/me", payload),
  changePassword: (payload) => axiosClient.patch("/auth/me/password", payload),
  updateAvatar: (payload) => axiosClient.patch("/auth/me/avatar", payload),
  uploadAvatar: (formData) => axiosClient.post("/auth/me/avatar-upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};
