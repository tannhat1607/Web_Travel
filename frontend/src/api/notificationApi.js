import { axiosClient } from "./axiosClient";

export const notificationApi = {
  list: (params) => axiosClient.get("/notifications", { params }),
  read: (id) => axiosClient.patch(`/notifications/${id}/read`),
};
