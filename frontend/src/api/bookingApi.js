import { axiosClient } from "./axiosClient";

export const bookingApi = {
  quote: (payload) => axiosClient.post("/bookings/quote", payload),
  create: (payload) => axiosClient.post("/bookings", payload),
  mine: () => axiosClient.get("/bookings/me"),
  detail: (id) => axiosClient.get(`/bookings/${id}`),
  cancel: (id) => axiosClient.patch(`/bookings/${id}/cancel`),
  simulatePayment: (id, payload) => axiosClient.post(`/bookings/${id}/simulate-payment`, payload),
  requestRefund: (id, payload) => axiosClient.post(`/bookings/${id}/refund-request`, payload),
};
