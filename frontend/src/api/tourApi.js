import { axiosClient } from "./axiosClient";

export const tourApi = {
  list: (params) => axiosClient.get("/tours", { params }),
  detail: (id) => axiosClient.get(`/tours/${id}`),
};
