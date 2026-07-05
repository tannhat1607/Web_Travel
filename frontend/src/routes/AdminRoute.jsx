import { Navigate } from "react-router-dom";
import { getStoredUser, getToken } from "../store/authStore";

export function AdminRoute({ children }) {
  const user = getStoredUser();
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}
