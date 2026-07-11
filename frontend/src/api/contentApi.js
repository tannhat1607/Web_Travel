import {axiosClient} from "./axiosClient";
export const contentApi={list:(params)=>axiosClient.get("/content",{params}),admin:(params)=>axiosClient.get("/content/admin",{params}),create:(p)=>axiosClient.post("/content/admin",p),update:(id,p)=>axiosClient.patch(`/content/admin/${id}`,p),remove:(id)=>axiosClient.delete(`/content/admin/${id}`)};
