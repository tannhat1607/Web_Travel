import { axiosClient } from "./axiosClient";

export const promotionApi = {
  list: (params) => axiosClient.get("/promotions", { params }),
};
