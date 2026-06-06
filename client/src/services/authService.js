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

// ================= FORGOT PASSWORD =================
export const forgotPasswordAPI = async (email) => {
  try {
    const res = await API.post("/auth/forgot-password", { email });
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.msg || "Failed to send OTP ❌"
    );
  }
};

// ================= RESET PASSWORD =================
export const resetPasswordAPI = async (email, otp, newPassword) => {
  try {
    const res = await API.post("/auth/reset-password", { email, otp, newPassword });
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.msg || "Failed to reset password ❌"
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

// ================= SUPER ADMIN =================
export const getAdminsAPI = async () => {
  try {
    const res = await API.get("/auth/admins");
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.msg || "Failed to fetch admins ❌");
  }
};

export const updateAdminPasswordAPI = async (adminId, newPassword) => {
  try {
    const res = await API.put("/auth/admins/update-password", { adminId, newPassword });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.msg || "Failed to update password ❌");
  }
};

// ================= CHANGE MY PASSWORD =================
export const changeMyPasswordAPI = async (oldPassword, newPassword) => {
  try {
    const res = await API.put("/auth/change-password", { oldPassword, newPassword });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.msg || "Failed to change password ❌");
  }
};

export const getAdminCredentialsAPI = async () => {
  try {
    const res = await API.get("/auth/admin-credentials");
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.msg || "Failed to load credentials ❌");
  }
};