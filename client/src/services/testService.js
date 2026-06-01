import API from "./api";

// ================= CREATE TEST =================
export const createTest = async (test) => {
  try {
    const res = await API.post("/tests", test);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.msg || "Create test failed ❌"
    );
  }
};

// ================= STUDENT: GET LIVE TESTS =================
export const getTests = async () => {
  try {
    const res = await API.get("/tests/live");
    return res.data;
  } catch (err) {
    console.error("Get Tests Error:", err);
    throw err;
  }
};

// ================= ADMIN: GET ALL TESTS =================
export const getAdminTests = async () => {
  try {
    const res = await API.get("/tests");
    return res.data;
  } catch (err) {
    console.error("Admin Tests Error:", err);
    throw err;
  }
};

// ================= GET TEST BY ID =================
export const getTestById = async (id) => {
  try {
    const res = await API.get(`/tests/${id}`);
    return res.data;
  } catch (err) {
    console.error("Get Test Error:", err);
    throw err;
  }
};

// ================= DELETE TEST =================
export const deleteTest = async (id) => {
  try {
    const res = await API.delete(`/tests/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.msg || "Delete failed ❌"
    );
  }
};

// ================= TOGGLE TEST =================
export const toggleTestStatus = async (id) => {
  try {
    const res = await API.put(`/tests/${id}/toggle`);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.msg || "Toggle failed ❌"
    );
  }
};

// ================= UPDATE TEST =================
export const updateTest = async (id, data) => {
  try {
    const res = await API.put(`/tests/${id}`, data);
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.msg || "Update failed ❌"
    );
  }
};