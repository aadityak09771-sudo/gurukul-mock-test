import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // ✅ Increased to 120s to allow Render's free tier to wake up smoothly

  // ✅ DEFAULT HEADERS
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= REQUEST INTERCEPTOR =================
API.interceptors.request.use(
  (config) => {
    let token = null;

    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const data = JSON.parse(raw);
        token = data?.token;
      }
    } catch (error) {
      console.warn("⚠️ Token parse error:", error);
      localStorage.removeItem("auth");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
API.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    // 🔐 UNAUTHORIZED
    if (status === 401) {
      console.warn("🔒 Unauthorized - Logging out");

      localStorage.removeItem("auth");

      // ✅ SAFE REDIRECT
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    // 🌐 NETWORK ERROR
    if (!error.response) {
      console.error("🚫 Network error - Backend not reachable");
    }

    // 🐞 DEBUG LOG
    console.error("API ERROR:", {
      url: error.config?.url,
      method: error.config?.method,
      status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default API;