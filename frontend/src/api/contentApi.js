import { axiosClient } from "./axiosClient";

export const contentApi = {
  list: (params) => axiosClient.get("/content", { params }),
  detail: (slug) => axiosClient.get(`/content/${encodeURIComponent(slug)}`),
  admin: (params) => axiosClient.get("/content/admin", { params }),
  create: (payload) => axiosClient.post("/content/admin", payload),
  update: (id, payload) => axiosClient.patch(`/content/admin/${id}`, payload),
  remove: (id) => axiosClient.delete(`/content/admin/${id}`),
};
