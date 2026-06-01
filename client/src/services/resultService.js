import API from "./api";

// ================= SUBMIT RESULT =================
export const submitResult = (data) => {
  return API.post("/results", data);
};

// ================= GET ALL RESULTS =================
export const getAllResults = () => {
  return API.get("/results");
};

// ================= GET RESULT BY ID =================
export const getResultById = (id) => {
  return API.get(`/results/${id}`);
};

// ================= GET STUDENT RESULTS =================
export const getMyResults = () => {
  return API.get("/results/my");
};