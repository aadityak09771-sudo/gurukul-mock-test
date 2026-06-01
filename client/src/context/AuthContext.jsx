import React, { createContext, useContext, useState } from "react";
import { loginStudent, registerStudent } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // ================= INITIAL STATE =================
  const [user, setUser] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem("auth"));
      return data?.user || null;
    } catch {
      return null;
    }
  });

  // ================= REGISTER =================
  const register = async (name, email, password, role = "student") => {
    try {
      const data = await registerStudent(name, email, password, role);

      // ✅ Save token + user
      localStorage.setItem("auth", JSON.stringify(data));

      setUser(data.user);

      return data.user;

    } catch (err) {
      console.error("Register Error:", err.message);
      throw err;
    }
  };

  // ================= LOGIN =================
  const login = async (email, password) => {
    try {

      // ✅ SINGLE LOGIN (admin + student handled in backend)
      const data = await loginStudent(email, password);

      localStorage.setItem("auth", JSON.stringify(data));
      setUser(data.user);

      return data.user;

    } catch (err) {
      console.error("Login Error:", err.message);
      throw err;
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    try {
      localStorage.removeItem("auth");
      setUser(null);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  // ================= ROLE HELPERS =================
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        logout,
        isAdmin,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ================= CUSTOM HOOK =================
export const useAuth = () => useContext(AuthContext);