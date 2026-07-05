import { axiosClient } from "./axiosClient";

export const contactApi = {
  create: (payload) => axiosClient.post("/contacts", payload),
};
