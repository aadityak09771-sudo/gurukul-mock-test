import axios from "axios";

// ✅ SMART URL SWITCHER: Local par hamesha local backend, aur Live par VITE_API_URL chalega!
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal 
  ? "http://localhost:5000/api" 
  : (import.meta.env.VITE_API_URL || "http://localhost:5000/api");

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
        
        // ✅ ANTI-VIRUS: Purane atke hue ziddi token ko detect karke nuke (delete) karein
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              let payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
              while (payloadBase64.length % 4) {
                payloadBase64 += '=';
              }
              const decoded = JSON.parse(atob(payloadBase64));
              if (decoded.id === "admin" || decoded.id === "superadmin") {
                localStorage.removeItem("auth");
                window.location.href = "/";
                return Promise.reject("Old invalid token forcefully deleted");
              }
            } else if (token === "admin") {
              localStorage.removeItem("auth");
              window.location.href = "/";
              return Promise.reject("Old invalid token forcefully deleted");
            }
          } catch (e) {
            console.warn("Token check failed, proceeding safely.", e);
          }
        }
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