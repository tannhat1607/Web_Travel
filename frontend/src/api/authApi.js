import { axiosClient } from "./axiosClient";

export const authApi = {
  register: (payload) => axiosClient.post("/auth/register", payload),
  login: (payload) => axiosClient.post("/auth/login", payload),
  me: () => axiosClient.get("/auth/me"),
  updateProfile: (payload) => axiosClient.patch("/auth/me", payload),
  changePassword: (payload) => axiosClient.patch("/auth/me/password", payload),
  updateAvatar: (payload) => axiosClient.patch("/auth/me/avatar", payload),
};
