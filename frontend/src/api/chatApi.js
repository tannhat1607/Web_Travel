import { axiosClient } from "./axiosClient";

export const chatApi = {
  send: (payload) => axiosClient.post("/chat", payload),
  messages: (sessionId) => axiosClient.get("/chat/messages", { params: { session_id: sessionId } }),
};
