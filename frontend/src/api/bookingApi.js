import { axiosClient } from "./axiosClient";

export const bookingApi = {
  create: (payload) => axiosClient.post("/bookings", payload),
  mine: () => axiosClient.get("/bookings/me"),
  cancel: (id) => axiosClient.patch(`/bookings/${id}/cancel`),
};
