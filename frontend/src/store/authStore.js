import { authApi } from "../api/authApi";

const USER_KEY = "travel_user";
const TOKEN_KEY = "travel_token";

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth-change"));
}

export async function login(email, password) {
  const tokenResponse = await authApi.login({ email, password });
  localStorage.setItem(TOKEN_KEY, tokenResponse.data.access_token);
  const meResponse = await authApi.me();
  saveStoredUser(meResponse.data);
  return meResponse.data;
}

export async function register(payload) {
  await authApi.register(payload);
  return login(payload.email, payload.password);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth-change"));
}
