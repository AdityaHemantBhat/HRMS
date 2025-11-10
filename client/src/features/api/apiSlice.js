import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Detect if we're accessing from network (not localhost)
const getApiUrl = () => {
  // In production, API is on same server
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }

  const hostname = window.location.hostname;

  // If accessing via network IP (192.168.x.x or 10.x.x.x), use that IP for API
  if (
    hostname.match(/^192\.168\.\d+\.\d+$/) ||
    hostname.match(/^10\.\d+\.\d+\.\d+$/)
  ) {
    return `http://${hostname}:5000/api`;
  }

  // Otherwise use localhost
  return "http://localhost:5000/api";
};

const baseQuery = fetchBaseQuery({
  baseUrl: getApiUrl(),
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage (set after login)
    const token = localStorage.getItem("token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "User",
    "Employee",
    "Attendance",
    "Leave",
    "Payroll",
    "Project",
    "Task",
    "Goal",
    "Feedback",
    "Notification",
    "Dashboard",
  ],
  endpoints: (builder) => ({}),
});
