import { axiosClient } from "./axiosClient";

export const chatApi = {
  send: (payload) => axiosClient.post("/chat", payload),
};
