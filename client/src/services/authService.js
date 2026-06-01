import API from "./api";

// ================= REGISTER =================
export const registerStudent = async (name, email, password, role) => {
  try {
    const res = await API.post("/auth/register", {
      name,
      email,
      password,
      role,
    });

    return res.data;

  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Register failed ❌"
    );
  }
};

// ================= LOGIN =================
export const loginStudent = async (email, password) => {
  try {
    const res = await API.post("/auth/login", {
      email,
      password,
    });

    return res.data;

  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Login failed ❌"
    );
  }
};

// ================= ADMIN LOGIN =================
export const loginAdmin = async (username, password) => {
  try {
    const res = await API.post("/auth/admin-login", {
      username,
      password,
    });

    return res.data;

  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Admin login failed ❌"
    );
  }
};