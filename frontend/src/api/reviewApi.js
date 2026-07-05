import { axiosClient } from "./axiosClient";

export const reviewApi = {
  byTour: (tourId) => axiosClient.get(`/reviews/tour/${tourId}`),
  eligibility: (tourId) => axiosClient.get(`/reviews/tour/${tourId}/eligibility`),
  create: (payload) => axiosClient.post("/reviews", payload),
};
